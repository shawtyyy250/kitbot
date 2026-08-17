const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { isStaff } = require('../../../utils/permissions');
const { getConfig } = require('../../../database/db');
const { baseEmbed, errorEmbed, successEmbed } = require('../../../utils/embeds');
const { KITS } = require('../../../config/kits');

// Posts the "Discord-native storefront": an embed with a real payment link
// button, right inside your own server. Set the link first with
// /config set-text storeLink <your Stripe Payment Link URL>.
module.exports = {
  data: new SlashCommandBuilder()
    .setName('store-panel')
    .setDescription('Post the buy-a-kit panel in this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) =>
      o
        .setName('kit')
        .setDescription('Which kit this panel sells')
        .setRequired(true)
        .addChoices(...Object.values(KITS).map((k) => ({ name: k.displayName, value: k.key })))
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('You need to be staff to use this.')], ephemeral: true });
    }
    const kitKey = interaction.options.getString('kit');
    const kit = KITS[kitKey];
    const storeLink = getConfig(interaction.guild.id, 'storeLink');
    if (!storeLink) {
      return interaction.reply({ embeds: [errorEmbed('No store link configured yet. Run `/config set-text key:storeLink value:<your Stripe Payment Link URL>` first.')], ephemeral: true });
    }

    const embed = baseEmbed()
      .setTitle(`🛒 ${kit.displayName} — $${kit.price}`)
      .setDescription('Get a fully built, professional Discord server in minutes. Click **Buy Now**, then follow the instructions on the confirmation page to activate your kit with `/activate`.');
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel('Buy Now').setStyle(ButtonStyle.Link).setURL(storeLink).setEmoji('🛒'));

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ embeds: [successEmbed('Store panel posted.')], ephemeral: true });
  },
};
