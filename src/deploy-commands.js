// Run this (npm run deploy-commands) once after adding/changing any slash
// command, and again any time you edit a command's name/options/description.
// Discord needs to be told the command list separately from the bot
// actually running - this script is that step.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const MODULES_DIR = path.join(__dirname, 'modules');

function collectCommandJSON() {
  const commands = [];
  for (const moduleName of fs.readdirSync(MODULES_DIR)) {
    const commandsDir = path.join(MODULES_DIR, moduleName, 'commands');
    if (!fs.existsSync(commandsDir)) continue;
    for (const file of fs.readdirSync(commandsDir).filter((f) => f.endsWith('.js'))) {
      const command = require(path.join(commandsDir, file));
      if (command?.data) commands.push(command.data.toJSON());
    }
  }
  return commands;
}

async function main() {
  const { DISCORD_TOKEN, DISCORD_CLIENT_ID, HOME_GUILD_ID } = process.env;
  if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
    console.error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in .env - see .env.example.');
    process.exit(1);
  }

  const commands = collectCommandJSON();
  console.log(`Deploying ${commands.length} command(s): ${commands.map((c) => c.name).join(', ')}`);

  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

  if (HOME_GUILD_ID) {
    await rest.put(Routes.applicationGuildCommands(DISCORD_CLIENT_ID, HOME_GUILD_ID), { body: commands });
    console.log(`Deployed instantly to guild ${HOME_GUILD_ID}.`);
  } else {
    await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID), { body: commands });
    console.log('Deployed globally - can take up to an hour to show up everywhere.');
  }
}

main().catch((err) => {
  console.error('Failed to deploy commands:', err);
  process.exit(1);
});
