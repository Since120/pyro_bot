// bot/dbClient.ts

import { PrismaClient } from '@prisma/client';

// Hier eine einzige Prisma-Instanz erstellen
export const prisma = new PrismaClient();
