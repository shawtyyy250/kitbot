const { baseEmbed } = require('../../../utils/embeds');
const { sendLog } = require('../logHelper');

module.exports = {
  name: 'guildBanAdd',
  async execute(ban) {
    const embed = baseEmbed().setColor(0xed4245).setTitle('🔨 Member banned').setDescription(`<@${ban.user.id}> (${ban.user.tag}) was banned.`);
    await sendLog(ban.guild, embed);
  },
};
