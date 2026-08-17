// This file IS the product catalog. Every "kit" you sell is just an entry
// here - a role list + a channel/category layout - built from the SAME
// bot code. Want a Creator Kit or Business Kit later? Copy the "gaming"
// entry, rename it, change the channels. Nothing else in the codebase
// needs to change.
//
// STRIPE_PRICE_ENV points at an env var (set in .env) holding the Stripe
// Price ID for that kit, so /activate knows which template to build after
// verifying a payment.
const KITS = {
  gaming: {
    key: 'gaming',
    displayName: 'Gaming Community Kit',
    price: 29,
    stripePriceEnv: 'STRIPE_PRICE_GAMING',
    roles: [
      {
        configKey: 'modRoleId',
        name: 'Staff',
        color: 0xed4245,
        hoist: true,
        permissions: ['KickMembers', 'BanMembers', 'ModerateMembers', 'ManageMessages', 'ManageChannels', 'ManageRoles', 'ManageGuild'],
      },
      {
        configKey: 'verifiedRoleId',
        name: 'Member',
        color: 0x57f287,
        hoist: false,
        permissions: [],
      },
    ],
    categories: [
      {
        name: '📢 INFORMATION',
        everyoneCanView: true,
        channels: [
          { name: 'welcome', type: 'text', configKey: 'welcomeChannelId', postWelcomeMessage: true },
          { name: 'rules', type: 'text', postRules: true },
          { name: 'announcements', type: 'text', configKey: 'announcementChannelId' },
          { name: 'verify', type: 'text', postVerifyPanel: true },
        ],
      },
      {
        name: '💬 COMMUNITY',
        memberOnly: true,
        channels: [
          { name: 'general', type: 'text' },
          { name: 'memes', type: 'text' },
          { name: 'clips-and-highlights', type: 'text' },
          { name: 'suggestions', type: 'text' },
        ],
      },
      {
        name: '🎮 GAMING',
        memberOnly: true,
        channels: [
          { name: 'looking-for-group', type: 'text' },
          { name: 'game-chat', type: 'text' },
        ],
      },
      {
        name: '🎫 SUPPORT',
        everyoneCanView: true,
        channels: [{ name: 'ticket-panel', type: 'text', postTicketPanel: true }],
      },
      {
        name: '🎫 Tickets',
        hiddenCategory: true,
        configKey: 'ticketCategoryId',
        channels: [],
      },
      {
        name: '🔊 VOICE',
        memberOnly: true,
        channels: [
          { name: 'General Voice', type: 'voice' },
          { name: 'Gaming Voice 1', type: 'voice' },
          { name: 'Gaming Voice 2', type: 'voice' },
        ],
      },
      {
        name: '🛡️ STAFF ONLY',
        staffOnly: true,
        channels: [
          { name: 'staff-chat', type: 'text' },
          { name: 'mod-log', type: 'text', configKey: 'logChannelId' },
        ],
      },
    ],
  },
};

function getKit(key) {
  return KITS[key] || null;
}

module.exports = { KITS, getKit };
