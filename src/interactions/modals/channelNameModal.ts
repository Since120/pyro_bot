// src/bot/interactions/modals/channelNameModal.ts
import {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ButtonInteraction,
  } from 'discord.js';
  
  export async function showChannelNameModal(interaction: ButtonInteraction) {
    const modal = new ModalBuilder()
      .setCustomId('channel_name_modal')
      .setTitle('Neuen Voice-Kanal erstellen');
  
    const channelNameInput = new TextInputBuilder()
      .setCustomId('channel_name_input')
      .setLabel('Wie soll dein Voice-Kanal heißen?')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
  
    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(channelNameInput);
    modal.addComponents(row);
  
    await interaction.showModal(modal);
  }
  