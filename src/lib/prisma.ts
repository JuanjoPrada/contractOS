import path from 'path'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const getPrismaClient = () => {
  const dbPath = path.resolve(process.cwd(), 'dev.db')
  const dbUrl = `file:${dbPath}`
  console.log('[Prisma Singleton] Resolved DB Path:', dbPath)
  console.log('[Prisma Singleton] Initializing with DB_URL:', dbUrl)

  const clientConfig = { url: dbUrl }
  console.log('[Prisma Singleton] Passing config to createClient:', JSON.stringify(clientConfig))

  // In Prisma 7, PrismaLibSql is a factory that takes the config object directly
  const adapter = new PrismaLibSql(clientConfig)
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof getPrismaClient> | undefined;
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
