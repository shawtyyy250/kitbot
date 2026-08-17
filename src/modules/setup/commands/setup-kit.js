const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getKit, KITS } = require('../../../config/kits');
const { provisionKit } = require('../provision');
const { errorEmbed, successEmbed, infoEmbed } = require('../../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-kit')
    .setDescription('Build the full server structure for a kit (run this ONCE on a fresh server)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((o) =>
      o
        .setName('kit')
        .setDescription('Which kit to build')
        .setRequired(true)
        .addChoices(...Object.values(KITS).map((k) => ({ name: k.displayName, value: k.key })))
    ),

  async execute(interaction) {
    const kitKey = interaction.options.getString('kit');
    const kit = getKit(kitKey);
    if (!kit) return interaction.reply({ embeds: [errorEmbed('Unknown kit.')], ephemeral: true });

    if (!interaction.guild.members.me.permissions.has('Administrator')) {
      return interaction.reply({ embeds: [errorEmbed('I need Administrator permission in this server to build roles and channels. Re-invite me with that permission and try again.')], ephemeral: true });
    }

    await interaction.reply({ embeds: [infoEmbed(`Building **${kit.displayName}**... this takes 10-30 seconds, please wait.`)] });

    try {
      await provisionKit(interaction.guild, kitKey, kit);
      await interaction.followUp({ embeds: [successEmbed(`**${kit.displayName}** is ready! Roles, channels, tickets, verification, and starter messages are all set up. Check \`/config list\` to see what got configured.`)] });
    } catch (err) {
      console.error('[setup-kit] Provisioning failed:', err);
      await interaction.followUp({ embeds: [errorEmbed('Something went wrong while building the server. Some roles/channels may have been partially created - check the logs.')] });
    }
  },
};
