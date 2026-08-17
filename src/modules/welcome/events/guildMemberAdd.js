const { getConfig } = require('../../../database/db');
const { baseEmbed } = require('../../../utils/embeds');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const welcomeChannelId = getConfig(member.guild.id, 'welcomeChannelId');
    if (welcomeChannelId) {
      const channel = await member.guild.channels.fetch(welcomeChannelId).catch(() => null);
      if (channel) {
        const embed = baseEmbed()
          .setTitle(`Welcome to ${member.guild.name}! 👋`)
          .setDescription(`Glad you're here, <@${member.id}>. You're member #${member.guild.memberCount}.`)
          .setThumbnail(member.user.displayAvatarURL());
        await channel.send({ embeds: [embed] }).catch(() => null);
      }
    }
  },
};
