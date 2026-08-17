const { baseEmbed } = require('../../../utils/embeds');
const { sendLog } = require('../logHelper');

module.exports = {
  name: 'messageDelete',
  async execute(message) {
    if (!message.guild || message.author?.bot) return;
    const embed = baseEmbed()
      .setColor(0xed4245)
      .setTitle('🗑️ Message deleted')
      .setDescription(`**Author:** <@${message.author?.id || 'unknown'}>\n**Channel:** <#${message.channelId}>\n**Content:** ${message.content || '*[no cached content]*'}`);
    await sendLog(message.guild, embed);
  },
};
