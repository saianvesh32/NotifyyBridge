import { PrismaClient } from "@prisma/client";

/** Bump when Prisma schema changes so dev hot-reload picks up a fresh client. */
const PRISMA_CLIENT_KEY = "notification-announcementId-v1";

type GlobalPrisma = typeof globalThis & {
  prisma?: PrismaClient;
  prismaClientKey?: string;
};

const globalPrisma = globalThis as GlobalPrisma;

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

function getPrismaClient() {
  if (globalPrisma.prismaClientKey !== PRISMA_CLIENT_KEY) {
    void globalPrisma.prisma?.$disconnect();
    globalPrisma.prisma = createPrismaClient();
    globalPrisma.prismaClientKey = PRISMA_CLIENT_KEY;
  } else if (!globalPrisma.prisma) {
    globalPrisma.prisma = createPrismaClient();
  }
  return globalPrisma.prisma;
}

export const prisma =
  process.env.NODE_ENV === "production" ? createPrismaClient() : getPrismaClient();
