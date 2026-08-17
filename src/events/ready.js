const { initModules } = require('../loader');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`[ready] Logged in as ${client.user.tag} - serving ${client.guilds.cache.size} server(s)`);
    client.user.setActivity('/help • kitbot', { type: 3 }); // type 3 = Watching
    await initModules(client);
  },
};
