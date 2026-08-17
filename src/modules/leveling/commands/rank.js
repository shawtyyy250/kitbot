const { SlashCommandBuilder } = require('discord.js');
const { db } = require('../../../database/db');
const { xpForLevel } = require('../formula');
const { baseEmbed } = require('../../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Check your (or someone else\'s) level and XP')
    .addUserOption((o) => o.setName('user').setDescription('Whose rank to check')),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const row = db.prepare(`SELECT * FROM levels WHERE guildId = ? AND userId = ?`).get(interaction.guild.id, target.id);

    if (!row) {
      return interaction.reply({ embeds: [baseEmbed().setDescription(`${target.id === interaction.user.id ? "You haven't" : `${target.username} hasn't`} sent any messages yet.`)], ephemeral: true });
    }

    const nextLevelXp = xpForLevel(row.level + 1);
    const thisLevelXp = xpForLevel(row.level);
    const progress = row.xp - thisLevelXp;
    const needed = nextLevelXp - thisLevelXp;

    const embed = baseEmbed()
      .setTitle(`${target.username}'s Rank`)
      .setThumbnail(target.displayAvatarURL())
      .setDescription(`**Level:** ${row.level}\n**XP:** ${row.xp} total (${progress}/${needed} to next level)`);
    await interaction.reply({ embeds: [embed] });
  },
};
