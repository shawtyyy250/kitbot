const { db } = require('../../database/db');
const { baseEmbed } = require('../../utils/embeds');

const GIVEAWAY_EMOJI = '🎉';

async function pickWinners(message, winnerCount) {
  const reaction = message.reactions.cache.get(GIVEAWAY_EMOJI);
  if (!reaction) return [];
  const users = await reaction.users.fetch();
  const entrants = users.filter((u) => !u.bot).map((u) => u.id);
  const winners = [];
  const pool = [...entrants];
  while (winners.length < winnerCount && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(idx, 1)[0]);
  }
  return winners;
}

// Called both by the 15s background sweep (engine.checkDue) and by the
// manual "/giveaway end" command, so a giveaway ends the exact same way
// whether it times out naturally or a host cuts it short.
async function endGiveaway(client, giveawayRow) {
  db.prepare(`UPDATE giveaways SET ended = 1 WHERE id = ?`).run(giveawayRow.id);
  const channel = await client.channels.fetch(giveawayRow.channelId).catch(() => null);
  if (!channel) return;
  const message = await channel.messages.fetch(giveawayRow.messageId).catch(() => null);
  if (!message) return;

  const winners = await pickWinners(message, giveawayRow.winnerCount);
  const embed = baseEmbed()
    .setTitle(`🎉 Giveaway ended: ${giveawayRow.prize}`)
    .setDescription(
      winners.length > 0
        ? `Winner(s): ${winners.map((id) => `<@${id}>`).join(', ')}`
        : 'No valid entries - no winner could be picked.'
    );
  await message.edit({ embeds: [embed] }).catch(() => null);
  await channel.send({
    content: winners.length > 0 ? `🎉 Congratulations ${winners.map((id) => `<@${id}>`).join(', ')}! You won **${giveawayRow.prize}**!` : `No one entered the giveaway for **${giveawayRow.prize}**.`,
  });
}

async function checkDue(client) {
  const due = db.prepare(`SELECT * FROM giveaways WHERE ended = 0 AND endsAt <= ?`).all(Date.now());
  for (const row of due) {
    await endGiveaway(client, row).catch((err) => console.error('[giveaways] Failed to end giveaway:', err));
  }
}

module.exports = { GIVEAWAY_EMOJI, pickWinners, endGiveaway, checkDue };
