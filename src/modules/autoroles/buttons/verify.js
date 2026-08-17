const { getConfig } = require('../../../database/db');
const { successEmbed, errorEmbed } = require('../../../utils/embeds');

module.exports = {
  match: (customId) => customId === 'verify_member',
  async execute(interaction) {
    const verifiedRoleId = getConfig(interaction.guild.id, 'verifiedRoleId');
    if (!verifiedRoleId) {
      return interaction.reply({ embeds: [errorEmbed('Verification is not configured yet - staff should run `/config set verifiedRoleId <role>`.')], ephemeral: true });
    }
    if (interaction.member.roles.cache.has(verifiedRoleId)) {
      return interaction.reply({ embeds: [successEmbed("You're already verified!")], ephemeral: true });
    }
    await interaction.member.roles.add(verifiedRoleId);
    await interaction.reply({ embeds: [successEmbed('You are now verified. Welcome in! 🎉')], ephemeral: true });
  },
};
