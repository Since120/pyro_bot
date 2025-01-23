// --- src/bot/services/setupService.ts ---
import { PrismaClient } from '@prisma/client';
import logger from './logger';

const prisma = new PrismaClient();

/**
 * Speichert/Updatet einen SetupChannels-Datensatz:
 * - categoryId
 * - textChannelId
 * - voiceChannelId
 *
 * Da wir davon ausgehen, dass es nur EINE existierende SetupChannels-Zeile geben soll,
 * machen wir hier "upsert" (entweder neu erstellen oder aktualisieren).
 */
export async function saveSetupChannels(
  categoryId: string,
  textChannelId: string,
  voiceChannelId: string
) {
  logger.info(
    `saveSetupChannels: category=${categoryId}, text=${textChannelId}, voice=${voiceChannelId}`
  );

  // Wir tun so, als gäbe es nur EINEN Datensatz (id=1) oder so – 
  // Du kannst natürlich auch eine ID generieren oder 
  // das Ganze anders lösen. Hier Minimalbeispiel:
  const recordId = 'setup-record';

  const result = await prisma.setupChannels.upsert({
    where: { id: recordId },
    update: {
      categoryId,
      textChannelId,
      voiceChannelId,
    },
    create: {
      id: recordId,
      categoryId,
      textChannelId,
      voiceChannelId,
    },
  });
  logger.info(`SetupChannels gespeichert/aktualisiert (id=${recordId}).`);
  return result;
}

/**
 * Holt den SetupChannels-Eintrag (falls existiert).
 * Wir gehen hier davon aus, dass es maximal 1 Datensatz gibt.
 */
export async function getSetupChannels() {
  // Gleiche Logik: wir haben nur ein "setup-record"
  const recordId = 'setup-record';

  const found = await prisma.setupChannels.findUnique({
    where: { id: recordId },
  });
  return found;
}

/**
 * Löscht den SetupChannels-Eintrag komplett.
 */
export async function deleteSetupChannels() {
  const recordId = 'setup-record';
  await prisma.setupChannels.delete({ where: { id: recordId } }).catch((err) => {
    // catch: Falls nicht existiert, ignorieren
    logger.warn(`deleteSetupChannels: Kein Datensatz gefunden? ${err}`);
  });
  logger.info('SetupChannels-Eintrag gelöscht (falls vorhanden).');
}
