// This is the piece that makes KitBot "modular" in practice, not just in
// name: it walks every folder under src/modules/**, and wires up whatever
// it finds. Add a new file in a module's commands/events/buttons folder and
// it's live on next restart - nothing else in the codebase has to change.
// Delete a module folder entirely and the bot still runs fine without it -
// that's how one codebase becomes "Gaming Kit", "Creator Kit", "Business
// Kit" etc. just by choosing which modules are enabled for a customer.
const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

const MODULES_DIR = path.join(__dirname, 'modules');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => path.join(dir, f));
}

function eachModuleSubfolder(subfolder) {
  const files = [];
  if (!fs.existsSync(MODULES_DIR)) return files;
  for (const moduleName of fs.readdirSync(MODULES_DIR)) {
    const dir = path.join(MODULES_DIR, moduleName, subfolder);
    for (const file of walk(dir)) files.push({ moduleName, file });
  }
  return files;
}

function loadCommands(client) {
  client.commands = new Collection();
  const commands = [];
  for (const { moduleName, file } of eachModuleSubfolder('commands')) {
    const command = require(file);
    if (!command?.data || !command?.execute) {
      console.warn(`[loader] Skipping ${file} - missing "data" or "execute" export`);
      continue;
    }
    command.moduleName = moduleName;
    client.commands.set(command.data.name, command);
    commands.push(command);
  }
  console.log(`[loader] Loaded ${commands.length} slash command(s)`);
  return commands;
}

function loadEvents(client) {
  const grouped = new Map(); // eventName -> [{execute, once}]
  const srcEventsDir = path.join(__dirname, 'events');
  const allEventFiles = [
    ...walk(srcEventsDir).map((file) => ({ moduleName: 'core', file })),
    ...eachModuleSubfolder('events'),
  ];

  for (const { moduleName, file } of allEventFiles) {
    const evt = require(file);
    if (!evt?.name || !evt?.execute) {
      console.warn(`[loader] Skipping ${file} - missing "name" or "execute" export`);
      continue;
    }
    if (!grouped.has(evt.name)) grouped.set(evt.name, []);
    grouped.get(evt.name).push({ ...evt, moduleName });
  }

  for (const [name, handlers] of grouped) {
    const once = handlers.every((h) => h.once);
    const dispatch = async (...args) => {
      for (const h of handlers) {
        try {
          await h.execute(...args, client);
        } catch (err) {
          console.error(`[loader] Error in "${name}" handler from module "${h.moduleName}":`, err);
        }
      }
    };
    once ? client.once(name, dispatch) : client.on(name, dispatch);
  }
  console.log(`[loader] Loaded event handlers for: ${[...grouped.keys()].join(', ')}`);
}

function loadButtons(client) {
  client.buttons = [];
  for (const { moduleName, file } of eachModuleSubfolder('buttons')) {
    const btn = require(file);
    if (!btn?.match || !btn?.execute) {
      console.warn(`[loader] Skipping ${file} - missing "match" or "execute" export`);
      continue;
    }
    btn.moduleName = moduleName;
    client.buttons.push(btn);
  }
  console.log(`[loader] Loaded ${client.buttons.length} button handler(s)`);
}

async function initModules(client) {
  if (!fs.existsSync(MODULES_DIR)) return;
  for (const moduleName of fs.readdirSync(MODULES_DIR)) {
    const indexFile = path.join(MODULES_DIR, moduleName, 'index.js');
    if (!fs.existsSync(indexFile)) continue;
    const mod = require(indexFile);
    if (typeof mod.init === 'function') {
      try {
        await mod.init(client);
        console.log(`[loader] Initialized module "${moduleName}"`);
      } catch (err) {
        console.error(`[loader] Failed to init module "${moduleName}":`, err);
      }
    }
  }
}

module.exports = { loadCommands, loadEvents, loadButtons, initModules, eachModuleSubfolder };
