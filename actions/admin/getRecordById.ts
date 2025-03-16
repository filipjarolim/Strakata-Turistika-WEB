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
            return db.visitData.findUnique({ where: { id } });
        default:
            throw new Error("Unknown collection");
    }
}
