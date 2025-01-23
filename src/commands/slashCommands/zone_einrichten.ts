// src/bot/commands/slashCommands/zone_einrichten.ts

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits
} from 'discord.js';

import { createOrUpdateZone } from '../../services/zoneService';
import logger from '../../services/logger';

export const data = new SlashCommandBuilder()
  .setName('zone_einrichten')
  .setDescription('Erstellt oder aktualisiert eine Zone (Minuten und Punkte).')
  // Nur Admin-Recht:
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption(option =>
    option
      .setName('zone_key')
      .setDescription('Das Kürzel der Zone (z.B. "CZ").')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('zone_name')
      .setDescription('Anzeigename der Zone (z.B. "Contested Zone").')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName('benoetigte_minuten')
      .setDescription('Die Anzahl der benötigten Minuten.')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName('punkte')
      .setDescription('Die Anzahl der Punkte, die vergeben werden.')
      .setRequired(true)
  );

/**
 * Führt den Befehl aus, wenn ein Admin "/zone_einrichten" eingibt.
 */
export async function execute(interaction: ChatInputCommandInteraction) {
  // 1) Admin-Check:
  if (!interaction.memberPermissions?.has('Administrator')) {
    return interaction.reply({
      content: 'Nur Administratoren dürfen diesen Befehl ausführen.',
      ephemeral: true
    });
  }

  // 2) Argumente auslesen
  const zoneKey = interaction.options.getString('zone_key', true);
  const zoneName = interaction.options.getString('zone_name', true);
  const minutesRequired = interaction.options.getInteger('benoetigte_minuten', true);
  const pointsGranted = interaction.options.getInteger('punkte', true);

  try {
    // 3) Zone anlegen / updaten
    const zone = await createOrUpdateZone(zoneKey, zoneName, minutesRequired, pointsGranted);
    logger.info(`Zone "${zoneKey}" eingerichtet/aktualisiert: ${zoneName}`);

    // 4) Erfolgsmeldung
    await interaction.reply({
      content: `Zone **${zoneName}** (Key: ${zoneKey}) wurde eingerichtet.\n` +
               `${minutesRequired} Min ➔ +${pointsGranted} Punkte.`,
      ephemeral: true
    });

  } catch (error: any) {
    logger.error('Fehler bei zone_einrichten:', error);
    // NEU: Nur den Catch ändern
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content: `Fehler: ${error.message}`,
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: `Fehler: ${error.message}`,
        ephemeral: true
      });
    }
  }
}
