// src/bot/services/globalStatsService.ts

import { prisma } from './dbClient';
import logger from './logger';

/**
 * addToUserGlobalStats
 *  - Erhöht totalTimeInAllZones um 'timeSec'
 *  - Erhöht totalPoints um 'points'
 *  - Legt den Datensatz an, falls noch nicht vorhanden
 */
export async function addToUserGlobalStats(userId: string, timeSec: number, points: number) {
  if (timeSec < 0) timeSec = 0;
  if (points < 0) points = 0;

  let stats = await prisma.userGlobalStats.findUnique({
    where: { userId },
  });

  if (!stats) {
    // neu erstellen
    stats = await prisma.userGlobalStats.create({
      data: {
        userId,
        totalTimeInAllZones: timeSec,
        totalPoints: points,
      },
    });
    logger.info(`UserGlobalStats neu erstellt: userId=${userId}, +time=${timeSec}, +points=${points}`);
  } else {
    // vorhandene Stats updaten
    const newTime = stats.totalTimeInAllZones + timeSec;
    const newPoints = stats.totalPoints + points;

    stats = await prisma.userGlobalStats.update({
      where: { userId },
      data: {
        totalTimeInAllZones: newTime,
        totalPoints: newPoints,
      },
    });
    logger.info(`UserGlobalStats aktualisiert: userId=${userId}, +time=${timeSec}, +points=${points}`);
  }

  // SPÄTER: Hier könntest du Cap / MWST einbauen
  // z.B. if (stats.totalPoints > CAP) { ... }

  return stats;
}
