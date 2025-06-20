"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { SettingsSchema } from "@/schemas";
import { getUserByEmail, getUserById } from "@/data/user";
import { currentUser } from "@/lib/auth";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";

export const settings = async (
    values: z.infer<typeof SettingsSchema>
) => {
    const user = await currentUser();

    if (!user) {
        return { error: "Nejste autorizovaný" }
    }

    const dbUser = await getUserById(user.id);

    if (!dbUser) {
        return { error: "Nejste autorizovaný" }
    }

    if (user.isOAuth) {
        values.email = undefined;
        values.password = undefined;
        values.newPassword = undefined;
        values.isTwoFactorEnabled = undefined;
    }

    if (values.email && values.email !== user.email) {
        const existingUser = await getUserByEmail(values.email);

        if (existingUser && existingUser.id !== user.id) {
            return { error: "Email je již zabraný!" }
        }

        const verificationToken = await generateVerificationToken(
            values.email
        );
        await sendVerificationEmail(
            verificationToken.email,
            verificationToken.token,
        );

        return { success: "Ověřovací email poslán!" };
    }

    if (values.password && values.newPassword && dbUser.password) {
        const passwordsMatch = await bcrypt.compare(
            values.password,
            dbUser.password,
        );

        if (!passwordsMatch) {
            return { error: "Neplatné heslo!" };
        }

        const hashedPassword = await bcrypt.hash(
            values.newPassword,
            10,
        );
        values.password = hashedPassword;
        values.newPassword = undefined;
    }

    // Prepare update data, excluding undefined values
    const updateData: any = {};
    if (values.name !== undefined) updateData.name = values.name;
    if (values.dogName !== undefined) updateData.dogName = values.dogName;
    if (values.email !== undefined) updateData.email = values.email;
    if (values.role !== undefined) updateData.role = values.role;
    if (values.isTwoFactorEnabled !== undefined) updateData.isTwoFactorEnabled = values.isTwoFactorEnabled;
    if (values.password !== undefined) updateData.password = values.password;

    const updatedUser = await db.user.update({
        where: { id: dbUser.id },
        data: updateData
    });
    
    return { success: "Nastavení upraveno!" }
}