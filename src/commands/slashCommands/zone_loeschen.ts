import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits
  } from 'discord.js';
  
  import { deleteZone } from '../../services/zoneService';
  import logger from '../../services/logger';
  
  export const data = new SlashCommandBuilder()
    .setName('zone_loeschen')
    .setDescription('Löscht eine Zone anhand ihres Kürzels.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option
        .setName('zone_key')
        .setDescription('Das Kürzel der zu löschenden Zone.')
        .setRequired(true)
    );
  
  /**
   * Führt den Befehl aus, wenn ein Admin "/zone_loeschen" eingibt.
   */
  export async function execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has('Administrator')) {
      return interaction.reply({
        content: 'Nur Administratoren dürfen diesen Befehl ausführen.',
        ephemeral: true
      });
    }
  
    const zoneKey = interaction.options.getString('zone_key', true);
  
    try {
      const zone = await deleteZone(zoneKey);
      logger.info(`Zone "${zoneKey}" gelöscht.`);
      await interaction.reply({
        content: `Zone "${zoneKey}" wurde gelöscht.`,
        ephemeral: true
      });
    } catch (error: any) {
      logger.error('Fehler bei zone_loeschen:', error);
      await interaction.reply({
        content: `Fehler: ${error.message}`,
        ephemeral: true
      });
    }
  }
  