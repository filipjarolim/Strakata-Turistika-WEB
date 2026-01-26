import { NextRequest } from "next/server";
import { NewsService, CreateNewsData } from "@/lib/news-service";
import {
    createSuccessResponse,
    createErrorResponse,
    handleApiError,
    extractRequestBody,
    validateRequiredFields
} from "@/lib/api-response";

export async function GET(request: NextRequest) {
    try {
        console.log("[API_DEBUG] GET /api/news called", request.url);
        const { searchParams } = new URL(request.url);

        // Parse query parameters
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || undefined;
        const tag = searchParams.get('tag') || undefined;
        const authorId = searchParams.get('authorId') || undefined;
        // For public API, default to publishedOnly=true unless user explicitly asks for false (and maybe check admin role? logic handled in service or here)
        // For now, let's allow 'published' param.
        const publishedParam = searchParams.get('published');
        const publishedOnly = publishedParam === 'false' ? false : true;

        const sortBy = searchParams.get('sortBy') as 'createdAt' | 'title' || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

        console.log("[API_DEBUG] /api/news params:", { page, limit, search, tag, authorId, publishedOnly });

        // Validate parameters
        if (page < 1 || limit < 1 || limit > 100) {
            console.warn("[API_DEBUG] /api/news invalid parameters");
            return createErrorResponse("INVALID_PARAMETERS", 400, "Invalid pagination parameters");
        }

        const result = await NewsService.getNews({
            page,
            limit,
            search,
            tag,
            authorId,
            publishedOnly,
            sortBy,
            sortOrder
        });

        console.log("[API_DEBUG] /api/news success, items:", result.data.length);

        const response = createSuccessResponse(
            result.data,
            200,
            "News fetched successfully",
            result.pagination
        );

        // Add CORS headers just in case
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        return response;
    } catch (error) {
        console.error("[API_DEBUG] /api/news fatal error:", error);
        return handleApiError(error, "GET /api/news");
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await extractRequestBody<CreateNewsData>(request);

        // Validate required fields
        const validationErrors = validateRequiredFields(body as unknown as Record<string, unknown>, ['title']);
        if (validationErrors.length > 0) {
            return createErrorResponse("VALIDATION_ERROR", 400, "Validation failed", { errors: validationErrors });
        }

        // Note: NewsService.createNews handles the specific logic for new fields (slug, etc.)

        const news = await NewsService.createNews(body);

        return createSuccessResponse(
            news,
            201,
            "News created successfully"
        );
    } catch (error) {
        return handleApiError(error, "POST /api/news");
    }
}

