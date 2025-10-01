import NextAuth from "next-auth"

import authConfig from "@/auth.config"
import {
    DEFAULT_LOGIN_REDIRECT,
    apiAuthPrefix,
    authRoutes,
    publicRoutes,
    publicApiRoutes
} from "@/routes"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const { nextUrl } = req
    const isLoggedIn = !!req.auth

    const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix)
    const isPublicRoute = publicRoutes.includes(nextUrl.pathname)
    const isPublicApiRoute = publicApiRoutes.some(route => {
        if (route.endsWith("/*")) {
            const basePath = route.slice(0, -2);
            return nextUrl.pathname.startsWith(basePath);
        }
        return nextUrl.pathname === route;
    })
    const isAuthRoute = authRoutes.includes(nextUrl.pathname)

    if (isApiAuthRoute || isPublicApiRoute) {
        return null
    }

    if (isAuthRoute) {
        if (isLoggedIn) {
            return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl))
        }
        return null
    }

    if (!isLoggedIn && !isPublicRoute) {
        return Response.redirect(new URL("/auth/login", nextUrl))
    }

    return null

})

// the only public routes are the next.js, home route and api routes.
export const config = {
    matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}

