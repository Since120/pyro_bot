// src/bot/index.ts

import 'dotenv/config';
import { 
  Client, 
  IntentsBitField, 
  Collection, 
  Interaction, 
  VoiceState,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction
} from 'discord.js';
import fs from 'fs';
import path from 'path';

import logger from './services/logger';
import { ExtendedClient, BotCommand } from './extendedClient';
import voiceStateUpdate from './events/voiceStateUpdate';

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildVoiceStates,
    // Weitere Intents nach Bedarf ...
  ],
}) as ExtendedClient;

client.commands = new Collection<string, BotCommand>();

// 1) Slash Commands laden
const commandsPath = path.join(__dirname, 'commands', 'slashCommands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const commandModule = require(filePath);
  if (commandModule.data && commandModule.execute) {
    const cmdName = commandModule.data.name;
    client.commands.set(cmdName, {
      data: commandModule.data,
      execute: commandModule.execute,
    });
    logger.info(`Slash Command geladen: ${cmdName}`);
  }
}

// 2) interactionCreate
client.on('interactionCreate', async (interaction: Interaction) => {
  // 2a) Slash Command
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;
    const cmd = client.commands.get(commandName);
    if (!cmd) {
      return interaction.reply({ content: 'Unbekannter Slash-Befehl!', ephemeral: true });
    }
    try {
      await cmd.execute(interaction);
    } catch (err) {
      logger.error('Slash Command Error:', err);
      if (!interaction.replied) {
        await interaction.reply({ content: 'Fehler!', ephemeral: true });
      }
    }
  }
  // 2b) Button
  else if (interaction.isButton()) {
    const { handleButton } = require('./interaction_handlers/buttonInteractions');
    return handleButton(interaction);
  }
  // 2c) ModalSubmit
  else if (interaction.isModalSubmit()) {
    const { handleModal } = require('./interaction_handlers/modalInteractions');
    return handleModal(interaction);
  }
  // 2d) SelectMenu (StringSelect oder UserSelect)
  else if (interaction.isAnySelectMenu()) {
    logger.info(`(DEBUG) We have isAnySelectMenu(): customId=${interaction.customId}`);

    // Hier wandeln wir den allgemeinen Typ Interaction 
    // explizit in "StringSelectMenuInteraction | UserSelectMenuInteraction" um.
    // So können wir in handleSelectMenu problemlos auf customId etc. zugreifen.
    const typedSelectMenu = interaction as StringSelectMenuInteraction | UserSelectMenuInteraction;

    const { handleSelectMenu } = require('./interaction_handlers/selectMenuInteractions');
    return handleSelectMenu(typedSelectMenu);
  }
});

// 3) voiceStateUpdate
client.on('voiceStateUpdate', (oldState: VoiceState, newState: VoiceState) => {
  voiceStateUpdate(oldState, newState);
});

// 4) Bot-Login
const token = process.env.DISCORD_TOKEN;
if (!token) {
  logger.error('Fehler: Keine DISCORD_TOKEN in .env');
  process.exit(1);
}
client.login(token).then(() => {
  logger.info('Bot online!');
});
