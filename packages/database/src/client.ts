import { PrismaClient } from '@prisma/client';

const globalDatabase = globalThis as typeof globalThis & {
  signalOrNoisePrisma?: PrismaClient;
};

export function createDatabaseClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

/**
 * Reuse one client during Next.js hot reloads and serverless module reuse.
 * DATABASE_URL is the pooled Neon runtime URL; Prisma migrations use DIRECT_URL.
 */
export function getDatabaseClient(): PrismaClient {
  if (!globalDatabase.signalOrNoisePrisma) {
    globalDatabase.signalOrNoisePrisma = createDatabaseClient();
  }
  return globalDatabase.signalOrNoisePrisma;
}

export async function disconnectDatabase(): Promise<void> {
  if (globalDatabase.signalOrNoisePrisma) {
    await globalDatabase.signalOrNoisePrisma.$disconnect();
    delete globalDatabase.signalOrNoisePrisma;
  }
}
