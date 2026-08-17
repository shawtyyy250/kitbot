const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../../../utils/permissions');
const { successEmbed, errorEmbed } = require('../../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete recent messages in this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((o) => o.setName('amount').setDescription('How many messages (1-100)').setRequired(true).setMinValue(1).setMaxValue(100)),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('You need to be staff to use this.')], ephemeral: true });
    }
    const amount = interaction.options.getInteger('amount');
    await interaction.deferReply({ ephemeral: true });
    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);
      await interaction.editReply({ embeds: [successEmbed(`Deleted ${deleted.size} message(s). Note: Discord won't bulk-delete messages older than 14 days.`)] });
    } catch {
      await interaction.editReply({ embeds: [errorEmbed('Could not delete those messages.')] });
    }
  },
};
