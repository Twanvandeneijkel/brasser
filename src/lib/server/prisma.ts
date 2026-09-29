import path from 'node:path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../../generated/prisma/client.ts';

const defaultUrl = `file:${path.resolve('data/brassers.db').replaceAll('\\', '/')}`;
const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? defaultUrl });

const globalPrisma = globalThis as typeof globalThis & { brassersPrisma?: PrismaClient };

export const prisma = globalPrisma.brassersPrisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
	globalPrisma.brassersPrisma = prisma;
}
