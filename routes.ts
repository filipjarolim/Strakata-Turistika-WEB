/*
    * An array of public routes that do not require authentication
    * @type {string[]}
 */
export const publicRoutes = [
    "/",
    "/auth/new-verification",
    "/pravidla",
    "/vysledky",
    "/vysledky/*",
    "/aktuality",
    "/aktuality/*"
]

/*
    * An array of public API routes that do not require authentication
    * @type {string[]}
 */
export const publicApiRoutes = [
    "/api/news",
    "/api/news/*",
    "/api/rules"
]
/*
    * An array of public routes that do not require authentication
    * These routes will redirect logged users to /nastaveni
    * @type {string[]}
 */
export const authRoutes = [
    "/auth/login",
    "/auth/register",
    "/auth/error",
    "/auth/reset",
    "/auth/new-password"
]

/*
    * The prefix for the API auth routes
    * Routes that start with this prefix are used for api authentication purposes
    * @type {string}
 */
export const apiAuthPrefix = "/api/auth"


/*
    * The default redirect route after a successful login
    * @type {string}
 */

export const DEFAULT_LOGIN_REDIRECT = "/nastaveni"