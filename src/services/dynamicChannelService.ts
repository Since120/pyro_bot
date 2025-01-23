import { prisma } from './dbClient';
import logger from './logger';

/**
 * Legt einen neuen Datensatz in DynamicVoiceChannel an (DB).
 */
export async function createDynamicChannel(
  channelId: string,
  zoneKey: string,
  createdByUser: string
) {
  const result = await prisma.dynamicVoiceChannel.create({
    data: {
      channelId,
      zoneKey,
      createdByUser,
    },
  });
  logger.info(`DynamicVoiceChannel angelegt: channelId=${channelId}, zoneKey=${zoneKey}`);
  return result;
}

/**
 * Holt einen Eintrag anhand channelId
 */
export async function getDynamicChannelById(channelId: string) {
  return prisma.dynamicVoiceChannel.findUnique({
    where: { channelId },
  });
}

/**
 * Löscht einen Eintrag
 */
export async function deleteDynamicChannel(channelId: string) {
  try {
    await prisma.dynamicVoiceChannel.delete({ where: { channelId } });
    logger.info(`DynamicVoiceChannel gelöscht: channelId=${channelId}`);
  } catch (error) {
    logger.warn(`deleteDynamicChannel: Kein Eintrag für channelId=${channelId}?`, error);
  }
}
