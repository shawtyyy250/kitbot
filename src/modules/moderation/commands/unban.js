const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../../../utils/permissions');
const { successEmbed, errorEmbed } = require('../../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user by their ID')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((o) => o.setName('user_id').setDescription('The user ID to unban').setRequired(true)),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('You need to be staff to use this.')], ephemeral: true });
    }
    const userId = interaction.options.getString('user_id');
    try {
      await interaction.guild.members.unban(userId);
      await interaction.reply({ embeds: [successEmbed(`Unbanned user ID \`${userId}\`.`)] });
    } catch {
      await interaction.reply({ embeds: [errorEmbed('Could not unban that ID - check it is correct and currently banned.')], ephemeral: true });
    }
  },
};
