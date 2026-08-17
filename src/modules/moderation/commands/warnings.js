const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../../../utils/permissions');
const { errorEmbed, baseEmbed } = require('../../../utils/embeds');
const { db } = require('../../../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription("View a member's warning history")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName('user').setDescription('Member to check').setRequired(true)),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('You need to be staff to use this.')], ephemeral: true });
    }
    const target = interaction.options.getUser('user');
    const rows = db
      .prepare(`SELECT reason, moderatorId, createdAt FROM warnings WHERE guildId = ? AND userId = ? ORDER BY createdAt DESC LIMIT 15`)
      .all(interaction.guild.id, target.id);

    const embed = baseEmbed().setTitle(`Warnings for ${target.tag}`);
    if (rows.length === 0) {
      embed.setDescription('No warnings on record.');
    } else {
      embed.setDescription(
        rows.map((r, i) => `**${i + 1}.** ${r.reason}\n<t:${Math.floor(r.createdAt / 1000)}:R> by <@${r.moderatorId}>`).join('\n\n')
      );
    }
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
