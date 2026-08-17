const { PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const { db, getConfig } = require('../../../database/db');
const { baseEmbed, errorEmbed } = require('../../../utils/embeds');

module.exports = {
  match: (customId) => customId === 'ticket_create',
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild;

    // One open ticket per person at a time keeps the category from filling
    // up with duplicates.
    const existing = db.prepare(`SELECT * FROM tickets WHERE guildId = ? AND userId = ? AND status = 'open'`).get(guild.id, interaction.user.id);
    if (existing) {
      const channel = await guild.channels.fetch(existing.channelId).catch(() => null);
      if (channel) {
        return interaction.editReply({ embeds: [errorEmbed(`You already have an open ticket: <#${channel.id}>`)] });
      }
    }

    const categoryId = getConfig(guild.id, 'ticketCategoryId');
    const modRoleId = getConfig(guild.id, 'modRoleId');

    const overwrites = [
      { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
      { id: guild.members.me.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels] },
    ];
    if (modRoleId) overwrites.push({ id: modRoleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] });

    const channel = await guild.channels.create({
      name: `ticket-${interaction.user.username}`.toLowerCase().slice(0, 90),
      type: ChannelType.GuildText,
      parent: categoryId || undefined,
      permissionOverwrites: overwrites,
    });

    db.prepare(`INSERT INTO tickets (guildId, channelId, userId, status, createdAt) VALUES (?, ?, ?, 'open', ?)`).run(
      guild.id, channel.id, interaction.user.id, Date.now()
    );

    const embed = baseEmbed()
      .setTitle('🎫 Ticket opened')
      .setDescription(`Hey <@${interaction.user.id}>, staff will be with you shortly. Explain what you need help with below.`);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_close').setLabel('Close Ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒')
    );
    await channel.send({ content: modRoleId ? `<@&${modRoleId}>` : undefined, embeds: [embed], components: [row] });

    await interaction.editReply({ embeds: [baseEmbed().setDescription(`Ticket created: <#${channel.id}>`)] });
  },
};
