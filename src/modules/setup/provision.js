const { ChannelType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { setConfig } = require('../../database/db');
const { baseEmbed } = require('../../utils/embeds');

const { ViewChannel } = PermissionsBitField.Flags;

async function postWelcomeMessage(channel, kit) {
  await channel.send({
    embeds: [
      baseEmbed()
        .setTitle(`👋 Welcome to the server!`)
        .setDescription(`This server was set up with the **${kit.displayName}**. Head to <#${channel.id}> for updates, check the rules, and verify yourself to unlock everything.`),
    ],
  });
}

async function postRules(channel) {
  await channel.send({
    embeds: [
      baseEmbed()
        .setTitle('📜 Server Rules')
        .setDescription(
          [
            '**1.** Be respectful - no harassment, hate speech, or discrimination.',
            '**2.** No spam, self-promotion, or unsolicited DMs.',
            '**3.** Keep content in the right channels.',
            '**4.** No NSFW content.',
            '**5.** Follow the [Discord Community Guidelines](https://discord.com/guidelines).',
            '',
            '_Edit this message any time to match your server - this is just a starting point._',
          ].join('\n')
        ),
    ],
  });
}

async function postVerifyPanel(channel) {
  const embed = baseEmbed().setTitle('✅ Verify yourself').setDescription('Click the button below to verify and unlock the rest of the server.');
  const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('verify_member').setLabel('Verify').setStyle(ButtonStyle.Success).setEmoji('✅'));
  await channel.send({ embeds: [embed], components: [row] });
}

async function postTicketPanel(channel) {
  const embed = baseEmbed().setTitle('🎫 Need help?').setDescription('Click the button below to open a private ticket with staff.');
  const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_create').setLabel('Open a ticket').setStyle(ButtonStyle.Primary).setEmoji('🎫'));
  await channel.send({ embeds: [embed], components: [row] });
}

// The whole pitch - "a professional Discord server without spending 10
// hours building one" - happens right here. Given an empty/near-empty
// server and a kit key, this creates every role, category, channel,
// permission overwrite, and starter message in one pass.
async function provisionKit(guild, kitKey, kit) {
  const everyoneId = guild.roles.everyone.id;
  const roleIds = {};

  for (const r of kit.roles) {
    const role = await guild.roles.create({
      name: r.name,
      color: r.color,
      hoist: r.hoist,
      permissions: r.permissions || [],
    });
    roleIds[r.configKey] = role.id;
    setConfig(guild.id, r.configKey, role.id);
  }

  const modRoleId = roleIds.modRoleId;
  const memberRoleId = roleIds.verifiedRoleId;

  for (const cat of kit.categories) {
    let overwrites = [];
    if (cat.hiddenCategory || cat.staffOnly) {
      overwrites = [
        { id: everyoneId, deny: [ViewChannel] },
        { id: modRoleId, allow: [ViewChannel] },
      ];
    } else if (cat.memberOnly) {
      overwrites = [
        { id: everyoneId, deny: [ViewChannel] },
        { id: memberRoleId, allow: [ViewChannel] },
        { id: modRoleId, allow: [ViewChannel] },
      ];
    } // everyoneCanView categories get no overwrites - default visible to all

    const category = await guild.channels.create({
      name: cat.name,
      type: ChannelType.GuildCategory,
      permissionOverwrites: overwrites,
    });

    if (cat.configKey) setConfig(guild.id, cat.configKey, category.id);

    for (const ch of cat.channels || []) {
      const channel = await guild.channels.create({
        name: ch.name,
        type: ch.type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText,
        parent: category.id,
      });
      await channel.lockPermissions().catch(() => null); // inherit the category's overwrites

      if (ch.configKey) setConfig(guild.id, ch.configKey, channel.id);
      if (ch.postWelcomeMessage) await postWelcomeMessage(channel, kit);
      if (ch.postRules) await postRules(channel);
      if (ch.postVerifyPanel) await postVerifyPanel(channel);
      if (ch.postTicketPanel) await postTicketPanel(channel);
    }
  }

  setConfig(guild.id, 'activeKit', kitKey);
}

module.exports = { provisionKit };
