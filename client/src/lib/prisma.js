import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

// Ensure Prisma client is cached across requests in all environments
// to prevent connection pool exhaustion (especially important for serverless/Neon)
export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Cache in all environments to prevent connection pool issues
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
