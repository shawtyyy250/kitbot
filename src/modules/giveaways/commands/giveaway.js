const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../../../utils/permissions');
const { errorEmbed, successEmbed, baseEmbed } = require('../../../utils/embeds');
const { parseDuration } = require('../../../utils/duration');
const { db } = require('../../../database/db');
const { GIVEAWAY_EMOJI, endGiveaway, pickWinners } = require('../engine');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Run a giveaway')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sc) =>
      sc
        .setName('start')
        .setDescription('Start a giveaway in this channel')
        .addStringOption((o) => o.setName('prize').setDescription('What are you giving away?').setRequired(true))
        .addStringOption((o) => o.setName('duration').setDescription('e.g. 10m, 1h, 1d').setRequired(true))
        .addIntegerOption((o) => o.setName('winners').setDescription('Number of winners').setMinValue(1).setMaxValue(20))
    )
    .addSubcommand((sc) =>
      sc.setName('end').setDescription('End a giveaway early').addStringOption((o) => o.setName('message_id').setDescription('The giveaway message ID').setRequired(true))
    )
    .addSubcommand((sc) =>
      sc.setName('reroll').setDescription('Pick new winner(s) for an ended giveaway').addStringOption((o) => o.setName('message_id').setDescription('The giveaway message ID').setRequired(true))
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('You need to be staff to use this.')], ephemeral: true });
    }
    const sub = interaction.options.getSubcommand();

    if (sub === 'start') {
      const prize = interaction.options.getString('prize');
      const durationInput = interaction.options.getString('duration');
      const winnerCount = interaction.options.getInteger('winners') || 1;
      const ms = parseDuration(durationInput);
      if (!ms) return interaction.reply({ embeds: [errorEmbed('Duration must look like `10m`, `2h`, or `1d`.')], ephemeral: true });

      const endsAt = Date.now() + ms;
      const embed = baseEmbed()
        .setTitle(`🎉 Giveaway: ${prize}`)
        .setDescription(`React with ${GIVEAWAY_EMOJI} to enter!\nEnds: <t:${Math.floor(endsAt / 1000)}:R>\nWinners: **${winnerCount}**\nHosted by <@${interaction.user.id}>`);

      await interaction.reply({ embeds: [embed] });
      const message = await interaction.fetchReply();
      await message.react(GIVEAWAY_EMOJI);

      db.prepare(`INSERT INTO giveaways (guildId, channelId, messageId, prize, winnerCount, hostId, endsAt, ended) VALUES (?, ?, ?, ?, ?, ?, ?, 0)`).run(
        interaction.guild.id, interaction.channel.id, message.id, prize, winnerCount, interaction.user.id, endsAt
      );
      return;
    }

    if (sub === 'end') {
      const messageId = interaction.options.getString('message_id');
      const row = db.prepare(`SELECT * FROM giveaways WHERE guildId = ? AND messageId = ? AND ended = 0`).get(interaction.guild.id, messageId);
      if (!row) return interaction.reply({ embeds: [errorEmbed('No active giveaway found with that message ID.')], ephemeral: true });
      await interaction.reply({ embeds: [successEmbed('Ending giveaway now...')], ephemeral: true });
      await endGiveaway(interaction.client, row);
      return;
    }

    if (sub === 'reroll') {
      const messageId = interaction.options.getString('message_id');
      const row = db.prepare(`SELECT * FROM giveaways WHERE guildId = ? AND messageId = ?`).get(interaction.guild.id, messageId);
      if (!row) return interaction.reply({ embeds: [errorEmbed('No giveaway found with that message ID.')], ephemeral: true });
      const message = await interaction.channel.messages.fetch(messageId).catch(() => null);
      if (!message) return interaction.reply({ embeds: [errorEmbed('Could not find that giveaway message (wrong channel?).')], ephemeral: true });

      const winners = await pickWinners(message, row.winnerCount);
      if (winners.length === 0) return interaction.reply({ embeds: [errorEmbed('No valid entries to reroll from.')] });
      await interaction.reply({ content: `🎉 New winner(s) for **${row.prize}**: ${winners.map((id) => `<@${id}>`).join(', ')}` });
      return;
    }
  },
};
