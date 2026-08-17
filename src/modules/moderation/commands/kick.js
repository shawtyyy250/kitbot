const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../../../utils/permissions');
const { successEmbed, errorEmbed } = require('../../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((o) => o.setName('user').setDescription('Member to kick').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the kick')),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('You need to be staff to use this.')], ephemeral: true });
    }
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) return interaction.reply({ embeds: [errorEmbed('That user is not in this server.')], ephemeral: true });
    if (!member.kickable) return interaction.reply({ embeds: [errorEmbed("I can't kick that member (role hierarchy or missing permission).")], ephemeral: true });

    await member.kick(reason).catch(() => null);
    await interaction.reply({ embeds: [successEmbed(`Kicked **${target.tag}**. Reason: ${reason}`)] });
  },
};
