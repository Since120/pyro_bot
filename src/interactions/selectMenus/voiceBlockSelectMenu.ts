// src/bot/interactions/selectMenus/voiceBlockSelectMenu.ts

import { UserSelectMenuInteraction } from 'discord.js';
import { prisma } from '../../services/dbClient';

export async function handleVoiceBlockSelect(interaction: UserSelectMenuInteraction) {
  try {
    await interaction.deferUpdate();

    const guild = interaction.guild;
    if (!guild) {
      return interaction.followUp({ content: 'Fehler: Keine Guild.', ephemeral: true });
    }

    const member = await guild.members.fetch(interaction.user.id);
    const voiceChannel = member.voice.channel;
    if (!voiceChannel) {
      return interaction.followUp({
        content: 'Du bist in keinem Voice-Kanal.',
        ephemeral: true,
      });
    }

    // Prüfen, ob channel dynamisch + user Ersteller
    const dynamicChannel = await prisma.dynamicVoiceChannel.findFirst({
      where: { channelId: voiceChannel.id },
    });
    if (!dynamicChannel) {
      return interaction.followUp({
        content: 'Dies ist kein dynamischer Kanal.',
        ephemeral: true,
      });
    }
    if (dynamicChannel.createdByUser !== interaction.user.id) {
      return interaction.followUp({
        content: 'Nur der Ersteller darf User blocken!',
        ephemeral: true,
      });
    }

    // Ausgewählte User blocken
    const selectedUserIds = interaction.values; // string[]
    const oldBlocked = dynamicChannel.blockedUsers || [];
    const oldAllowed = dynamicChannel.allowedUsers || [];

    // 1) Merge die neuen blockierten
    const newBlocked = Array.from(new Set([...oldBlocked, ...selectedUserIds]));

    // 2) Falls ein User in allowedUsers ist, entfernen wir ihn daraus
    let newAllowed = [...oldAllowed];
    for (const blockedId of selectedUserIds) {
      if (newAllowed.includes(blockedId)) {
        newAllowed = newAllowed.filter(u => u !== blockedId);
      }
    }

    // DB-Update
    await prisma.dynamicVoiceChannel.update({
      where: { id: dynamicChannel.id },
      data: {
        blockedUsers: newBlocked,
        allowedUsers: newAllowed,
      },
    });

    // Nun setzen wir Overwrites = false
    for (const userId of selectedUserIds) {
      try {
        // Hard-Block: Connect=false
        await voiceChannel.permissionOverwrites.edit(userId, { Connect: false });

        // Optional: Wenn der User gerade im Voice ist, könnte man ihn kicken:
        // if (voiceChannel.members.has(userId)) {
        //   const blockedMember = await guild.members.fetch(userId);
        //   await blockedMember.voice.disconnect();
        // }
      } catch (err) {
        console.error('Fehler beim Overwrite (block):', err);
      }
    }

    return interaction.followUp({
      content: `Folgende User wurden blockiert:\n`
        + selectedUserIds.map(id => `<@${id}>`).join(', '),
      ephemeral: true,
    });

  } catch (err) {
    console.error('handleVoiceBlockSelect Fehler:', err);
    try {
      return interaction.followUp({
        content: 'Ein Fehler ist aufgetreten beim Blocken.',
        ephemeral: true,
      });
    } catch {
      // fallback
    }
  }
}
