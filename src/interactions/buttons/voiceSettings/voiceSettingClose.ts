import { ButtonInteraction, PermissionOverwrites } from 'discord.js';
import { prisma } from '../../../services/dbClient';
import { getRoleConfigByKey } from '../../../services/roleConfigService';

export async function voiceSettingC(interaction: ButtonInteraction) {
  const guild = interaction.guild;
  if (!guild) {
    return interaction.reply({
      content: 'Fehler: Dieser Befehl kann nur in einer Gilde ausgeführt werden.',
      ephemeral: true,
    });
  }

  const member = await guild.members.fetch(interaction.user.id);
  const voiceChannel = member.voice.channel;
  if (!voiceChannel) {
    return interaction.reply({
      content: 'Du bist nicht in einem Voice-Kanal. Bitte wechsle in deinen Kanal.',
      ephemeral: true,
    });
  }

  // Prüfen, ob dieser Voice-Kanal in der DB existiert
  const dynamicChannel = await prisma.dynamicVoiceChannel.findFirst({
    where: { channelId: voiceChannel.id },
  });

  if (!dynamicChannel) {
    return interaction.reply({
      content: 'Dies ist kein dynamischer Kanal (oder nicht vom Bot verwaltet).',
      ephemeral: true,
    });
  }

  // Prüfen, ob der aktuelle User der Ersteller ist
  if (dynamicChannel.createdByUser !== interaction.user.id) {
    return interaction.reply({
      content: 'Nur der Ersteller dieses Kanals darf den Kanal schließen.',
      ephemeral: true,
    });
  }

  // Freigabe-Rolle aus DB holen
  const freigabeConfig = await getRoleConfigByKey('freigabe');
  if (!freigabeConfig) {
    return interaction.reply({
      content: 'Keine Freigabe-Rolle konfiguriert. Bitte /role_freigabe_setup ausführen!',
      ephemeral: true,
    });
  }

  const roleId = freigabeConfig.roleId;
  // Prüfen, ob die Rolle existiert
  const freigabeRole = await guild.roles.fetch(roleId);
  if (!freigabeRole) {
    return interaction.reply({
      content: `Die Freigabe-Rolle mit ID "${roleId}" existiert nicht (vlt. gelöscht?).`,
      ephemeral: true,
    });
  }

  try {
    // Permission Overwrite: CONNECT = false
    await voiceChannel.permissionOverwrites.edit(freigabeRole, {
      Connect: false,
    });

    return interaction.reply({
      content: 'Kanal wurde geschlossen. Mitglieder mit Freigabe-Rolle können nicht mehr joinen.',
      ephemeral: true,
    });
  } catch (err) {
    console.error('Fehler beim Schließen des Kanals:', err);
    return interaction.reply({
      content: 'Konnte den Kanal nicht schließen.',
      ephemeral: true,
    });
  }
}
