const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../../../database/db');
const { KITS } = require('../../../config/kits');
const { provisionKit } = require('../../setup/provision');
const { errorEmbed, successEmbed, infoEmbed } = require('../../../utils/embeds');

// This is the "bot auto-provisions the kit" step. No webhook server, no
// extra hosting - the bot just calls Stripe directly to check the session
// the customer pasted is real, paid, and not already redeemed, then runs
// the exact same provisioning code /setup-kit uses.
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
}

function kitForPriceId(priceId) {
  return Object.values(KITS).find((k) => process.env[k.stripePriceEnv] === priceId) || null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('activate')
    .setDescription('Redeem your kit purchase and build your server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((o) => o.setName('session_id').setDescription('The activation code from your confirmation page/email').setRequired(true)),

  async execute(interaction) {
    const sessionId = interaction.options.getString('session_id').trim();
    await interaction.deferReply({ ephemeral: true });

    const stripe = getStripe();
    if (!stripe) {
      return interaction.editReply({ embeds: [errorEmbed('Payments are not configured on this bot yet (missing STRIPE_SECRET_KEY). Contact the server owner.')] });
    }

    const alreadyUsed = db.prepare(`SELECT * FROM used_sessions WHERE sessionId = ?`).get(sessionId);
    if (alreadyUsed) {
      return interaction.editReply({ embeds: [errorEmbed('This activation code has already been used. Each purchase can only build one server.')] });
    }

    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items'] });
    } catch {
      return interaction.editReply({ embeds: [errorEmbed('That code was not recognized. Double check what you pasted, or contact support.')] });
    }

    if (session.payment_status !== 'paid') {
      return interaction.editReply({ embeds: [errorEmbed('This purchase has not completed payment yet.')] });
    }

    const priceId = session.line_items?.data?.[0]?.price?.id;
    const kit = kitForPriceId(priceId);
    if (!kit) {
      return interaction.editReply({ embeds: [errorEmbed("Couldn't match this purchase to a kit. Contact support and mention your activation code.")] });
    }

    if (!interaction.guild.members.me.permissions.has('Administrator')) {
      return interaction.editReply({ embeds: [errorEmbed('I need Administrator permission in this server to build your kit. Re-invite me with that permission, then run /activate again.')] });
    }

    await interaction.editReply({ embeds: [infoEmbed(`Payment verified! Building your **${kit.displayName}**... this takes 10-30 seconds.`)] });

    try {
      await provisionKit(interaction.guild, kit.key, kit);
      db.prepare(`INSERT INTO used_sessions (sessionId, guildId, redeemedBy, redeemedAt) VALUES (?, ?, ?, ?)`).run(sessionId, interaction.guild.id, interaction.user.id, Date.now());
      await interaction.followUp({ embeds: [successEmbed(`🎉 **${kit.displayName}** is live! Roles, channels, tickets, and verification are all set up.`)], ephemeral: true });
    } catch (err) {
      console.error('[activate] Provisioning failed:', err);
      await interaction.followUp({ embeds: [errorEmbed('Something went wrong while building your server. Contact support with your activation code - your purchase is safe and has not been marked as used.')], ephemeral: true });
    }
  },
};
