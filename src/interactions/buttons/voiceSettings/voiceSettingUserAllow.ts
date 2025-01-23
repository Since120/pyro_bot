import { ButtonInteraction, ActionRowBuilder, UserSelectMenuBuilder } from 'discord.js';
import { prisma } from '../../../services/dbClient';

export async function voiceSettingD(interaction: ButtonInteraction) {
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

  const dynamicChannel = await prisma.dynamicVoiceChannel.findFirst({
    where: { channelId: voiceChannel.id },
  });
  if (!dynamicChannel) {
    return interaction.reply({
      content: 'Dies ist kein dynamischer Kanal (oder nicht vom Bot verwaltet).',
      ephemeral: true,
    });
  }

  if (dynamicChannel.createdByUser !== interaction.user.id) {
    return interaction.reply({
      content: 'Nur der Ersteller dieses Kanals darf bestimmte User zulassen.',
      ephemeral: true,
    });
  }

  // UserSelectMenu
  const userSelect = new UserSelectMenuBuilder()
    .setCustomId('voice_allow_select')
    .setPlaceholder('Wähle Mitglieder aus, die du zulassen willst')
    .setMinValues(1)
    .setMaxValues(10);

  const row = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(userSelect);

  return interaction.reply({
    content: 'Wähle jetzt die Mitglieder aus, die du in deinen Kanal lassen möchtest:',
    components: [row],
    ephemeral: true,
  });
}
