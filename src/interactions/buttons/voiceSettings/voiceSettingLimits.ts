import { ButtonInteraction } from 'discord.js';
import { prisma } from '../../../services/dbClient';
import { showLimitChannelModal } from '../../modals/limitChannelModal';

export async function voiceSettingB(interaction: ButtonInteraction) {
  const guild = interaction.guild;
  if (!guild) {
    return interaction.reply({
      content: 'Fehler: Dieser Befehl kann nur in einer Gilde ausgeführt werden.',
      ephemeral: true,
    });
  }

  const member = await guild.members.fetch(interaction.user.id);
  const voiceChannel = member.voice.channel;
  if (!voiceChannel) {
    return interaction.reply({
      content: 'Du bist nicht in einem Voice-Kanal. Bitte gehe in deinen Kanal.',
      ephemeral: true,
    });
  }

  // Prüfen, ob dieser Voice-Kanal in der DB existiert
  const dynamicChannel = await prisma.dynamicVoiceChannel.findFirst({
    where: { channelId: voiceChannel.id },
  });

  if (!dynamicChannel) {
    return interaction.reply({
      content: 'Dies ist kein dynamischer Kanal (oder nicht vom Bot verwaltet).',
      ephemeral: true,
    });
  }

  // Prüfen, ob der aktuelle User der Ersteller ist
  if (dynamicChannel.createdByUser !== interaction.user.id) {
    return interaction.reply({
      content: 'Nur der Ersteller dieses Kanals darf das Nutzerlimit ändern.',
      ephemeral: true,
    });
  }

  // Wenn wir hier sind, darf der User das Limit ändern => zeige Modal
  await showLimitChannelModal(interaction);
  // Keine weitere Antwort nötig; das Modal übernimmt den Flow
}