// src/bot/interactions/selectMenus/voiceAllowSelectMenu.ts

import { UserSelectMenuInteraction } from 'discord.js';
import { prisma } from '../../services/dbClient';

export async function handleVoiceAllowSelect(interaction: UserSelectMenuInteraction) {
  console.log('[DEBUG] handleVoiceAllowSelect() ENTERED, customId=' + interaction.customId);
  try {
    // 1) Interaktion annehmen (kein neues reply)
    await interaction.deferUpdate();
    console.log('[DEBUG] interaction.deferUpdate() done');

    const guild = interaction.guild;
    if (!guild) {
      console.log('[DEBUG] => !guild');
      return interaction.followUp({ content: 'Fehler: Keine Guild gefunden.', ephemeral: true });
    }

    const member = await guild.members.fetch(interaction.user.id);
    console.log('[DEBUG] => fetched member ' + member.user.tag);

    const voiceChannel = member.voice.channel;
    if (!voiceChannel) {
      return interaction.followUp({
        content: 'Du bist nicht in einem Voice-Kanal.',
        ephemeral: true,
      });
    }

    // Prüfe, ob es ein dynamischer Kanal ist
    const dynamicChannel = await prisma.dynamicVoiceChannel.findFirst({
      where: { channelId: voiceChannel.id },
    });
    if (!dynamicChannel) {
      return interaction.followUp({
        content: 'Dies ist kein dynamischer Kanal (oder nicht vom Bot verwaltet).',
        ephemeral: true,
      });
    }

    // Prüfen, ob Ersteller
    if (dynamicChannel.createdByUser !== interaction.user.id) {
      return interaction.followUp({
        content: 'Nur der Ersteller dieses Kanals darf bestimmte User zulassen.',
        ephemeral: true,
      });
    }

    // Ausgewählte User
    const selectedUserIds = interaction.values;
    console.log('[DEBUG] => selectedUserIds=', selectedUserIds);

    // NEU: Filter: blockierte User NICHT in allowedUsers aufnehmen
    const oldBlocked = dynamicChannel.blockedUsers || [];
    const filteredIds = selectedUserIds.filter(u => !oldBlocked.includes(u));

    if (filteredIds.length < selectedUserIds.length) {
      // => Mindestens 1 User war blockiert
      await interaction.followUp({
        content: 'Einige gewählte User sind blockiert und konnten nicht erneut zugelassen werden.',
        ephemeral: true,
      });
    }

    // 2) DB updaten (allowedUsers)
    const oldAllowed = dynamicChannel.allowedUsers || [];
    const newAllowed = Array.from(new Set([...oldAllowed, ...filteredIds]));

    await prisma.dynamicVoiceChannel.update({
      where: { id: dynamicChannel.id },
      data: { allowedUsers: newAllowed },
    });
    console.log('[DEBUG] => updated allowedUsers in DB');

    // 3) Overwrites sofort setzen NUR WENN der User bereits Setup gemacht hat
    for (const userId of filteredIds) {
      try {
        const hasTracking = await prisma.userTracking.findUnique({
          where: { userId },
        });

        if (hasTracking) {
          console.log('[DEBUG] => Overwrite now for userId=' + userId);
          await voiceChannel.permissionOverwrites.edit(userId, { Connect: true });
        } else {
          console.log(`[DEBUG] => userId=${userId} hat NOCH KEIN SETUP => kein Overwrite jetzt`);
        }
      } catch (err) {
        console.error('[DEBUG] Fehler beim Overwrite:', err);
      }
    }

    // 4) Abschlussmeldung
    return interaction.followUp({
      content: `Die folgenden User wurden zugelassen (falls sie schon Setup haben, sind sie sofort freigeschaltet):\n`
        + filteredIds.map(id => `<@${id}>`).join(', '),
      ephemeral: true,
    });

  } catch (err) {
    console.error('handleVoiceAllowSelect Fehler:', err);
    try {
      return interaction.followUp({
        content: 'Ein Fehler ist aufgetreten beim Zulassen.',
        ephemeral: true,
      });
    } catch {
      // ignore
    }
  }
}
