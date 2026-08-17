const UNIT_MS = { m: 60_000, h: 3_600_000, d: 86_400_000 };

// Accepts things like "10m", "2h", "1d". Returns milliseconds, or null if
// the input doesn't match - every command that takes a duration (timeout,
// giveaways) shares this so "10m" always means the same thing everywhere.
function parseDuration(input) {
  if (!input) return null;
  const match = /^(\d+)([mhd])$/.exec(input.trim());
  if (!match) return null;
  return Number(match[1]) * UNIT_MS[match[2]];
}

module.exports = { parseDuration };
