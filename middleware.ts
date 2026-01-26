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

    // Helper function to check if a path matches the route definitions (supports wildcards)
    const matchesRoute = (path: string, routes: string[]) => {
        return routes.some(route => {
            if (route.endsWith("/*")) {
                const basePath = route.slice(0, -2);
                // Ensure we match /basePath or /basePath/something, but not /basePathExtra
                // We check if path starts with base, and if it's longer, the next char must be /
                if (path === basePath) return true;
                if (path.startsWith(basePath + "/")) return true;
                return false;
            }
            return path === route;
        });
    };

    const isPublicRoute = matchesRoute(nextUrl.pathname, publicRoutes);
    const isPublicApiRoute = matchesRoute(nextUrl.pathname, publicApiRoutes);

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

