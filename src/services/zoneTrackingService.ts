// src/bot/services/zoneTrackingService.ts

import { prisma } from './dbClient';
import { getZoneByKey } from './zoneService';
import logger from './logger';

/**
 * Bsp-Datentyp fürs Update
 */
export interface ZoneTrackingUpdate {
  userId: string;
  zoneKey: string;
  deltaSeconds: number; // die Zeit, die er am Stück in dieser Zone war
}

/**
 * trackTimeInZone:
 *  - updated userZoneStats (Zeit + leftover)
 *  - errechnet pointsGained
 *  - addiert pointsInThisZone und setzt es danach auf 0, damit kein doppeltes Buchen
 *
 * Gibt das Ergebnis zurück, z.B. { pointsGained: 5 }
 */
export async function trackTimeInZone({ userId, zoneKey, deltaSeconds }: ZoneTrackingUpdate)
: Promise<{ pointsGained: number }> {
  // 1) Falls deltaSeconds <= 0 => nichts tun
  if (deltaSeconds <= 0) {
    return { pointsGained: 0 };
  }

  // 2) Hole oder lege userZoneStats an
  let stats = await prisma.userZoneStats.findFirst({
    where: { userId, zoneKey },
  });

  if (!stats) {
    stats = await prisma.userZoneStats.create({
      data: { userId, zoneKey },
    });
    logger.info(`userZoneStats neu erstellt für userId=${userId}, zoneKey=${zoneKey}`);
  }

  // 3) Hole Info aus Zone-Tabelle: minutesRequired, pointsGranted
  const zone = await getZoneByKey(zoneKey); 
  if (!zone) {
    // Falls es die Zone nicht mehr gibt (gelöscht?), Abbruch
    logger.warn(`Zone ${zoneKey} nicht gefunden, breche ab.`);
    return { pointsGained: 0 };
  }

  // 4) leftoverSeconds + deltaSeconds
  const intervalSec = zone.minutesRequired * 60; // z.B. 3600
  let leftover = stats.leftoverSeconds + deltaSeconds;
  let pointsGained = 0;

  // 5) Schleife: solange leftover >= intervalSec => 1 Intervall
  while (leftover >= intervalSec) {
    leftover -= intervalSec;
    pointsGained += zone.pointsGranted;
  }

  // 6) Update totalSecondsInZone
  const totalSec = stats.totalSecondsInZone + deltaSeconds;

  // 7) Bisher in "pointsInThisZone" aufaddieren => und dann auf 0 setzen
  //    Wir nehmen an, du willst ALLE neu entstandenen Punkte global verbuchen
  //    => Also hier "lokal" nicht horten
  const oldPoints = stats.pointsInThisZone;
  const newPoints = oldPoints + pointsGained;

  // => Wir setzen es direkt auf 0, damit wir nichts doppelt gutschreiben
  const finalPointsInZone = 0;

  // 8) Speichern
  await prisma.userZoneStats.update({
    where: { id: stats.id },
    data: {
      totalSecondsInZone: totalSec,
      leftoverSeconds: leftover,
      pointsInThisZone: finalPointsInZone,
      updatedAt: new Date(),
    },
  });

  if (pointsGained > 0) {
    logger.info(`User ${userId} hat +${pointsGained}P in Zone ${zoneKey} gesammelt (lokal).`);
  }

  // => Return das, damit wir global verbuchen können
  return { pointsGained };
}
