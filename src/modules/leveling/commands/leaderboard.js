const { SlashCommandBuilder } = require('discord.js');
const { db } = require('../../../database/db');
const { baseEmbed } = require('../../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('leaderboard').setDescription('Show the top 10 most active members'),

  async execute(interaction) {
    const rows = db.prepare(`SELECT userId, xp, level FROM levels WHERE guildId = ? ORDER BY xp DESC LIMIT 10`).all(interaction.guild.id);
    if (rows.length === 0) {
      return interaction.reply({ embeds: [baseEmbed().setDescription('No activity tracked yet.')] });
    }
    const medals = ['🥇', '🥈', '🥉'];
    const description = rows.map((r, i) => `${medals[i] || `**${i + 1}.**`} <@${r.userId}> - Level ${r.level} (${r.xp} XP)`).join('\n');
    await interaction.reply({ embeds: [baseEmbed().setTitle('🏆 Leaderboard').setDescription(description)] });
  },
};
