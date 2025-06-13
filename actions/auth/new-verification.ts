"use server"

import { db } from "@/lib/db"
import { getUserByEmail } from "@/data/user";
import { getVerificationTokenByToken } from "@/data/verification-token";

export const newVerification = async (token: string) => {
    const existingToken = await getVerificationTokenByToken(token)

    if (!existingToken) {
        return { error: "Token neexistuje!" }
    }

    const hasExpired = new Date(existingToken.expires) < new Date();

    if (hasExpired) {
        return { error: "Token vypršel!" }
    }

    const existingUser = await getUserByEmail(existingToken.email)

    if (!existingUser) {
        return { error: "Tento uživatel neexistuje!" }
    }

    await db.user.update({
        where: {
            id: existingUser.id
        },
        data: {
            emailVerified: new Date(),
            email: existingToken.email
        }
    })

    await db.verificationToken.delete({
        where: { id: existingToken.id }
    })

    return { success: "Email úspěšně ověřen!" }
}