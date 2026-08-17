const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { isStaff } = require('../../../utils/permissions');
const { baseEmbed, errorEmbed, successEmbed } = require('../../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify-panel')
    .setDescription('Post the verification button panel in this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('You need to be staff to use this.')], ephemeral: true });
    }
    const embed = baseEmbed()
      .setTitle('✅ Verify yourself')
      .setDescription('Click the button below to verify and unlock the rest of the server.');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('verify_member').setLabel('Verify').setStyle(ButtonStyle.Success).setEmoji('✅')
    );
    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ embeds: [successEmbed('Verification panel posted.')], ephemeral: true });
  },
};
