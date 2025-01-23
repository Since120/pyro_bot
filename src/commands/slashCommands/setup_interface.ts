// src/bot/commands/slashCommands/setup_interface.ts

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  TextChannel,
  NewsChannel
} from 'discord.js';
import logger from '../../services/logger';

export const data = new SlashCommandBuilder()
  .setName('setup_interface')
  .setDescription('Postet ein Embed mit einem Setup-Button in einem Textkanal.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addChannelOption((opt) =>
    opt
      .setName('kanal')
      .setDescription('Wähle den Textkanal, in dem das Setup-Interface erscheinen soll.')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const selectedChannel = interaction.options.getChannel('kanal', true);

    if (
      selectedChannel.type !== ChannelType.GuildText &&
      selectedChannel.type !== ChannelType.GuildAnnouncement
    ) {
      return interaction.reply({
        content: 'Bitte wähle einen Text- oder News-Kanal aus!',
        ephemeral: true
      });
    }

    const channel = selectedChannel as TextChannel | NewsChannel;

    const embed = new EmbedBuilder()
      .setTitle('Bot-Setup Interface')
      .setDescription('Klicke auf **Setup**, um das Tracking-/Channel-Setup zu starten.')
      .setColor(0x0099ff);

    // Zwei Buttons in einer ActionRow
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('setup_button')
        .setLabel('Setup')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('voice_settings')
        .setLabel('Voice Einstellungen')
        .setStyle(ButtonStyle.Secondary)
    );

    const msg = await channel.send({
      embeds: [embed],
      components: [row]
    });

    logger.info(`Setup-Interface in #${channel.name} gepostet (MsgId=${msg.id}).`);

    return interaction.reply({
      content: `Setup-Interface erfolgreich in **#${channel.name}** erstellt!`,
      ephemeral: true
    });
  } catch (error) {
    logger.error('Fehler bei /setup_interface:', error);
    // NEU: Nur den Catch anpassen
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content: `Fehler: ${(error as Error).message}`,
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: `Fehler: ${(error as Error).message}`,
        ephemeral: true
      });
    }
  }
}
