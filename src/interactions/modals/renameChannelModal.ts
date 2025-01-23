import {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ButtonInteraction,
  } from 'discord.js';
  
  export async function showRenameChannelModal(interaction: ButtonInteraction) {
    const modal = new ModalBuilder()
      .setCustomId('rename_channel_modal')
      .setTitle('Kanal umbenennen');
  
    const renameInput = new TextInputBuilder()
      .setCustomId('rename_channel_input')
      .setLabel('Neuer Kanalname (ohne Prefix)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
  
    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(renameInput);
    modal.addComponents(row);
  
    await interaction.showModal(modal);
  }
  