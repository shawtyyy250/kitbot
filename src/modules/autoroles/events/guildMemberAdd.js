const { getConfig } = require('../../../database/db');

// Instant "everyone gets this role on join" - separate from the
// button-gated /verify-panel below, which is for servers that want people
// to click something first (read rules, prove they're not a bot, etc.)
module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const autoRoleId = getConfig(member.guild.id, 'autoRoleId');
    if (!autoRoleId) return;
    await member.roles.add(autoRoleId).catch((err) => console.error('[autoroles] Failed to assign auto role:', err.message));
  },
};
