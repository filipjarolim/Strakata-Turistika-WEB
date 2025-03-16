import { db } from "@/lib/db";

type UpdateDataType = {
    [key: string]: string | number | boolean | Date | null;
};

export async function updateRecord(collection: string, id: string, data: UpdateDataType) {
    try {
        let updatedRecord;
        switch (collection) {
            case "User": {
                const { id: _ignore, emailVerified, ...rest } = data;
                const updateData: UpdateDataType = { ...rest };
                if (typeof emailVerified === "string" || typeof emailVerified === "number") {
                    updateData.emailVerified = new Date(emailVerified);
                }
                updatedRecord = await db.user.update({
                    where: { id },
                    data: updateData,
                });
                break;
            }
            case "Account": {
                const { id: _ignore, ...rest } = data;
                updatedRecord = await db.account.update({
                    where: { id },
                    data: rest,
                });
                break;
            }
            case "VerificationToken": {
                const { id: _ignore, ...rest } = data;
                updatedRecord = await db.verificationToken.update({
                    where: { id },
                    data: rest,
                });
                break;
            }
            case "PasswordResetToken": {
                const { id: _ignore, ...rest } = data;
                updatedRecord = await db.passwordResetToken.update({
                    where: { id },
                    data: rest,
                });
                break;
            }
            case "TwoFactorToken": {
                const { id: _ignore, ...rest } = data;
                updatedRecord = await db.twoFactorToken.update({
                    where: { id },
                    data: rest,
                });
                break;
            }
            case "TwoFactorConfirmation": {
                const { id: _ignore, ...rest } = data;
                updatedRecord = await db.twoFactorConfirmation.update({
                    where: { id },
                    data: rest,
                });
                break;
            }
            case "News": {
                const { id: _ignore, ...rest } = data;
                updatedRecord = await db.news.update({
                    where: { id },
                    data: rest,
                });
                break;
            }
            case "Season": {
                const { id: _ignore, ...rest } = data;
                updatedRecord = await db.season.update({
                    where: { id },
                    data: rest,
                });
                break;
            }
            case "VisitData": {
                const { id: _ignore, ...rest } = data;
                updatedRecord = await db.visitData.update({
                    where: { id },
                    data: rest,
                });
                break;
            }
            default:
                throw new Error("Unknown collection");
        }
        return { success: true, updatedRecord };
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: "Unknown error" };
    }
}