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
        const { searchParams } = new URL(request.url);
        
        // Parse query parameters
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || undefined;
        const sortBy = searchParams.get('sortBy') as 'createdAt' | 'title' || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

        // Validate parameters
        if (page < 1 || limit < 1 || limit > 100) {
            return createErrorResponse("INVALID_PARAMETERS", 400, "Invalid pagination parameters");
        }

        const result = await NewsService.getNews({
            page,
            limit,
            search,
            sortBy,
            sortOrder
        });

        return createSuccessResponse(
            result.data,
            200,
            "News fetched successfully",
            result.pagination
        );
    } catch (error) {
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

