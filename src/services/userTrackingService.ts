// src/bot/services/userTrackingService.ts

import { prisma } from './dbClient';
import logger from './logger';

/**
 * Setzt isTracked (true/false) für einen User (userId).
 * Erzeugt den Eintrag falls nicht vorhanden.
 */
export async function setTrackingFlag(userId: string, trackState: boolean) {
  // Erst Eintrag suchen
  const existing = await prisma.userTracking.findUnique({
    where: { userId },
  });

  if (!existing) {
    // Neu anlegen
    await prisma.userTracking.create({
      data: {
        userId,
        isTracked: trackState,
      },
    });
    logger.info(`TrackingEntry neu: userId=${userId}, isTracked=${trackState}`);
  } else {
    // Update
    await prisma.userTracking.update({
      where: { userId },
      data: { isTracked: trackState },
    });
    logger.info(`TrackingEntry updated: userId=${userId}, isTracked=${trackState}`);
  }
}

/**
 * Check if user is tracked
 */
export async function isUserTracked(userId: string): Promise<boolean> {
  const ut = await prisma.userTracking.findUnique({
    where: { userId },
  });
  return ut?.isTracked ?? false;
}
