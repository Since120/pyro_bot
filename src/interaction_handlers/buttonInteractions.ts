import {
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  GuildMember,
  Guild,
} from 'discord.js';
import logger from '../services/logger';
import { getRoleConfigByKey } from '../services/roleConfigService';
import { prisma } from '../services/dbClient';
import { showChannelNameModal } from '../interactions/modals/channelNameModal';

// NEU importieren
import { voiceSettingsOpen } from '../interactions/buttons/voiceSettings/voiceSettingsOpen';
import { voiceSettingA } from '../interactions/buttons/voiceSettings/voiceSettingumbennen';
import { voiceSettingB } from '../interactions/buttons/voiceSettings/voiceSettingLimits';
import { voiceSettingC } from '../interactions/buttons/voiceSettings/voiceSettingClose';
import { voiceSettingD } from '../interactions/buttons/voiceSettings/voiceSettingUserAllow';
import { voiceSettingE } from '../interactions/buttons/voiceSettings/voiceSettingBlock';

/**
 * Haupt-Dispatcher für alle Button-Clicks.
 */
export async function handleButton(interaction: ButtonInteraction) {
  const customId = interaction.customId;
  logger.info(`Button geklickt: ${customId}, von ${interaction.user.tag}`);

  if (customId === 'setup_button') {
    return handleSetupButton(interaction);
  } else if (
    customId === 'freigabe_aktivieren' ||
    customId === 'freigabe_deaktivieren'
  ) {
    return handleFreigabeChoice(interaction, customId);
  } else if (customId === 'voice_choice_create') {
    return handleVoiceCreate(interaction);

  // NEU: Voice Settings Haupt-Button
  } else if (customId === 'voice_settings') {
    return voiceSettingsOpen(interaction);

  // NEU: 4 Buttons (A, B, C, D)
  } else if (customId === 'voice_setting_A') {
    return voiceSettingA(interaction);
  } else if (customId === 'voice_setting_B') {
    return voiceSettingB(interaction);
  } else if (customId === 'voice_setting_C') {
    return voiceSettingC(interaction);
  } else if (customId === 'voice_setting_D') {
    return voiceSettingD(interaction);
  } else if (customId === 'voice_setting_E') {
    return voiceSettingE(interaction);
  }

  return interaction.reply({
    content: 'Unbekannter Button.',
    ephemeral: true,
  });
}

/**
 * 1) Haupt-Setup-Button:
 *    - Zeigt dem User 2 Buttons: "Tracking aktivieren" oder "Tracking deaktivieren".
 */
async function handleSetupButton(interaction: ButtonInteraction) {
  const canProceed = await ensureUserInDefinedCategory(interaction);
  if (!canProceed) return;

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('freigabe_aktivieren')
      .setLabel('Tracking aktivieren')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('freigabe_deaktivieren')
      .setLabel('Tracking deaktivieren')
      .setStyle(ButtonStyle.Danger)
  );

  await interaction.reply({
    content:
      'Möchtest du das Tracking aktivieren oder deaktivieren?\n' +
      '(Die Freigabe-Rolle zum Betreten aller Kanäle dieser Kategorie bekommst du **in beiden Fällen**.)',
    components: [row],
    ephemeral: true,
  });
}

/**
 * 2) Freigabe Choice:
 *    - Vergibt (oder behält) die Freigabe-Rolle
 *    - Setzt isTracked in der DB (true oder false)
 *    - NEU: Ruft applyAllowedUserOverwrites(...) auf, damit der User ggf. in gesperrte Kanäle kann
 */
async function handleFreigabeChoice(interaction: ButtonInteraction, mode: string) {
  const canProceed = await ensureUserInDefinedCategory(interaction);
  if (!canProceed) return;

  const guild = interaction.guild;
  if (!guild) {
    return interaction.reply({
      content: 'Fehler: Nur in einer Gilde nutzbar.',
      ephemeral: true,
    });
  }

  // Hole die definierte Freigabe-Rolle (Setup via /role_freigabe_setup)
  const freigabeConfig = await getRoleConfigByKey('freigabe');
  if (!freigabeConfig) {
    return interaction.reply({
      content: 'Keine Freigabe-Rolle eingerichtet. Nutze /role_freigabe_setup!',
      ephemeral: true,
    });
  }

  try {
    const member = await guild.members.fetch(interaction.user.id);

    // 2.1) Freigabe-Rolle vergeben => egal ob Tracking an/aus
    await member.roles.add(freigabeConfig.roleId);
    logger.info(`Freigabe-Rolle an ${member.user.tag} vergeben.`);

    // 2.2) isTracked in DB setzen => true, wenn 'freigabe_aktivieren', false wenn 'freigabe_deaktivieren'
    const setTracked = (mode === 'freigabe_aktivieren');
    await upsertUserTrackedStatus(member.id, setTracked);

    // 2.3) NEU: Overwrites für Kanäle, in denen dieser User in allowedUsers steht
    await applyAllowedUserOverwrites(member, guild);

  } catch (err) {
    logger.warn(`Fehler bei Freigabe-Aktion:`, err);
  }

  // Nächster Button: "Neuen Voice-Kanal erstellen"
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('voice_choice_create')
      .setLabel('Neuen Voice-Kanal erstellen')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({
    content:
      `**Hinweis:** Du kannst nun jedem bestehenden Kanal in dieser Kategorie beitreten, ` +
      `oder du erstellst dir einen eigenen neuen Voice-Kanal:`,
    components: [row],
    ephemeral: true,
  });
}

/**
 * 3) "Neuen Voice erstellen" => zeige das Modal für den Kanalnamen
 */
async function handleVoiceCreate(interaction: ButtonInteraction) {
  const canProceed = await ensureUserInDefinedCategory(interaction);
  if (!canProceed) return;

  // Zeige das Modal => user kann Kanalnamen eingeben
  return showChannelNameModal(interaction);
}

/**
 * Hilfsfunktion:
 *  - Prüft, ob User in einem Voice-Kanal der definierten Kategorie sitzt
 */
async function ensureUserInDefinedCategory(interaction: ButtonInteraction): Promise<boolean> {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({
      content: 'Fehler: Nur in einer Gilde nutzbar.',
      ephemeral: true,
    });
    return false;
  }

  const member = await guild.members.fetch(interaction.user.id);
  if (!member.voice.channel) {
    await interaction.reply({
      content:
        'Bitte tritt zuerst einem Voice-Kanal dieser Kategorie bei (z.B. Wartekanal).',
      ephemeral: true,
    });
    return false;
  }

  // Schau in adminSettings, welche Kategorie definiert wurde
  const settings = await prisma.adminSettings.findFirst();
  if (!settings || !settings.voiceCategoryId) {
    await interaction.reply({
      content: 'Keine Voice-Kategorie definiert. Nutze /kategorie_setup!',
      ephemeral: true,
    });
    return false;
  }

  if (member.voice.channel.parentId !== settings.voiceCategoryId) {
    await interaction.reply({
      content:
        `Dieser Voice-Channel liegt nicht in der definierten Kategorie!\n` +
        `Bitte wechsle in den Wartekanal oder einen dynamischen Kanal in der richtigen Kategorie.`,
      ephemeral: true,
    });
    return false;
  }

  return true;
}

/**
 * Hilfsfunktion:
 *  - Legt oder aktualisiert den UserTracking-Eintrag (isTracked)
 */
async function upsertUserTrackedStatus(discordUserId: string, isTracked: boolean) {
  await prisma.userTracking.upsert({
    where: { userId: discordUserId },
    update: { isTracked },
    create: {
      userId: discordUserId,
      isTracked,
    },
  });

  logger.info(`UserTracking upsert: userId=${discordUserId}, isTracked=${isTracked}`);
}

/**
 * NEU: Hilfsfunktion, um Overwrites zu setzen, wenn der User
 * bereits in allowedUsers eingetragen ist. So kann er gesperrte Kanäle joinen.
 */
async function applyAllowedUserOverwrites(member: GuildMember, guild: Guild) {
  const userId = member.id;

  // Hole alle Channels, in denen der User in allowedUsers ist
  const dynamicChannels = await prisma.dynamicVoiceChannel.findMany({
    where: { allowedUsers: { has: userId } },
  });

  for (const chan of dynamicChannels) {
    // Prüfe, ob user in blockedUsers
    if (chan.blockedUsers && chan.blockedUsers.includes(userId)) {
      // => user ist blockiert => skip
      continue;
    }

    const channelObj = guild.channels.cache.get(chan.channelId);
    if (!channelObj || !channelObj.isVoiceBased()) {
      continue;
    }

    // Overwrite: CONNECT = true
    await channelObj.permissionOverwrites.edit(userId, { Connect: true });
  }

  // Kein Reply hier – das läuft nur intern im Hintergrund
}
