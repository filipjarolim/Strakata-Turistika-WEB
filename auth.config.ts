import type { NextAuthConfig } from "next-auth"


import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import Discord from "next-auth/providers/discord"
import Apple from "next-auth/providers/apple"



import bcrypt from "bcryptjs"

import { LoginSchema } from "@/schemas"
import {getUserByEmail} from "@/data/user";

export default {
    providers: [

        //
        //
        //      HERE ARE ALL THE CONNECTED PROVIDERS
        //      COMMENT SOME IF DON'T WANT TO USE
        //      allowDangerousEmailAccountLinking: true MEANS THAT YOU CAN LOGIN EVEN IF YOU ARE ALREADY LOGGED WITH DIFFERENT PROVIDER
        //
        //

        Google({
            allowDangerousEmailAccountLinking: true,
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
        }),
        // Discord({
        //     allowDangerousEmailAccountLinking: true,
        //     clientId: process.env.DISCORD_CLIENT_ID,
        //     clientSecret: process.env.DISCORD_CLIENT_SECRET
        // }),
        // APPLE
        Apple({
            clientId: process.env.APPLE_CLIENT_ID,
            clientSecret: process.env.APPLE_CLIENT_SECRET,
        }),
        Credentials(
            {
            async authorize(credentials) {
                const validatedFields = LoginSchema.safeParse(credentials)

                if (validatedFields.success) {
                    const {email, password} = validatedFields.data

                    const user = await getUserByEmail(email)
                    if (!user || !user.password) return null

                    //      CODING THE PASSWORD --- IMPORTANT

                    const passwordsMatch = await bcrypt.compare(password, user.password)

                    if (passwordsMatch) return user

                }

                return null
            }
        })
    ],
} satisfies NextAuthConfig