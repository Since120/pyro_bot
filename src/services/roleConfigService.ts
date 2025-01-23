// src/bot/services/roleConfigService.ts
import { PrismaClient } from '@prisma/client';
import logger from './logger';

const prisma = new PrismaClient();

export async function upsertRoleConfig(roleKey: string, roleId: string) {
  const existing = await prisma.roleConfig.findFirst({ where: { roleKey } });
  if (!existing) {
    await prisma.roleConfig.create({ data: { roleKey, roleId } });
    logger.info(`Neue RoleConfig erstellt: key="${roleKey}", roleId="${roleId}"`);
  } else {
    await prisma.roleConfig.update({
      where: { id: existing.id },
      data: { roleId },
    });
    logger.info(`RoleConfig aktualisiert: key="${roleKey}", roleId="${roleId}"`);
  }
}

/** Rolle via key holen (z.B. 'freigabe') */
export async function getRoleConfigByKey(roleKey: string) {
  return prisma.roleConfig.findFirst({ where: { roleKey } });
}
