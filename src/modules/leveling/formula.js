// Standard "MEE6-style" curve: each level takes progressively more XP.
// Total XP needed to REACH a given level.
function xpForLevel(level) {
  return 5 * level * level + 50 * level + 100;
}

function levelFromXp(xp) {
  let level = 0;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}

module.exports = { xpForLevel, levelFromXp };
