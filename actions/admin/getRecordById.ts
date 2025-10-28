import { db } from "@/lib/db";

export async function getRecordById(collection: string, id: string) {
    switch (collection) {
        case "User":
            return db.user.findUnique({ where: { id } });
        case "Account":
            return db.account.findUnique({ where: { id } });
        case "VerificationToken":
            return db.verificationToken.findUnique({ where: { id } });
        case "PasswordResetToken":
            return db.passwordResetToken.findUnique({ where: { id } });
        case "TwoFactorToken":
            return db.twoFactorToken.findUnique({ where: { id } });
        case "TwoFactorConfirmation":
            return db.twoFactorConfirmation.findUnique({ where: { id } });
        case "News":
            return db.news.findUnique({ where: { id } });
        case "Season":
            return db.season.findUnique({ where: { id } });
        case "VisitData":
            // Exclude createdAt to avoid DateTime conversion error
            return db.visitData.findUnique({ 
                where: { id },
                select: {
                    id: true,
                    visitDate: true,
                    routeTitle: true,
                    routeDescription: true,
                    dogName: true,
                    points: true,
                    visitedPlaces: true,
                    dogNotAllowed: true,
                    routeLink: true,
                    route: true,
                    year: true,
                    extraPoints: true,
                    state: true,
                    rejectionReason: true,
                    photos: true,
                    places: true,
                    seasonId: true,
                    userId: true,
                    // createdAt excluded due to DateTime format issue
                }
            });
        default:
            throw new Error("Unknown collection");
    }
}
