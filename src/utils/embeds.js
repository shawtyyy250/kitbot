const { EmbedBuilder } = require('discord.js');

// One shared color/footer so every embed KitBot sends - across every module,
// in every customer's server - looks like it came from the same polished
// product instead of a pile of separate scripts.
const BRAND_COLOR = 0x5865f2; // Discord blurple; swap for your own brand color
const BRAND_NAME = 'KitBot';

function baseEmbed() {
  return new EmbedBuilder().setColor(BRAND_COLOR).setFooter({ text: BRAND_NAME });
}

function successEmbed(description) {
  return baseEmbed().setDescription(`✅ ${description}`);
}

function errorEmbed(description) {
  return baseEmbed().setColor(0xed4245).setDescription(`❌ ${description}`);
}

function infoEmbed(description) {
  return baseEmbed().setDescription(description);
}

module.exports = { baseEmbed, successEmbed, errorEmbed, infoEmbed, BRAND_COLOR, BRAND_NAME };
