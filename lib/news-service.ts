/**
 * Centralized News Service for managing news articles
 */

import { db } from "@/lib/db";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { safeStringConversion, safeDateConversion } from "@/lib/data-validation";

// Types
export interface NewsItem {
  id: string;
  title: string;
  content?: string;
  createdAt: Date;
  images?: ImageSource[];
}

export interface ImageSource {
  url: string;
  public_id: string;
  title: string;
}

export interface CreateNewsData {
  title: string;
  content?: string;
  images?: ImageSource[];
}

export interface UpdateNewsData {
  title?: string;
  content?: string;
  images?: ImageSource[];
}

export interface NewsListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface NewsListResponse {
  data: NewsItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Validation functions
function validateNewsData(data: Partial<CreateNewsData>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.title || safeStringConversion(data.title).trim().length === 0) {
    errors.push("Title is required");
  }

  if (data.title && safeStringConversion(data.title).length > 200) {
    errors.push("Title must be less than 200 characters");
  }

  if (data.content && safeStringConversion(data.content).length > 10000) {
    errors.push("Content must be less than 10,000 characters");
  }

  if (data.images && !Array.isArray(data.images)) {
    errors.push("Images must be an array");
  }

  if (data.images && Array.isArray(data.images)) {
    data.images.forEach((img, index) => {
      if (!img.url || !img.public_id) {
        errors.push(`Image ${index + 1} must have url and public_id`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function cleanNewsData(rawNews: Record<string, unknown>): NewsItem {
  return {
    id: safeStringConversion(rawNews.id || rawNews._id),
    title: safeStringConversion(rawNews.title),
    content: rawNews.content ? safeStringConversion(rawNews.content) : undefined,
    createdAt: safeDateConversion(rawNews.createdAt) || new Date(),
    images: Array.isArray(rawNews.images) ? rawNews.images as ImageSource[] : undefined
  };
}

// Service functions
export class NewsService {
  /**
   * Get all news with pagination and filtering
   */
  static async getNews(params: NewsListParams = {}): Promise<NewsListResponse> {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;

    try {
      const skip = (page - 1) * limit;
      
      // Build where clause
      const where: Record<string, unknown> = {};
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Execute queries in parallel
      const [news, total] = await Promise.all([
        db.news.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            images: true
          }
        }),
        db.news.count({ where })
      ]);

      const cleanedNews = news.map(cleanNewsData);
      const totalPages = Math.ceil(total / limit);

      return {
        data: cleanedNews,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      console.error("Error fetching news:", error);
      throw new Error("Failed to fetch news");
    }
  }

  /**
   * Get single news item by ID
   */
  static async getNewsById(id: string): Promise<NewsItem | null> {
    if (!id) {
      throw new Error("News ID is required");
    }

    try {
      const news = await db.news.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          images: true
        }
      });

      return news ? cleanNewsData(news) : null;
    } catch (error) {
      console.error("Error fetching news item:", error);
      throw new Error("Failed to fetch news item");
    }
  }

  /**
   * Create new news item
   */
  static async createNews(data: CreateNewsData): Promise<NewsItem> {
    // Check permissions
    const role = await currentRole();
    if (role !== UserRole.ADMIN) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Validate data
    const validation = validateNewsData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    try {
      const news = await db.news.create({
        data: {
          title: safeStringConversion(data.title).trim(),
          content: data.content ? safeStringConversion(data.content).trim() : null,
          images: data.images as unknown || null
        },
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          images: true
        }
      });

      return cleanNewsData(news);
    } catch (error) {
      console.error("Error creating news:", error);
      throw new Error("Failed to create news item");
    }
  }

  /**
   * Update existing news item
   */
  static async updateNews(id: string, data: UpdateNewsData): Promise<NewsItem> {
    // Check permissions
    const role = await currentRole();
    if (role !== UserRole.ADMIN) {
      throw new Error("Unauthorized: Admin access required");
    }

    if (!id) {
      throw new Error("News ID is required");
    }

    // Validate data
    const validation = validateNewsData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    try {
      // Check if news exists
      const existingNews = await db.news.findUnique({
        where: { id }
      });

      if (!existingNews) {
        throw new Error("News item not found");
      }

      const updateData: Record<string, unknown> = {};
      if (data.title !== undefined) {
        updateData.title = safeStringConversion(data.title).trim();
      }
      if (data.content !== undefined) {
        updateData.content = data.content ? safeStringConversion(data.content).trim() : null;
      }
      if (data.images !== undefined) {
        updateData.images = data.images as unknown || null;
      }

      const news = await db.news.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          images: true
        }
      });

      return cleanNewsData(news);
    } catch (error) {
      console.error("Error updating news:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        throw error;
      }
      throw new Error("Failed to update news item");
    }
  }

  /**
   * Delete news item
   */
  static async deleteNews(id: string): Promise<void> {
    // Check permissions
    const role = await currentRole();
    if (role !== UserRole.ADMIN) {
      throw new Error("Unauthorized: Admin access required");
    }

    if (!id) {
      throw new Error("News ID is required");
    }

    try {
      // Check if news exists
      const existingNews = await db.news.findUnique({
        where: { id }
      });

      if (!existingNews) {
        throw new Error("News item not found");
      }

      await db.news.delete({
        where: { id }
      });
    } catch (error) {
      console.error("Error deleting news:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        throw error;
      }
      throw new Error("Failed to delete news item");
    }
  }

  /**
   * Get news statistics
   */
  static async getNewsStats(): Promise<{
    total: number;
    thisMonth: number;
    thisYear: number;
  }> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      const [total, thisMonth, thisYear] = await Promise.all([
        db.news.count(),
        db.news.count({
          where: {
            createdAt: {
              gte: startOfMonth
            }
          }
        }),
        db.news.count({
          where: {
            createdAt: {
              gte: startOfYear
            }
          }
        })
      ]);

      return {
        total,
        thisMonth,
        thisYear
      };
    } catch (error) {
      console.error("Error fetching news stats:", error);
      throw new Error("Failed to fetch news statistics");
    }
  }
}
