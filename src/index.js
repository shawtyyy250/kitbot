require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { loadCommands, loadEvents, loadButtons } = require('./loader');
const { startWebServer } = require('./web/server');

if (!process.env.DISCORD_TOKEN) {
  console.error('Missing DISCORD_TOKEN in .env - see .env.example and SETUP.md.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // welcome / autoroles / leveling need to see joins
    GatewayIntentBits.GuildMessages, // leveling / logging read messages
    GatewayIntentBits.MessageContent, // leveling needs message text length; moderation logs edits
    GatewayIntentBits.GuildModeration, // ban add/remove events for logging
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

loadCommands(client);
loadEvents(client);
loadButtons(client);

startWebServer();

client.login(process.env.DISCORD_TOKEN);

process.on('unhandledRejection', (err) => {
  console.error('[process] Unhandled promise rejection:', err);
});
