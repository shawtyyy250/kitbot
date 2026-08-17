const { checkDue } = require('./engine');

module.exports = {
  async init(client) {
    setInterval(() => checkDue(client), 15_000);
  },
};
