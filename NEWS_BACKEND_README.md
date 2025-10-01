# News Backend Architecture

## Overview

The news backend has been completely refactored to provide a more logical, maintainable, and scalable architecture. The new system includes proper validation, error handling, caching, and a centralized service layer.

## Architecture Components

### 1. News Service (`lib/news-service.ts`)

Centralized service class that handles all news-related operations:

```typescript
class NewsService {
  static async getNews(params: NewsListParams): Promise<NewsListResponse>
  static async getNewsById(id: string): Promise<NewsItem | null>
  static async createNews(data: CreateNewsData): Promise<NewsItem>
  static async updateNews(id: string, data: UpdateNewsData): Promise<NewsItem>
  static async deleteNews(id: string): Promise<void>
  static async getNewsStats(): Promise<NewsStats>
}
```

**Features:**
- Input validation and sanitization
- Permission checking (Admin-only for CUD operations)
- Proper error handling with meaningful messages
- Data cleaning and normalization
- Statistics generation

### 2. API Response Utilities (`lib/api-response.ts`)

Standardized response format for all API endpoints:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
}
```

**Features:**
- Consistent response structure
- Proper HTTP status codes
- Error categorization
- Caching headers
- Request body validation

### 3. API Endpoints

#### GET `/api/news`
- **Purpose**: List all news with pagination and filtering
- **Query Parameters**:
  - `page` (default: 1)
  - `limit` (default: 20, max: 100)
  - `search` (optional)
  - `sortBy` ('createdAt' | 'title', default: 'createdAt')
  - `sortOrder` ('asc' | 'desc', default: 'desc')

#### GET `/api/news/[id]`
- **Purpose**: Get single news item by ID
- **Response**: News item or 404 if not found

#### POST `/api/news`
- **Purpose**: Create new news item
- **Authentication**: Admin only
- **Body**: `{ title: string, content?: string, images?: ImageSource[] }`

#### PUT `/api/news/[id]`
- **Purpose**: Update existing news item
- **Authentication**: Admin only
- **Body**: Partial update data

#### DELETE `/api/news/[id]`
- **Purpose**: Delete news item
- **Authentication**: Admin only

#### GET `/api/news/stats`
- **Purpose**: Get news statistics
- **Response**: `{ total: number, thisMonth: number, thisYear: number }`

### 4. React Hook (`hooks/useNews.ts`)

Custom hook for managing news data in React components:

```typescript
const {
  news,
  isLoading,
  error,
  pagination,
  fetchNews,
  createNews,
  updateNews,
  deleteNews,
  refetch
} = useNews({
  autoFetch: true,
  page: 1,
  limit: 20,
  search: 'query'
});
```

**Features:**
- Automatic caching
- Error handling with toast notifications
- Optimistic updates
- Pagination support
- Search functionality

## Data Flow

```
Frontend Component
       ↓
   useNews Hook
       ↓
   API Endpoint
       ↓
   NewsService
       ↓
   Database (Prisma)
       ↓
   Response Utils
       ↓
   Frontend Component
```

## Error Handling

The system provides comprehensive error handling:

1. **Validation Errors**: 400 status with detailed field errors
2. **Authentication Errors**: 403 status for unauthorized access
3. **Not Found Errors**: 404 status for missing resources
4. **Server Errors**: 500 status for unexpected issues

All errors include:
- Error code for programmatic handling
- Human-readable message
- Optional details object

## Caching Strategy

- **Public endpoints**: 30-second cache with stale-while-revalidate
- **Admin endpoints**: No caching for real-time updates
- **Client-side**: React hook caching with automatic refetch

## Security

- **Admin-only operations**: Create, Update, Delete require ADMIN role
- **Input validation**: All inputs are validated and sanitized
- **SQL injection protection**: Prisma ORM prevents SQL injection
- **XSS protection**: Content is properly escaped

## Performance Optimizations

1. **Database queries**: Optimized with proper indexing and select statements
2. **Pagination**: Prevents large data transfers
3. **Caching**: Reduces database load
4. **Parallel queries**: Statistics are fetched in parallel
5. **Error boundaries**: Prevents cascade failures

## Migration from Old System

The new system is backward compatible:

1. **API responses**: Support both new and old formats
2. **Frontend components**: Updated to handle new response format
3. **Gradual migration**: Old components continue to work

## Usage Examples

### Frontend Component
```typescript
import { useNews } from '@/hooks/useNews';

function NewsList() {
  const { news, isLoading, error, createNews } = useNews();
  
  const handleCreate = async () => {
    await createNews({
      title: 'New Article',
      content: 'Article content...'
    });
  };
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {news.map(item => (
        <div key={item.id}>{item.title}</div>
      ))}
    </div>
  );
}
```

### Direct API Usage
```typescript
// Fetch news with pagination
const response = await fetch('/api/news?page=1&limit=10&search=query');
const data = await response.json();

// Create news
const newNews = await fetch('/api/news', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'New Article' })
});
```

## Future Enhancements

1. **Full-text search**: Implement advanced search with MongoDB text indexes
2. **Image optimization**: Automatic image resizing and optimization
3. **Content moderation**: AI-powered content filtering
4. **Analytics**: Detailed readership statistics
5. **Scheduling**: Publish news at specific times
6. **Categories**: Organize news by categories
7. **Tags**: Add tagging system for better organization
