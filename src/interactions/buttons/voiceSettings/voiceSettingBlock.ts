import { ButtonInteraction, ActionRowBuilder, UserSelectMenuBuilder } from 'discord.js';
import logger from '../../../services/logger';

export async function voiceSettingE(interaction: ButtonInteraction) {
  const guild = interaction.guild;
  if (!guild) {
    return interaction.reply({
      content: 'Fehler: Nur in einer Gilde nutzbar.',
      ephemeral: true,
    });
  }

  // Wir erstellen ein UserSelect-Menü
  const userSelect = new UserSelectMenuBuilder()
    .setCustomId('voice_block_select') // => Im selectMenuInteractions.ts fangen wir das ab
    .setPlaceholder('Wähle Mitglieder, die du blocken willst')
    .setMinValues(1)
    .setMaxValues(10);

  const row = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(userSelect);

  // Ephemeres Reply mit dem SelectMenu
  return interaction.reply({
    content: 'Wähle jetzt die User aus, die du blocken möchtest:',
    components: [row],
    ephemeral: true,
  });
}
