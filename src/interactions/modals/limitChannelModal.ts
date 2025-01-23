import {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ButtonInteraction,
  } from 'discord.js';
  
  export async function showLimitChannelModal(interaction: ButtonInteraction) {
    const modal = new ModalBuilder()
      .setCustomId('limit_channel_modal')
      .setTitle('Kanal-Limit einstellen');
  
    const limitInput = new TextInputBuilder()
      .setCustomId('limit_channel_input')
      .setLabel('User-Limit (0 = unbegrenzt)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder('z.B. 5 oder 0 für kein Limit');
  
    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(limitInput);
    modal.addComponents(row);
  
    await interaction.showModal(modal);
  }
  