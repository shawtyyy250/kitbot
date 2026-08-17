const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../../../utils/permissions');
const { successEmbed, errorEmbed, infoEmbed } = require('../../../utils/embeds');
const { db } = require('../../../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Log a warning against a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName('user').setDescription('Member to warn').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the warning').setRequired(true)),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('You need to be staff to use this.')], ephemeral: true });
    }
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    db.prepare(`INSERT INTO warnings (guildId, userId, moderatorId, reason, createdAt) VALUES (?, ?, ?, ?, ?)`).run(
      interaction.guild.id, target.id, interaction.user.id, reason, Date.now()
    );

    await target.send({ embeds: [infoEmbed(`You were warned in **${interaction.guild.name}**: ${reason}`)] }).catch(() => null);
    await interaction.reply({ embeds: [successEmbed(`Warned **${target.tag}**. Reason: ${reason}`)] });
  },
};
