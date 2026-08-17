const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../../../utils/permissions');
const { successEmbed, errorEmbed } = require('../../../utils/embeds');
const { parseDuration } = require('../../../utils/duration');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout (mute) a member for a duration, e.g. 10m, 1h, 1d')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName('user').setDescription('Member to timeout').setRequired(true))
    .addStringOption((o) => o.setName('duration').setDescription('e.g. 10m, 1h, 1d (max 28d)').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the timeout')),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('You need to be staff to use this.')], ephemeral: true });
    }
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const ms = parseDuration(interaction.options.getString('duration'));

    if (!ms || ms > 28 * 86_400_000) {
      return interaction.reply({ embeds: [errorEmbed('Duration must look like `10m`, `2h`, or `1d`, and be 28 days or less.')], ephemeral: true });
    }

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member || !member.moderatable) {
      return interaction.reply({ embeds: [errorEmbed("I can't timeout that member (role hierarchy or missing permission).")], ephemeral: true });
    }

    await member.timeout(ms, reason);
    await interaction.reply({ embeds: [successEmbed(`Timed out **${target.tag}** for ${interaction.options.getString('duration')}. Reason: ${reason}`)] });
  },
};
