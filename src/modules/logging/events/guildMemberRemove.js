const { baseEmbed } = require('../../../utils/embeds');
const { sendLog } = require('../logHelper');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    const embed = baseEmbed().setColor(0x99aab5).setTitle('👋 Member left').setDescription(`<@${member.id}> (${member.user.tag}) left the server.`);
    await sendLog(member.guild, embed);
  },
};
