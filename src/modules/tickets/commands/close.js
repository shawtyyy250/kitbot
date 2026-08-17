const { SlashCommandBuilder } = require('discord.js');
const { closeTicket } = require('../closeTicket');
const { errorEmbed } = require('../../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('close-ticket').setDescription('Close the ticket channel you are currently in'),

  async execute(interaction) {
    const ok = await closeTicket(interaction.channel, interaction.member, interaction.client);
    if (!ok) {
      return interaction.reply({ embeds: [errorEmbed('This only works inside a ticket channel.')], ephemeral: true });
    }
  },
};
