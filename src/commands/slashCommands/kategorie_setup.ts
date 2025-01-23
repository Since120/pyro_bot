// src/bot/commands/slashCommands/kategorie_setup.ts

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ChannelType,
  PermissionFlagsBits,
  CategoryChannel,
} from 'discord.js';
import logger from '../../services/logger';
import { getSetupChannels, deleteSetupChannels, saveSetupChannels } from '../../services/setupService';
import { prisma } from '../../services/dbClient';

/**
 * Merged Code: 
 *  1) Lässt dich eine Kategorie wählen.
 *  2) Speichert die Category-ID in adminSettings (voiceCategoryId).
 *  3) Löscht (falls vorhanden) alte Channels (Text/Voice), 
 *  4) Erstellt neue Kanäle (Text + Voice) und speichert sie in SetupChannels.
 */
export const data = new SlashCommandBuilder()
  .setName('kategorie_setup')
  .setDescription(
    'Erstelle in einer gewählten Kategorie automatisch einen Text- & Voice-Channel.'
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  // 1) Kategorie (Pflicht)
  .addChannelOption((option) =>
    option
      .setName('kategorie')
      .setDescription('Wähle die Kategorie für die neuen Kanäle.')
      .addChannelTypes(ChannelType.GuildCategory)
      .setRequired(true)
  )
  // 2) Textkanal-Name
  .addStringOption((option) =>
    option
      .setName('textchannel_name')
      .setDescription('Name des Textkanals')
      .setRequired(true)
  )
  // 3) Voicekanal-Name
  .addStringOption((option) =>
    option
      .setName('voicechannel_name')
      .setDescription('Name des Voicekanals')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const guild = interaction.guild;
    if (!guild) {
      return interaction.reply({
        content: 'Fehler: Dieser Befehl kann nur innerhalb einer Gilde verwendet werden!',
        ephemeral: true,
      });
    }

    // Ausgelesene Optionen
    const categoryChannel = interaction.options.getChannel('kategorie', true);
    const textName = interaction.options.getString('textchannel_name', true);
    const voiceName = interaction.options.getString('voicechannel_name', true);

    // Prüfen, ob der Channel wirklich eine Kategorie ist
    if (categoryChannel.type !== ChannelType.GuildCategory) {
      return interaction.reply({
        content: 'Bitte wähle **eine Kategorie** aus.',
        ephemeral: true,
      });
    }

    // 1) Alte SetupChannels (wenn vorhanden) aus DB lesen
    const oldSetup = await getSetupChannels();
    if (oldSetup) {
      // 2) Versuche, die alten Kanäle zu löschen
      try {
        const oldTextChannel = await guild.channels.fetch(oldSetup.textChannelId).catch(() => null);
        if (oldTextChannel) {
          await oldTextChannel.delete('Kategorie-Setup: Alte Textchannel entfernen');
          logger.info(`Alter Textkanal (${oldSetup.textChannelId}) gelöscht.`);
        }
        const oldVoiceChannel = await guild.channels.fetch(oldSetup.voiceChannelId).catch(() => null);
        if (oldVoiceChannel) {
          await oldVoiceChannel.delete('Kategorie-Setup: Alte Voicechannel entfernen');
          logger.info(`Alter Voicekanal (${oldSetup.voiceChannelId}) gelöscht.`);
        }
      } catch (err) {
        logger.warn(`Fehler beim Löschen alter Kanäle: ${err}`);
      }

      // 3) DB-Eintrag für altes Setup löschen
      await deleteSetupChannels();
    }

    // 4) Neue Kanäle erstellen
    const createdText = await guild.channels.create({
      name: textName,
      type: ChannelType.GuildText,
      parent: categoryChannel.id,
      reason: 'Kategorie-Setup: Neuer Textkanal',
    });

    const createdVoice = await guild.channels.create({
      name: voiceName,
      type: ChannelType.GuildVoice,
      parent: categoryChannel.id,
      reason: 'Kategorie-Setup: Neuer Voicekanal',
    });

    // 5) DB: Neuer SetupChannels-Eintrag
    await saveSetupChannels(categoryChannel.id, createdText.id, createdVoice.id);

    logger.info(
      `Neues Setup in Category="${categoryChannel.name}" / Text="${textName}" / Voice="${voiceName}" gespeichert.`
    );

    // 6) voiceCategoryId in adminSettings
    let settings = await prisma.adminSettings.findFirst();
    if (!settings) {
      settings = await prisma.adminSettings.create({ data: {} });
    }
    await prisma.adminSettings.update({
      where: { id: settings.id },
      data: { voiceCategoryId: categoryChannel.id },
    });
    logger.info(`Kategorie-Setup: voiceCategoryId = ${categoryChannel.id}`);

    // 7) Antwort an den User
    return interaction.reply({
      content:
        `**Fertig!**\nAlte Kanäle (falls existierten) wurden gelöscht.\n` +
        `Neue Kanäle erstellt in **${categoryChannel.name}**.` +
        `\nvoiceCategoryId in adminSettings auf "${categoryChannel.id}" gesetzt.`,
      ephemeral: true,
    });
  } catch (error) {
    logger.error('Fehler bei /kategorie_setup:', error);
    // NEU: Hier nur den Catch anpassen
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content: `Fehler: ${(error as Error).message}`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `Fehler: ${(error as Error).message}`,
        ephemeral: true,
      });
    }
  }
}
