import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
    // We log to console to verify initialization in production logs
    console.log("[DB] Initializing Prisma Client...", {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL
    });

    return new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
};

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const db = globalThis.prismaGlobal ?? prismaClientSingleton();

export { db };

if (process.env.NODE_ENV !== "production") {
    globalThis.prismaGlobal = db;
}
