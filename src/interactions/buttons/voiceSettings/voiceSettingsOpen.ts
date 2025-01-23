import { ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

/**
 * Wird aufgerufen, wenn der User auf 'voice_settings' klickt.
 * Diese Funktion schickt dem User eine ephemere Nachricht mit 4 Platzhalter-Buttons.
 */
export async function voiceSettingsOpen(interaction: ButtonInteraction) {
  // 4 Buttons => voice_setting_A/B/C/D
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('voice_setting_A')
      .setEmoji({ id: '1330618552427872398', name: 'Unbennen' })
      .setLabel('\u200B') // unsichtbarer Platzhalter
      .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
      .setCustomId('voice_setting_B')
      .setEmoji({ id: '1330621679071789196', name: 'Limite' })
      .setLabel('\u200B') // unsichtbarer Platzhalter
      .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
      .setCustomId('voice_setting_C')
      .setEmoji({ id: '1330622533418094655', name: 'Schloss' })
      .setLabel('\u200B') // unsichtbarer Platzhalter
      .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
      .setCustomId('voice_setting_D')
      .setEmoji({ id: '1330623816916795523', name: 'Member' })
      .setLabel('\u200B') // unsichtbarer Platzhalter
      .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
      .setCustomId('voice_setting_E')
      .setEmoji({ id: '1330625320637956096', name: 'Member' })
      .setLabel('\u200B') // unsichtbarer Platzhalter
      .setStyle(ButtonStyle.Secondary),
  );

  await interaction.reply({
    content:
      '**Voice-Einstellungen**\n' +
      '\n' +
      `<:Unbennen:1330618552427872398> - **Channel umbenennen**\n` +
      `<:Limite:1330621679071789196> - **Channel limitieren**\n` +
      `<:Schloss:1330622533418094655> - **Channel sperren**\n` +
      `<:Member:1330623816916795523> - **User hinzufügen** (wenn Kanal gesperrt)\n` +
      `<:Member:1330625320637956096> - **User einzeln aussperren**\n` +
      '\n' +
      'Klicke einfach auf den passenden Button, um die gewünschte Aktion auszuführen.',
    components: [row], // Deine ActionRow mit den 5 Buttons
    ephemeral: true,   // Nur der User sieht diese Nachricht
  });
}