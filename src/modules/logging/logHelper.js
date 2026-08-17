const { getConfig } = require('../../database/db');

async function sendLog(guild, embed) {
  const logChannelId = getConfig(guild.id, 'logChannelId');
  if (!logChannelId) return;
  const channel = await guild.channels.fetch(logChannelId).catch(() => null);
  if (channel) await channel.send({ embeds: [embed] }).catch(() => null);
}

module.exports = { sendLog };
