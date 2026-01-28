import { db } from '@/lib/db';

/**
 * Enhanced monthly theme bonus detection
 */
export async function calculateThemeBonus(
    visitDate: Date,
    places: Array<{ name: string; description?: string }>,
    routeDescription?: string
): Promise<{ bonus: number; matchedKeywords: string[] }> {
    // Ensure visitDate is a Date object
    const date = new Date(visitDate);
    const month = date.getMonth() + 1; // 1-12
    const year = date.getFullYear();

    // Fetch active theme for this month
    const theme = await db.monthlyTheme.findFirst({
        where: { year, month }
    });

    if (!theme || !theme.keywords) {
        return { bonus: 0, matchedKeywords: [] };
    }

    // Keywords are stored as string[] in JSON, Prisma types might need casting or it's handled
    // Assuming theme.keywords is string[] or similar iterable
    const keywords = (Array.isArray(theme.keywords) ? theme.keywords : []) as string[];
    const normalizedKeywords = keywords.map(k => k.toLowerCase());
    const matchedKeywords: string[] = [];

    if (normalizedKeywords.length === 0) {
        return { bonus: 0, matchedKeywords: [] };
    }

    // Search in place names and descriptions
    places.forEach(place => {
        const searchText = `${place.name} ${place.description || ''}`.toLowerCase();
        normalizedKeywords.forEach(keyword => {
            if (searchText.includes(keyword) && !matchedKeywords.includes(keyword)) {
                matchedKeywords.push(keyword);
            }
        });
    });

    // Search in route description
    if (routeDescription) {
        const routeText = routeDescription.toLowerCase();
        normalizedKeywords.forEach(keyword => {
            if (routeText.includes(keyword) && !matchedKeywords.includes(keyword)) {
                matchedKeywords.push(keyword);
            }
        });
    }

    // Bonus logic: 5 points if any keyword matches
    const bonus = matchedKeywords.length > 0 ? 5 : 0;
    return { bonus, matchedKeywords };
}
