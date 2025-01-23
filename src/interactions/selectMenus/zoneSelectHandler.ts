// src/bot/interactions/selectMenus/zoneSelectHandler.ts

import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ChannelType,
  PermissionsBitField,
} from 'discord.js';
import logger from '../../services/logger';
import { getAllZones } from '../../services/zoneService'; 
import { sessionData } from '../../interaction_handlers/modalInteractions'; 
import { createDynamicChannel } from '../../services/dynamicChannelService'; 
import { getRoleConfigByKey } from '../../services/roleConfigService';
import { prisma } from '../../services/dbClient';  // Hier anpassen

export async function buildZoneSelectMenu(customId: string) {
  const zones = await getAllZones();
  if (!zones.length) {
    throw new Error('Keine Zonen definiert. Nutze /zone_einrichten zuerst!');
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder('Wähle eine Zone ...');

  const options = zones.map((z) => ({
    label: z.zoneName,
    description: `Key=${z.zoneKey}, +${z.pointsGranted}P`,
    value: z.zoneKey,
  }));
  select.addOptions(options);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
  return row;
}

export async function handleZoneSelect(interaction: StringSelectMenuInteraction) {
  const zoneKey = interaction.values[0];
  const userId = interaction.user.id;
  const guild = interaction.guild;
  if (!guild) {
    return interaction.reply({ content: 'Fehler: Keine Guild.', ephemeral: true });
  }

  const data = sessionData.get(userId);
  if (!data || !data.channelName) {
    return interaction.reply({ content: 'Fehler: Kein Kanalname gefunden.', ephemeral: true });
  }
  const channelName = data.channelName;

  const finalName = `${zoneKey} - ${channelName}`;
  const freigabeConfig = await getRoleConfigByKey('freigabe');
  const freigabeRoleId = freigabeConfig?.roleId;

  const settings = await prisma.adminSettings.findFirst();
  if (!settings || !settings.voiceCategoryId) {
    return interaction.reply({
      content: 'Keine Kategorie definiert. Nutze /kategorie_setup!',
      ephemeral: true,
    });
  }

  // Voice-Kanal in die definierte Kategorie
  const created = await guild.channels.create({
    name: finalName,
    type: ChannelType.GuildVoice,
    parent: settings.voiceCategoryId,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionsBitField.Flags.Connect],
      },
      ...(freigabeRoleId
        ? [
            {
              id: freigabeRoleId,
              allow: [
                PermissionsBitField.Flags.Connect,
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.Speak,
              ],
            },
          ]
        : []),
    ],
    reason: 'Dynamischer Voice-Kanal',
  });

  await createDynamicChannel(created.id, zoneKey, userId);

  const member = await guild.members.fetch(userId);
  if (member.voice.channelId) {
    try {
      await member.voice.setChannel(created.id);
    } catch (err) {
      logger.warn('Fehler beim Verschieben:', err);
    }
  }

  sessionData.delete(userId);

  return interaction.reply({
    content: `Neuer Voice-Kanal **${finalName}** erstellt und du wurdest dahin verschoben.`,
    ephemeral: true,
  });
}
