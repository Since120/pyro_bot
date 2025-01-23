// src/bot/services/zoneTrackingHelper.ts

import { GuildMember } from 'discord.js';
import { prisma } from './dbClient';
import logger from './logger';
import { trackTimeInZone } from './zoneTrackingService';
import { getDynamicChannelById } from './dynamicChannelService';
import { addToUserGlobalStats } from './globalStatsService';

/**
 * Wird aufgerufen, wenn der User den alten Kanal verlässt (oldChannelId).
 *   - Ermitteln, ob es ein dynChannel => zoneKey
 *   - check isTracked => Zeit berechnen => trackTimeInZone => pointsGained
 *   - Dann global updaten: addToUserGlobalStats(userId, deltaSec, pointsGained)
 *   - lastJoinTimestamp zurücksetzen
 */
export async function trackTimeOnChannelLeave(member: GuildMember, oldChannelId: string) {
  console.log('[DEBUG] trackTimeOnChannelLeave START', {
    userId: member.user.id,
    oldChannelId,
  });

  // 1) check dynamicChannel
  const dynChannel = await getDynamicChannelById(oldChannelId);
  console.log('[DEBUG] dynChannel=', dynChannel);

  if (!dynChannel) {
    console.log('[DEBUG] => No dynChannel => return');
    return;
  }

  // 2) check isTracked
  const userId = member.user.id;
  const userTracking = await prisma.userTracking.findUnique({ where: { userId } });
  console.log('[DEBUG] userTracking=', userTracking);

  if (!userTracking || !userTracking.isTracked) {
    console.log('[DEBUG] => isTracked=false => return');
    return;
  }

  // 3) zoneKey?
  const { zoneKey } = dynChannel;
  console.log('[DEBUG] => zoneKey=', zoneKey);
  if (!zoneKey) {
    console.log('[DEBUG] => no zoneKey => return');
    return;
  }

  // 4) userZoneStats => hole lastJoinTimestamp
  const stats = await prisma.userZoneStats.findFirst({
    where: { userId, zoneKey },
  });
  console.log('[DEBUG] => stats=', stats);

  if (!stats || !stats.lastJoinTimestamp) {
    console.log('[DEBUG] => no stats or lastJoinTimestamp => return');
    return;
  }

  // 5) deltaSeconds
  const now = new Date();
  const deltaSec = Math.floor((now.getTime() - stats.lastJoinTimestamp.getTime()) / 1000);
  console.log(`[DEBUG] => deltaSec=${deltaSec}`);
  if (deltaSec <= 0) {
    console.log('[DEBUG] => deltaSec <= 0 => return');
    return;
  }

  // 6) trackTimeInZone => um leftoverSeconds und pointsInThisZone zu aktualisieren
  const { pointsGained } = await trackTimeInZone({
    userId,
    zoneKey,
    deltaSeconds: deltaSec,
  });

  // 7) lastJoinTimestamp = null + **lastUsage = now**
  await prisma.userZoneStats.update({
    where: { id: stats.id },
    data: {
      lastJoinTimestamp: null,
      lastUsage: now,
    },
  });

  console.log(`[DEBUG] => channelLeave done: userId=${userId}, zoneKey=${zoneKey}, deltaSec=${deltaSec}`);

  // 8) Globale Stats updaten => Zeit & Punkte
  if (pointsGained > 0 || deltaSec > 0) {
    // Add it to global table
    await addToUserGlobalStats(userId, deltaSec, pointsGained);
  }
}

/**
 * Wird aufgerufen, wenn der User in den neuen Channel joint (newChannelId).
 *   - falls dynamisch => setze lastJoinTimestamp = now()
 *   - check isTracked
 */
export async function handleNewChannelJoin(member: GuildMember, newChannelId: string) {
  const dynChannel = await getDynamicChannelById(newChannelId);
  if (!dynChannel) return; // kein dynChannel => skip

  // check isTracked
  const userId = member.user.id;
  const userTracking = await prisma.userTracking.findUnique({
    where: { userId },
  });
  if (!userTracking || !userTracking.isTracked) {
    // not tracked => skip
    return;
  }

  // zoneKey?
  const { zoneKey } = dynChannel;
  if (!zoneKey) return;

  // userZoneStats => setze lastJoinTimestamp = now
  let stats = await prisma.userZoneStats.findFirst({
    where: { userId, zoneKey },
  });
  if (!stats) {
    stats = await prisma.userZoneStats.create({
      data: { userId, zoneKey },
    });
    // logger.info(`stats angelegt userId=${userId}, zoneKey=${zoneKey}`);
  }

  await prisma.userZoneStats.update({
    where: { id: stats.id },
    data: { lastJoinTimestamp: new Date() },
  });

  logger.info(`channelJoin: userId=${userId}, zoneKey=${zoneKey}, set lastJoinTimestamp=now()`);
}
