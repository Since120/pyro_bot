// src/bot/services/zoneService.ts

import { Zone } from '@prisma/client';
import { prisma } from './dbClient';
import logger from './logger';

/**
 * Erstellt oder aktualisiert eine Zone
 */
export async function createOrUpdateZone(
  zoneKey: string,
  zoneName: string,
  minutesRequired: number,
  pointsGranted: number
): Promise<Zone> {
  logger.info(`createOrUpdateZone: zoneKey="${zoneKey}", zoneName="${zoneName}", ` +
              `minutesRequired=${minutesRequired}, pointsGranted=${pointsGranted}`);

  // Zone suchen
  let zone = await prisma.zone.findUnique({ where: { zoneKey } });
  if (!zone) {
    // Neue Zone anlegen
    zone = await prisma.zone.create({
      data: { zoneKey, zoneName, minutesRequired, pointsGranted }
    });
    logger.info(`Zone "${zoneKey}" neu erstellt.`);
  } else {
    // Existierende Zone aktualisieren
    zone = await prisma.zone.update({
      where: { zoneKey },
      data: { zoneName, minutesRequired, pointsGranted }
    });
    logger.info(`Zone "${zoneKey}" aktualisiert.`);
  }
  return zone;
}

/**
 * Löscht eine Zone anhand ihres zoneKey
 */
export async function deleteZone(zoneKey: string): Promise<Zone> {
  const zone = await prisma.zone.delete({ where: { zoneKey } });
  logger.info(`Zone "${zoneKey}" wurde gelöscht.`);
  return zone;
}

/**
 * Holt alle Zonen
 */
export async function getAllZones(): Promise<Zone[]> {
  return prisma.zone.findMany();
}

/**
 * Holt eine Zone per Key
 */
export async function getZoneByKey(zoneKey: string) {
  return prisma.zone.findUnique({ where: { zoneKey } });
}
