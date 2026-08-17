const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../../../utils/permissions');
const { errorEmbed, successEmbed, baseEmbed } = require('../../../utils/embeds');
const { getConfig } = require('../../../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Post a formatted announcement')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) => o.setName('title').setDescription('Announcement title').setRequired(true))
    .addStringOption((o) => o.setName('message').setDescription('Announcement body').setRequired(true))
    .addBooleanOption((o) => o.setName('ping_everyone').setDescription('Ping @everyone?')),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('You need to be staff to use this.')], ephemeral: true });
    }
    const title = interaction.options.getString('title');
    const message = interaction.options.getString('message');
    const pingEveryone = interaction.options.getBoolean('ping_everyone') || false;

    const announcementChannelId = getConfig(interaction.guild.id, 'announcementChannelId');
    const channel = announcementChannelId ? await interaction.guild.channels.fetch(announcementChannelId).catch(() => null) : interaction.channel;
    if (!channel) return interaction.reply({ embeds: [errorEmbed('Configured announcement channel not found.')], ephemeral: true });

    const embed = baseEmbed().setTitle(`📢 ${title}`).setDescription(message).setTimestamp();
    await channel.send({ content: pingEveryone ? '@everyone' : undefined, embeds: [embed] });
    await interaction.reply({ embeds: [successEmbed(`Announcement posted in <#${channel.id}>.`)], ephemeral: true });
  },
};
