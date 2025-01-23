// src/bot/commands/slashCommands/role_freigabe_setup.ts

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import logger from '../../services/logger';
import { upsertRoleConfig } from '../../services/roleConfigService';

export const data = new SlashCommandBuilder()
  .setName('role_freigabe_setup')
  .setDescription('Definiert oder ändert die Freigabe-Rolle für dynamische Kanäle.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addRoleOption((option) =>
    option
      .setName('rolle')
      .setDescription('Die Discord-Rolle, die bei Freigabe vergeben wird.')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const role = interaction.options.getRole('rolle', true);

    // In DB: roleKey="freigabe", roleId=role.id
    await upsertRoleConfig('freigabe', role.id);

    logger.info(`Freigabe-Rolle eingerichtet: key="freigabe", roleId=${role.id}`);

    return interaction.reply({
      content: `OK! Die Rolle **${role.name}** wird nun als Freigabe-Rolle verwendet.`,
      ephemeral: true,
    });
  } catch (error) {
    logger.error('Fehler bei /role_freigabe_setup:', error);
    // NEU: Nur den Catch anpassen
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
