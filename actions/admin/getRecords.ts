import { db } from "@/lib/db";

export async function getRecords(collection: string, skip: number, pageSize: number) {
    switch (collection) {
        case "User":
            return db.user.findMany({ skip, take: pageSize });
        case "Account":
            return db.account.findMany({ skip, take: pageSize });
        case "VerificationToken":
            return db.verificationToken.findMany({ skip, take: pageSize });
        case "PasswordResetToken":
            return db.passwordResetToken.findMany({ skip, take: pageSize });
        case "TwoFactorToken":
            return db.twoFactorToken.findMany({ skip, take: pageSize });
        case "TwoFactorConfirmation":
            return db.twoFactorConfirmation.findMany({ skip, take: pageSize });
        case "News":
            return db.news.findMany({ skip, take: pageSize });
        case "Season":
            return db.season.findMany({ skip, take: pageSize });
        case "VisitData":
            return db.visitData.findMany({ skip, take: pageSize });
        default:
            throw new Error("Unknown collection");
    }
}