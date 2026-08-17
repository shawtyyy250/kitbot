const { PermissionsBitField } = require('discord.js');
const { getConfig } = require('../database/db');

// A member counts as "staff" if they can Administrator, OR they hold
// whichever role was configured with /config set modRoleId <role>.
// This is what lets Moderation/Tickets/etc. work identically in every
// customer server without hardcoding a role name or ID anywhere.
function isStaff(member) {
  if (!member) return false;
  if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;
  const modRoleId = getConfig(member.guild.id, 'modRoleId');
  if (modRoleId && member.roles.cache.has(modRoleId)) return true;
  return false;
}

module.exports = { isStaff };
