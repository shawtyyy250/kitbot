const { closeTicket } = require('../closeTicket');

module.exports = {
  match: (customId) => customId === 'ticket_close',
  async execute(interaction) {
    await interaction.deferUpdate();
    await closeTicket(interaction.channel, interaction.member, interaction.client);
  },
};
