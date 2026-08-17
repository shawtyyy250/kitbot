const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../../../utils/permissions');
const { successEmbed, errorEmbed } = require('../../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((o) => o.setName('user').setDescription('Member to ban').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the ban'))
    .addIntegerOption((o) => o.setName('delete_days').setDescription('Days of their messages to delete (0-7)').setMinValue(0).setMaxValue(7)),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('You need to be staff to use this.')], ephemeral: true });
    }
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_days') || 0;

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (member && !member.bannable) {
      return interaction.reply({ embeds: [errorEmbed("I can't ban that member (role hierarchy or missing permission).")], ephemeral: true });
    }

    await interaction.guild.members
      .ban(target.id, { reason, deleteMessageSeconds: deleteDays * 86400 })
      .catch(() => null);
    await interaction.reply({ embeds: [successEmbed(`Banned **${target.tag}**. Reason: ${reason}`)] });
  },
};
