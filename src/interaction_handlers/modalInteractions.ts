import {
  ModalSubmitInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import logger from '../services/logger';

// Falls du dein sessionData anderswo brauchst, 
// kannst du es natürlich in einer separaten Datei pflegen.
const sessionData: Map<string, { channelName?: string; zoneKey?: string }> = new Map();

// NEU: Prisma-Import
import { prisma } from '../services/dbClient';

export async function handleModal(interaction: ModalSubmitInteraction) {
  const customId = interaction.customId;
  logger.info(`Modal Submit: ${customId} by ${interaction.user.tag}`);

  if (customId === 'channel_name_modal') {
    return handleChannelNameSubmit(interaction);
  } 
  else if (customId === 'rename_channel_modal') {
    return handleRenameChannelSubmit(interaction);
  }
  // NEU: Limit-Modal
  else if (customId === 'limit_channel_modal') {
    return handleLimitChannelSubmit(interaction);
  }

  return interaction.reply({
    content: 'Unbekanntes Modal.',
    ephemeral: true,
  });
}

/**
 * Wird getriggert, wenn der User den Kanalnamen im Modal eingibt
 * (Neuen Voice-Kanal erstellen).
 */
async function handleChannelNameSubmit(interaction: ModalSubmitInteraction) {
  const channelName = interaction.fields.getTextInputValue('channel_name_input')?.trim();
  if (!channelName) {
    return interaction.reply({
      content: 'Kanalname darf nicht leer sein.',
      ephemeral: true,
    });
  }

  // Zwischenspeichern im sessionData
  const userId = interaction.user.id;
  sessionData.set(userId, { channelName });

  // Jetzt wollen wir die Zonen-Auswahl als SelectMenu zeigen.
  // ACHTUNG: Pfad anpassen => "../interactions/selectMenus/zoneSelectHandler"
  const { buildZoneSelectMenu } = require('../interactions/selectMenus/zoneSelectHandler');

  let menuRow;
  try {
    menuRow = await buildZoneSelectMenu('zone_select_create');
  } catch (err) {
    logger.error('Fehler beim Erstellen des Zonen-Menüs:', err);
    return interaction.reply({
      content: `Fehler bei der Zonen-Auswahl: ${(err as Error).message}`,
      ephemeral: true,
    });
  }

  return interaction.reply({
    content: `**Kanalname:** ${channelName}\nWähle nun eine Zone:`,
    components: [menuRow],
    ephemeral: true,
  });
}

/**
 * NEU: Wird getriggert, wenn der User den Kanal-Umbenennen-Modal abschickt.
 */
async function handleRenameChannelSubmit(interaction: ModalSubmitInteraction) {
  const newName = interaction.fields.getTextInputValue('rename_channel_input')?.trim();
  if (!newName) {
    return interaction.reply({
      content: 'Der neue Kanalname darf nicht leer sein.',
      ephemeral: true,
    });
  }

  const guild = interaction.guild;
  if (!guild) {
    return interaction.reply({
      content: 'Fehler: Nur in einer Gilde nutzbar.',
      ephemeral: true,
    });
  }

  // Prüfen, ob der User in einem VoiceChannel ist
  const member = await guild.members.fetch(interaction.user.id);
  const voiceChannel = member.voice.channel;
  if (!voiceChannel) {
    return interaction.reply({
      content: 'Du bist aktuell in keinem Voice-Kanal.',
      ephemeral: true,
    });
  }

  // DB-Abfrage, um zoneKey zu holen
  const dynamicChannel = await prisma.dynamicVoiceChannel.findFirst({
    where: { channelId: voiceChannel.id },
  });

  if (!dynamicChannel) {
    return interaction.reply({
      content: 'Dies ist kein dynamischer Kanal (oder nicht vom Bot verwaltet).',
      ephemeral: true,
    });
  }

  // Sicherheitshalber nochmals checken, ob der User der Ersteller ist
  if (dynamicChannel.createdByUser !== interaction.user.id) {
    return interaction.reply({
      content: 'Nur der Ersteller dieses Kanals darf den Namen ändern.',
      ephemeral: true,
    });
  }

  // zoneKey?
  const { zoneKey } = dynamicChannel;
  if (!zoneKey) {
    return interaction.reply({
      content: 'Keine Zone für diesen Kanal gefunden, Umbenennen nicht möglich.',
      ephemeral: true,
    });
  }

  // Neuen Namen setzen
  try {
    await voiceChannel.setName(`${zoneKey} - ${newName}`);
    return interaction.reply({
      content: `Kanalname geändert zu: **${zoneKey} - ${newName}**`,
      ephemeral: true,
    });
  } catch (err) {
    logger.error('Fehler beim Umbenennen:', err);
    return interaction.reply({
      content: 'Konnte den Kanal nicht umbenennen.',
      ephemeral: true,
    });
  }
}

/**
 * NEU: Wird getriggert, wenn der User das Kanal-Limit-Modal abschickt.
 */
async function handleLimitChannelSubmit(interaction: ModalSubmitInteraction) {
  const limitValue = interaction.fields.getTextInputValue('limit_channel_input')?.trim();
  if (!limitValue) {
    return interaction.reply({
      content: 'Bitte gib ein Limit ein (0 für unbegrenzt).',
      ephemeral: true,
    });
  }

  // Versuchen, eine Zahl zu parsen
  const limitNumber = parseInt(limitValue, 10);
  if (isNaN(limitNumber) || limitNumber < 0 || limitNumber > 99) {
    return interaction.reply({
      content: 'Ungültige Eingabe. Bitte gib eine Zahl zwischen 0 und 99 ein.',
      ephemeral: true,
    });
  }

  const guild = interaction.guild;
  if (!guild) {
    return interaction.reply({
      content: 'Fehler: Nur in einer Gilde nutzbar.',
      ephemeral: true,
    });
  }

  // Prüfen, ob der User in einem VoiceChannel ist
  const member = await guild.members.fetch(interaction.user.id);
  const voiceChannel = member.voice.channel;
  if (!voiceChannel) {
    return interaction.reply({
      content: 'Du bist aktuell in keinem Voice-Kanal.',
      ephemeral: true,
    });
  }

  // DB-Abfrage => check dynamicChannel
  const dynamicChannel = await prisma.dynamicVoiceChannel.findFirst({
    where: { channelId: voiceChannel.id },
  });

  if (!dynamicChannel) {
    return interaction.reply({
      content: 'Dies ist kein dynamischer Kanal (oder nicht vom Bot verwaltet).',
      ephemeral: true,
    });
  }

  // Ersteller-Check
  if (dynamicChannel.createdByUser !== interaction.user.id) {
    return interaction.reply({
      content: 'Nur der Ersteller dieses Kanals darf das Nutzerlimit ändern.',
      ephemeral: true,
    });
  }

  // Jetzt das Limit setzen (0 = unbegrenzt)
  try {
    await voiceChannel.setUserLimit(limitNumber === 0 ? 0 : limitNumber);

    if (limitNumber === 0) {
      return interaction.reply({
        content: 'Kanal-Limit wurde entfernt (unbegrenzt).',
        ephemeral: true,
      });
    } else {
      return interaction.reply({
        content: `Kanal-Limit auf **${limitNumber}** gesetzt.`,
        ephemeral: true,
      });
    }

  } catch (err) {
    logger.error('Fehler beim Setzen des Kanal-Limits:', err);
    return interaction.reply({
      content: 'Konnte das Kanal-Limit nicht ändern.',
      ephemeral: true,
    });
  }
}

// Optional exportieren, falls du sessionData woanders brauchst
export { sessionData };
