const { AttachmentBuilder } = require('discord.js');
const { db, getConfig } = require('../../database/db');
const { infoEmbed, successEmbed } = require('../../utils/embeds');
const { isStaff } = require('../../utils/permissions');

// Shared by both the "Close Ticket" button and the /close-ticket command so
// the two entry points can never drift out of sync with each other.
async function closeTicket(channel, member, client) {
  const ticket = db.prepare(`SELECT * FROM tickets WHERE guildId = ? AND channelId = ? AND status = 'open'`).get(channel.guild.id, channel.id);
  if (!ticket) return false;

  const isOwner = member.id === ticket.userId;
  if (!isOwner && !isStaff(member)) {
    await channel.send({ embeds: [infoEmbed('Only the ticket opener or staff can close this ticket.')] });
    return true;
  }

  await channel.send({ embeds: [successEmbed(`Closing this ticket in 5 seconds... A transcript will be saved.`)] });

  // Build a plain-text transcript of everything said in the ticket.
  const messages = await channel.messages.fetch({ limit: 100 });
  const sorted = [...messages.values()].reverse();
  const transcript = sorted
    .map((m) => `[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}: ${m.content || '[embed/attachment]'}`)
    .join('\n');

  const logChannelId = getConfig(channel.guild.id, 'logChannelId');
  if (logChannelId) {
    const logChannel = await channel.guild.channels.fetch(logChannelId).catch(() => null);
    if (logChannel) {
      const file = new AttachmentBuilder(Buffer.from(transcript || 'No messages.', 'utf-8'), { name: `${channel.name}-transcript.txt` });
      await logChannel.send({ content: `📄 Transcript for ${channel.name} (closed by ${member.user.tag})`, files: [file] }).catch(() => null);
    }
  }

  db.prepare(`UPDATE tickets SET status = 'closed', closedAt = ? WHERE id = ?`).run(Date.now(), ticket.id);

  setTimeout(() => channel.delete().catch(() => null), 5000);
  return true;
}

module.exports = { closeTicket };
