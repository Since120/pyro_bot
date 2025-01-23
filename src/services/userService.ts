// src/bot/services/userService.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function createUser(username: string, email: string) {
  const user = await prisma.user.create({ data: { username, email } });
  return user;
}
