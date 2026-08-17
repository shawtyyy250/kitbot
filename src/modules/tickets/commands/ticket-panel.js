const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { isStaff } = require('../../../utils/permissions');
const { baseEmbed, errorEmbed, successEmbed } = require('../../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('Post the "open a ticket" button panel in this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('You need to be staff to use this.')], ephemeral: true });
    }
    const embed = baseEmbed()
      .setTitle('🎫 Need help?')
      .setDescription('Click the button below to open a private ticket with staff.');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_create').setLabel('Open a ticket').setStyle(ButtonStyle.Primary).setEmoji('🎫')
    );
    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ embeds: [successEmbed('Ticket panel posted.')], ephemeral: true });
  },
};
