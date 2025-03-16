import { db } from "@/lib/db";

export async function getRecordsCount(collection: string): Promise<number> {
    switch (collection) {
        case "User":
            return await db.user.count();
        case "Account":
            return await db.account.count();
        case "VerificationToken":
            return await db.verificationToken.count();
        case "PasswordResetToken":
            return await db.passwordResetToken.count();
        case "TwoFactorToken":
            return await db.twoFactorToken.count();
        case "TwoFactorConfirmation":
            return await db.twoFactorConfirmation.count();
        case "News":
            return await db.news.count();
        case "Season":
            return await db.season.count();
        case "VisitData":
            return await db .visitData.count();
        default:
            throw new Error("Unknown collection");
    }
}
