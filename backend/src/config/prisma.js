// prisma/client.ts - Production client
import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient({
  log: ['error'],
  // Connection pooling
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})