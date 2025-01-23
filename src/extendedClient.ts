import { Client, Collection } from 'discord.js';

/**
 * Ein minimaler TypeScript-Typ für unser 'command' Objekt.
 * Du kannst es beliebig erweitern, falls deine Commands
 * z.B. eine data-Eigenschaft (SlashCommandBuilder) und eine execute-Funktion haben.
 */
export interface BotCommand {
  data: any;       // z.B. SlashCommandBuilder
  execute: Function; // z.B. (interaction) => Promise<void>
}

/**
 * ExtendedClient:
 * Wir erben vom originalen 'Client' und fügen eine neue Property 'commands' hinzu.
 */
export interface ExtendedClient extends Client {
  commands: Collection<string, BotCommand>;
}
