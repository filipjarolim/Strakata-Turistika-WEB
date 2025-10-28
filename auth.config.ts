import type { NextAuthConfig } from "next-auth"


import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"

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

        Credentials(
            {
            async authorize(credentials) {
                const validatedFields = LoginSchema.safeParse(credentials)

                if (validatedFields.success) {
                    const {email, password} = validatedFields.data

                    const user = await getUserByEmail(email)
                    if (!user || !user.password) return null

                    //      CODING THE PASSWORD --- IMPORTANT
                    // Dynamic import for Edge Runtime compatibility
                    const bcrypt = (await import("bcryptjs")).default

                    const passwordsMatch = await bcrypt.compare(password, user.password)

                    if (passwordsMatch) return user

                }

                return null
            }
        })
    ],
} satisfies NextAuthConfig