import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"

import { getUserById } from "@/data/user"
import { getAccountByUserId } from "./data/account";

import { db } from "@/lib/db"
import authConfig from "@/auth.config"
import { UserRole } from "@prisma/client";

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
    debug: process.env.NODE_ENV === "development" || process.env.DEBUG_AUTH === "true",
    events: {
        async linkAccount({ user }) {
            await db.user.update({
                where: { id: user.id },
                data: { emailVerified: new Date() }
            })
        }
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider !== "credentials") {
                const imageUrl = profile?.image_url || profile?.picture;

                // First check if user exists
                const existingUser = await db.user.findUnique({
                    where: { email: user.email || "" }
                });

                if (existingUser) {
                    // Update existing user's image if needed
                    if (imageUrl && typeof imageUrl === "string") {
                        await db.user.update({
                            where: { id: existingUser.id },
                            data: { image: imageUrl }
                        });
                    }
                    return true;
                }

                // Create new user if doesn't exist
                if (imageUrl && typeof imageUrl === "string") {
                    await db.user.create({
                        data: {
                            id: user.id,
                            email: user.email || "",
                            name: user.name || "",
                            image: imageUrl,
                            emailVerified: new Date()
                        }
                    });
                }

                return true;
            }

            const existingUser = await getUserById(user.id);

            if (!existingUser?.emailVerified) return false;

            if (existingUser.isTwoFactorEnabled) {
                const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(existingUser.id);

                if (!twoFactorConfirmation) return false;

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
                session.user.dogName = token.dogName as string;
            }

            return session;
        },

        async jwt({ token }) {
            if (!token.sub) return token;

            const existingUser = await getUserById(token.sub);

            if (!existingUser) return token;

            const existingAccount = await getAccountByUserId(existingUser.id);

            token.isOAuth = !!existingAccount;
            token.name = existingUser.name;
            token.email = existingUser.email;
            token.role = existingUser.role;
            token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;
            token.dogName = existingUser.dogName;

            return token;
        }
    },
    adapter: PrismaAdapter(db),
    session: { strategy: "jwt" },
    ...authConfig,
});