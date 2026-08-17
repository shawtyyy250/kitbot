const { baseEmbed } = require('../../../utils/embeds');
const { sendLog } = require('../logHelper');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return; // ignore embed-only updates
    const embed = baseEmbed()
      .setColor(0xfee75c)
      .setTitle('✏️ Message edited')
      .setDescription(`**Author:** <@${newMessage.author.id}>\n**Channel:** <#${newMessage.channelId}>\n**Before:** ${oldMessage.content || '*[unknown]*'}\n**After:** ${newMessage.content}`);
    await sendLog(newMessage.guild, embed);
  },
};
