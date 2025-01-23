import {
  StringSelectMenuInteraction,
  UserSelectMenuInteraction
} from 'discord.js';
import logger from '../services/logger';

/**
 * Wir fassen beide möglichen Typen in einem Union-Typ zusammen:
 */
type AnySelectMenuInteraction = StringSelectMenuInteraction | UserSelectMenuInteraction;

/**
 * Haupt-Handler für *alle* SelectMenu-Interaktionen (StringSelect oder UserSelect).
 */
export async function handleSelectMenu(interaction: AnySelectMenuInteraction) {
  // Debug
  logger.info(`[DEBUG] handleSelectMenu => customId=${interaction.customId}, user=${interaction.user.tag}`);

  const customId = interaction.customId;

  // 1) StringSelectMenu
  if (interaction.isStringSelectMenu() && customId === 'zone_select_create') {
    logger.info('[DEBUG] => isStringSelectMenu & zone_select_create');
    const { handleZoneSelect } = require('../interactions/selectMenus/zoneSelectHandler');
    return handleZoneSelect(interaction);
  }

  // 2) UserSelectMenu Allow
  if (interaction.isUserSelectMenu() && customId === 'voice_allow_select') {
    logger.info('[DEBUG] => isUserSelectMenu & voice_allow_select');
    const { handleVoiceAllowSelect } = require('../interactions/selectMenus/voiceAllowSelectMenu');
    return handleVoiceAllowSelect(interaction);
  }

  // 3) UserSelectMenu Block
  if (interaction.isUserSelectMenu() && customId === 'voice_block_select') {
    logger.info('[DEBUG] => isUserSelectMenu & voice_block_select');
    const { handleVoiceBlockSelect } = require('../interactions/selectMenus/voiceBlockSelectMenu');
    return handleVoiceBlockSelect(interaction);
  }

  // Fallback
  logger.info('[DEBUG] => Fallback: Unbekanntes SelectMenu.');
  return interaction.reply({
    content: 'Unbekannter SelectMenu.',
    ephemeral: true,
  });
}
