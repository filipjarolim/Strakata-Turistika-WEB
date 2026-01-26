import NextAuth from "next-auth"
import { NextResponse } from "next/server"

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

    console.log("[MIDDLEWARE_DEBUG]", {
        path: nextUrl.pathname,
        isLoggedIn,
        isPublic: publicRoutes.includes(nextUrl.pathname),
        isApi: nextUrl.pathname.startsWith("/api")
    });


    const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);

    // Completely skip middleware for NextAuth API routes to avoid interference
    if (isApiAuthRoute) {
        return NextResponse.next();
    }

    const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
    const isPublicApiRoute = publicApiRoutes.some(route => {
        if (route.endsWith("/*")) {
            const basePath = route.slice(0, -2);
            return nextUrl.pathname.startsWith(basePath);
        }
        return nextUrl.pathname === route;
    });

    if (isPublicApiRoute) {
        return NextResponse.next();
    }

    const isAuthRoute = authRoutes.includes(nextUrl.pathname);

    if (isAuthRoute) {
        if (isLoggedIn) {
            return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl))
        }
        return
    }

    if (!isLoggedIn && !isPublicRoute) {
        return Response.redirect(new URL("/auth/login", nextUrl))
    }

    return NextResponse.next()

})

// the only public routes are the next.js, home route and api routes.
export const config = {
    matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}

