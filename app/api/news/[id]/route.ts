import { NextRequest } from 'next/server';
import { NewsService, UpdateNewsData } from '@/lib/news-service';
import { 
    createSuccessResponse, 
    createErrorResponse, 
    handleApiError,
    extractRequestBody,
    validateRequiredFields
} from '@/lib/api-response';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        if (!id) {
            return createErrorResponse("MISSING_ID", 400, "News ID is required");
        }

        const news = await NewsService.getNewsById(id);
        
        if (!news) {
            return createErrorResponse("NOT_FOUND", 404, "News item not found");
        }

        return createSuccessResponse(
            news,
            200,
            "News item fetched successfully"
        );
    } catch (error) {
        return handleApiError(error, "GET /api/news/[id]");
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        if (!id) {
            return createErrorResponse("MISSING_ID", 400, "News ID is required");
        }

        const body = await extractRequestBody<UpdateNewsData>(request);
        
        // Validate that at least one field is provided for update
        const hasUpdateData = body.title !== undefined || 
                             body.content !== undefined || 
                             body.images !== undefined;
        
        if (!hasUpdateData) {
            return createErrorResponse("NO_UPDATE_DATA", 400, "At least one field must be provided for update");
        }

        const news = await NewsService.updateNews(id, body);
        
        return createSuccessResponse(
            news,
            200,
            "News updated successfully"
        );
    } catch (error) {
        return handleApiError(error, "PUT /api/news/[id]");
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        if (!id) {
            return createErrorResponse("MISSING_ID", 400, "News ID is required");
        }

        await NewsService.deleteNews(id);
        
        return createSuccessResponse(
            null,
            204,
            "News deleted successfully"
        );
    } catch (error) {
        return handleApiError(error, "DELETE /api/news/[id]");
    }
}