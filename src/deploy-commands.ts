// src/bot/deploy-commands.ts

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { REST, Routes } from 'discord.js';
import logger from './services/logger';

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;


// Alle Command-Dateien in "slashCommands" auslesen
const commandsPath = path.join(__dirname, 'commands', 'slashCommands');
logger.debug(`DEBUG commandsPath: ${commandsPath}`);

const commandFiles = fs
  .readdirSync(commandsPath)
  .filter(file => file.endsWith('.ts') || file.endsWith('.js'));

logger.debug(`DEBUG found commandFiles: ${commandFiles.join(', ')}`);

const commands: any[] = [];

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const commandModule = require(filePath);
  if (commandModule.data) {
    commands.push(commandModule.data.toJSON());
  }
}

logger.debug(`DEBUG numberOfCommands: ${commands.length}`);

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN!);

(async () => {
  try {
    logger.info('Starte Registrierung der Slash Commands...');

    if (GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID!, GUILD_ID),
        { body: commands }
      );
      logger.info('Slash Commands (guild-basiert) erfolgreich registriert!');
    } else {
      await rest.put(Routes.applicationCommands(CLIENT_ID!), { body: commands });
      logger.info('Slash Commands (global) erfolgreich registriert!');
    }

  } catch (error) {
    logger.error('Fehler beim Deployen der Slash Commands:', error);
  }
})();
