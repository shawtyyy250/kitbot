// Single SQLite file that stores everything KitBot needs across every
// server it runs in. Nothing here is guild-specific by file - every table
// is keyed by guildId so one bot instance safely serves many customer
// servers at once.
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'kitbot.sqlite'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS guild_config (
  guildId TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  PRIMARY KEY (guildId, key)
);

CREATE TABLE IF NOT EXISTS warnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guildId TEXT NOT NULL,
  userId TEXT NOT NULL,
  moderatorId TEXT NOT NULL,
  reason TEXT,
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guildId TEXT NOT NULL,
  channelId TEXT NOT NULL,
  userId TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  createdAt INTEGER NOT NULL,
  closedAt INTEGER
);

CREATE TABLE IF NOT EXISTS giveaways (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guildId TEXT NOT NULL,
  channelId TEXT NOT NULL,
  messageId TEXT NOT NULL,
  prize TEXT NOT NULL,
  winnerCount INTEGER NOT NULL,
  hostId TEXT NOT NULL,
  endsAt INTEGER NOT NULL,
  ended INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS levels (
  guildId TEXT NOT NULL,
  userId TEXT NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 0,
  lastMessageAt INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (guildId, userId)
);

-- Every Stripe Checkout Session ID that has been redeemed via /activate,
-- so a customer can never reuse the same purchase to provision two servers.
CREATE TABLE IF NOT EXISTS used_sessions (
  sessionId TEXT PRIMARY KEY,
  guildId TEXT NOT NULL,
  redeemedBy TEXT NOT NULL,
  redeemedAt INTEGER NOT NULL
);
`);

// ---- guild_config helpers ----
// Every module reads its channel/role IDs through these two functions,
// which is what makes ONE bot codebase work for every customer server:
// nothing is hardcoded, it's all configured per-guild via /config.
function setConfig(guildId, key, value) {
  db.prepare(
    `INSERT INTO guild_config (guildId, key, value) VALUES (?, ?, ?)
     ON CONFLICT(guildId, key) DO UPDATE SET value = excluded.value`
  ).run(guildId, key, String(value));
}

function getConfig(guildId, key, fallback = null) {
  const row = db.prepare(`SELECT value FROM guild_config WHERE guildId = ? AND key = ?`).get(guildId, key);
  return row ? row.value : fallback;
}

function getAllConfig(guildId) {
  const rows = db.prepare(`SELECT key, value FROM guild_config WHERE guildId = ?`).all(guildId);
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

module.exports = { db, setConfig, getConfig, getAllConfig };
