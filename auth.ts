import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"

import { getUserById } from "@/data/user"
import { getAccountByUserId } from "./data/account";

import { db } from "@/lib/db"
import authConfig from "@/auth.config"
import {UserRole} from "@prisma/client";

import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation"

export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut
} = NextAuth({
    pages: {
        signIn: "/auth/login",
        error: "/auth/error"
    },
    events: {
        async linkAccount({ user }) {

            await db.user.update({
                where: { id: user.id },
                data: { emailVerified: new Date()}
            })

        }
    },
    callbacks: {

        async signIn({ user, account, profile }) {

            console.log(account, user, profile)
            // Allow OAuth without email verification
            console.log("SIGNINSIGNINSIGNINSIGNINSIGNINSIGNINSIGNINSIGNINSIGNINSIGNINSIGNINSIGNIN")

            if (profile?.image_url) {
                console.log("Updating user image")
                console.log(profile?.image_url)
                // await db.user.update({
                //     where: { id: user.id },
                //     data: { image: profile?.image_url}
                // })

            } else if (profile?.picture) {
                console.log("Updating user image")
                console.log(profile?.image_url)
                // await db.user.update({
                //     where: { id: user.id },
                //     data: { image: profile?.picture}
                // })

            }

            if (account?.provider !== "credentials") return true



            const existingUser = await getUserById(user.id);

            // Prevent sign in without email verification
            if (!existingUser?.emailVerified) return false;

            if (existingUser.isTwoFactorEnabled) {
                const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(existingUser.id);

                if (!twoFactorConfirmation) return false;

                // Delete two factor confirmation for next sign in
                await db.twoFactorConfirmation.delete({
                    where: { id: twoFactorConfirmation.id }
                });
            }

            return true;

        },

        async session({ token, session }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }

            if (token.role && session.user) {
                session.user.role = token.role as UserRole;
            }

            if (session.user) {
                session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
            }

            if (session.user) {
                session.user.name = token.name;
                session.user.email = token.email as string;
                session.user.isOAuth = token.isOAuth as boolean;
            }

            return session;
        },

        async jwt({ token }) {

            console.log("WE DID GET THERE 1")
            if (!token.sub) return token;

            const existingUser = await getUserById(token.sub);
            console.log("WE DID GET THERE 2")

            if (!existingUser) return token;

            const existingAccount = await getAccountByUserId(
                existingUser.id
            );
            console.log("WE DID GET THERE 3")

            token.isOAuth = !!existingAccount;
            token.name = existingUser.name;
            token.email = existingUser.email;
            token.role = existingUser.role;
            token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;
            console.log("WE DID GET THERE 4")

            return token
        }
    },
    adapter: PrismaAdapter(db),
    session: { strategy: "jwt" },
    ...authConfig,
})