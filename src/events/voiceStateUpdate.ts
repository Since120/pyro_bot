// src/bot/events/voiceStateUpdate.ts

import { VoiceState } from 'discord.js';
import { getDynamicChannelById, deleteDynamicChannel } from '../services/dynamicChannelService';
import logger from '../services/logger';
import { getRoleConfigByKey } from '../services/roleConfigService';
import { prisma } from '../services/dbClient'; // Wir löschen userTracking-Eintrag

// NEU:
import { trackTimeOnChannelLeave, handleNewChannelJoin } from '../services/zoneTrackingHelper';

export default async function voiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
  const member = oldState.member || newState.member;
  if (!member) return;

  // 1) Kanal-Wechsel -> check ob alter Kanal leer => löschen
  if (oldState.channelId && oldState.channelId !== newState.channelId) {
    const oldChannel = oldState.channel;
    
    // NEU: erst Zeit abrechnen
    await trackTimeOnChannelLeave(member, oldState.channelId);
  
    if (oldChannel && oldChannel.members.size === 0) {
      const dyn = await getDynamicChannelById(oldChannel.id);
      if (dyn) {
        await oldChannel.delete('Dynamischer Kanal leer');
        await deleteDynamicChannel(oldChannel.id);
        logger.info(`Dynamischer VoiceKanal gelöscht: ${oldChannel.name}`);
      }
    }
  }

  // 2) Full Leave => check ob user in KEINEM dynamischen Channel mehr ist => remove Rolle
  if (oldState.channelId && !newState.channelId) {
    // user hat voice komplett verlassen
    await checkAndRemoveFreigabeIfNoChannel(member);
  } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
    // user wechselt -> check ob user noch in dynamic channel?
    await checkAndRemoveFreigabeIfNoChannel(member);
  }

  // NEU: user joint neuen Channel => handleNewChannelJoin
  if (newState.channelId && oldState.channelId !== newState.channelId) {
    await handleNewChannelJoin(member, newState.channelId);
  }
}

/**
 * Hilfsfunktion: Prüfen, ob user in mind. 1 dynamic channel
 * Falls nein => removeFreigabeRoleAndCleanOverwrites
 */
async function checkAndRemoveFreigabeIfNoChannel(member: any) {
  // Falls user in KEINEM Voice => remove
  if (!member.voice.channelId) {
    await removeFreigabeRoleAndCleanOverwrites(member);
    return;
  }

  // user ist in channel => check ob channel dynamisch
  const channel = member.voice.channel;
  const dyn = await getDynamicChannelById(channel.id);

  if (!dyn) {
    // => user ist NICHT in dynamic channel => remove
    await removeFreigabeRoleAndCleanOverwrites(member);
  } else {
    // => user ist in dynamic channel => Rolle behalten
  }
}

async function removeFreigabeRoleAndCleanOverwrites(member: any) {
  const rc = await getRoleConfigByKey('freigabe');
  if (!rc) return;

  if (!member.roles.cache.has(rc.roleId)) {
    // User hat die Rolle gar nicht => nichts zu tun
    return;
  }

  // Rolle entfernen
  await member.roles.remove(rc.roleId).catch(() => null);
  logger.info(`Freigabe-Rolle von ${member.user.tag} entfernt (left all dynamic channels).`);

  // userTracking-Eintrag löschen
  try {
    await prisma.userTracking.delete({
      where: { userId: member.user.id },
    });
    logger.info(`UserTracking-Eintrag für ${member.user.tag} wurde gelöscht.`);
  } catch (err) {
    logger.warn(`Konnte den userTracking-Eintrag nicht entfernen: ${err}`);
  }

  // Overwrites in allen dynamischen Kanälen entfernen
  const settings = await prisma.adminSettings.findFirst();
  if (!settings || !settings.voiceCategoryId) {
    logger.warn('Keine voiceCategoryId definiert, kann Overwrites nicht entfernen.');
    return;
  }

  const guild = member.guild;
  const allDynChannels = await prisma.dynamicVoiceChannel.findMany();

  for (const ch of allDynChannels) {
    const channelObj = guild.channels.cache.get(ch.channelId);
    if (!channelObj) continue;
    if (channelObj.parentId !== settings.voiceCategoryId) {
      continue;
    }

    try {
      await channelObj.permissionOverwrites.delete(member.user.id);
      logger.info(`Overwrites gelöscht in Kanal ${channelObj.name} für ${member.user.tag}`);
    } catch (err) {
      logger.warn(`Fehler beim Overwrite-Entfernen in ${channelObj.name}: ${err}`);
    }
  }
}
