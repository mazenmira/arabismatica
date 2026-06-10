'use strict';
/**
 * tag-is-coins.js
 * Adds coin_type_tag to every IS coin in coins.json.
 * Rules applied in priority order (most specific first).
 */
const fs   = require('fs');
const path = require('path');

const COINS_FILE = path.resolve(__dirname, '../src/data/coins.json');

function getTag(coin) {
  const name = coin.name || '';
  const yce  = parseInt(coin.yce || '9999');
  if (name.includes('Arab-Byzantine'))  return 'Arab-Byzantine';
  if (name.includes('Arab-Sasanian'))   return 'Arab-Sasanian';
  if (name.includes('Standing Caliph')) return 'Standing Caliph';
  if (name.includes('Dirham') && yce < 750) return 'Early Dirham';
  if (name.includes('Fals') || name.includes('Fils')) return 'Fals/Fils';
  if (name.includes('Dinar'))           return 'Dinar';
  if (name.includes('Anonymous'))       return 'Anonymous';
  return 'Other';
}

console.log('Loading coins.json…');
const coins = JSON.parse(fs.readFileSync(COINS_FILE, 'utf8'));

const counts = {};
let tagged = 0;

for (const coin of coins) {
  if (coin.cc !== 'IS') continue;
  const tag = getTag(coin);
  coin.coin_type_tag = tag;
  counts[tag] = (counts[tag] || 0) + 1;
  tagged++;
}

console.log('Writing coins.json…');
fs.writeFileSync(COINS_FILE, JSON.stringify(coins), 'utf8');

console.log(`\n✅  Tagged ${tagged.toLocaleString()} IS coins\n`);
console.log('coin_type_tag counts:');
console.log('─'.repeat(36));
const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
for (const [tag, n] of sorted) {
  console.log(`  ${tag.padEnd(22)} ${String(n).padStart(7)}`);
}
const total = sorted.reduce((s, [, n]) => s + n, 0);
console.log('─'.repeat(36));
console.log(`  ${'TOTAL'.padEnd(22)} ${String(total).padStart(7)}`);
