const { errorEmbed } = require('../utils/embeds');

// Every slash command, button click, and modal submit in the entire bot
// passes through here first. Individual modules never listen to
// "interactionCreate" directly - they register a command in commands/ or a
// button handler in buttons/, and this file is what actually calls them.
module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        await command.execute(interaction, client);
        return;
      }

      if (interaction.isButton()) {
        const handler = client.buttons.find((b) => b.match(interaction.customId));
        if (!handler) return;
        await handler.execute(interaction, client);
        return;
      }
    } catch (err) {
      console.error('[interactionCreate] Handler error:', err);
      const payload = { embeds: [errorEmbed('Something went wrong running that. The error has been logged.')], ephemeral: true };
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(payload);
        } else {
          await interaction.reply(payload);
        }
      } catch {
        /* interaction already expired - nothing more we can do */
      }
    }
  },
};
