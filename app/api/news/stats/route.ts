import { NextRequest } from 'next/server';
import { NewsService } from '@/lib/news-service';
import { 
    createSuccessResponse, 
    handleApiError
} from '@/lib/api-response';

export async function GET(request: NextRequest) {
    try {
        const stats = await NewsService.getNewsStats();
        
        return createSuccessResponse(
            stats,
            200,
            "News statistics fetched successfully"
        );
    } catch (error) {
        return handleApiError(error, "GET /api/news/stats");
    }
}
