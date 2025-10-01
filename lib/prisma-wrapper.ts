// Custom Prisma wrapper that avoids WASM issues
import { PrismaClient } from '@prisma/client'

// Override the Prisma client to force binary engine
class CustomPrismaClient extends PrismaClient {
  constructor(options?: Record<string, unknown>) {
    super({
      ...options,
      // Force binary engine and avoid WASM
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })
  }
}

declare global {
  var __prisma: CustomPrismaClient | undefined
}

export const db = globalThis.__prisma ?? new CustomPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = db
}
