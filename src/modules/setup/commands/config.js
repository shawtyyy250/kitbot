const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setConfig, getAllConfig } = require('../../../database/db');
const { errorEmbed, successEmbed, baseEmbed } = require('../../../utils/embeds');

const ROLE_KEYS = ['modRoleId', 'verifiedRoleId', 'autoRoleId'];
const CHANNEL_KEYS = ['welcomeChannelId', 'announcementChannelId', 'logChannelId', 'ticketCategoryId', 'levelUpChannelId'];
const TEXT_KEYS = ['storeLink'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('View or change KitBot settings for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sc) => sc.setName('list').setDescription('Show all current settings'))
    .addSubcommand((sc) =>
      sc
        .setName('set-role')
        .setDescription('Point a setting at a role')
        .addStringOption((o) => o.setName('key').setDescription('Setting to change').setRequired(true).addChoices(...ROLE_KEYS.map((k) => ({ name: k, value: k }))))
        .addRoleOption((o) => o.setName('role').setDescription('The role').setRequired(true))
    )
    .addSubcommand((sc) =>
      sc
        .setName('set-channel')
        .setDescription('Point a setting at a channel or category')
        .addStringOption((o) => o.setName('key').setDescription('Setting to change').setRequired(true).addChoices(...CHANNEL_KEYS.map((k) => ({ name: k, value: k }))))
        .addChannelOption((o) =>
          o
            .setName('channel')
            .setDescription('The channel/category')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildCategory, ChannelType.GuildVoice)
        )
    )
    .addSubcommand((sc) =>
      sc
        .setName('set-text')
        .setDescription('Set a plain text/link setting')
        .addStringOption((o) => o.setName('key').setDescription('Setting to change').setRequired(true).addChoices(...TEXT_KEYS.map((k) => ({ name: k, value: k }))))
        .addStringOption((o) => o.setName('value').setDescription('The value').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'list') {
      const config = getAllConfig(interaction.guild.id);
      const lines = Object.entries(config).map(([k, v]) => `**${k}:** ${v}`);
      return interaction.reply({
        embeds: [baseEmbed().setTitle('⚙️ KitBot Settings').setDescription(lines.length ? lines.join('\n') : 'Nothing configured yet - run `/setup-kit` or set values manually.')],
        ephemeral: true,
      });
    }

    if (sub === 'set-role') {
      const key = interaction.options.getString('key');
      const role = interaction.options.getRole('role');
      setConfig(interaction.guild.id, key, role.id);
      return interaction.reply({ embeds: [successEmbed(`\`${key}\` set to ${role}.`)], ephemeral: true });
    }

    if (sub === 'set-channel') {
      const key = interaction.options.getString('key');
      const channel = interaction.options.getChannel('channel');
      setConfig(interaction.guild.id, key, channel.id);
      return interaction.reply({ embeds: [successEmbed(`\`${key}\` set to ${channel}.`)], ephemeral: true });
    }

    if (sub === 'set-text') {
      const key = interaction.options.getString('key');
      const value = interaction.options.getString('value');
      setConfig(interaction.guild.id, key, value);
      return interaction.reply({ embeds: [successEmbed(`\`${key}\` updated.`)], ephemeral: true });
    }
  },
};
