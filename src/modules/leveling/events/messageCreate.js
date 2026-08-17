const { db, getConfig } = require('../../../database/db');
const { levelFromXp } = require('../formula');
const { baseEmbed } = require('../../../utils/embeds');

const COOLDOWN_MS = 60_000; // one XP grant per user per minute, so spamming doesn't inflate levels
const MIN_XP = 15;
const MAX_XP = 25;

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const row = db.prepare(`SELECT * FROM levels WHERE guildId = ? AND userId = ?`).get(message.guild.id, message.author.id);
    const now = Date.now();
    if (row && now - row.lastMessageAt < COOLDOWN_MS) return;

    const gained = Math.floor(Math.random() * (MAX_XP - MIN_XP + 1)) + MIN_XP;
    const newXp = (row?.xp || 0) + gained;
    const oldLevel = row?.level || 0;
    const newLevel = levelFromXp(newXp);

    if (row) {
      db.prepare(`UPDATE levels SET xp = ?, level = ?, lastMessageAt = ? WHERE guildId = ? AND userId = ?`).run(newXp, newLevel, now, message.guild.id, message.author.id);
    } else {
      db.prepare(`INSERT INTO levels (guildId, userId, xp, level, lastMessageAt) VALUES (?, ?, ?, ?, ?)`).run(message.guild.id, message.author.id, newXp, newLevel, now);
    }

    if (newLevel > oldLevel) {
      const levelUpChannelId = getConfig(message.guild.id, 'levelUpChannelId');
      const channel = levelUpChannelId ? await message.guild.channels.fetch(levelUpChannelId).catch(() => null) : message.channel;
      const embed = baseEmbed().setDescription(`🎉 <@${message.author.id}> just reached **level ${newLevel}**!`);
      await (channel || message.channel).send({ embeds: [embed] }).catch(() => null);
    }
  },
};
