'use strict';
/**
 * Task 3 — Generate src/data/latest_additions.json
 * Contains the 20 most recently added coin IDs (tail of coins.json).
 */
const fs   = require('fs');
const path = require('path');

const COINS_FILE  = path.resolve(__dirname, '../src/data/coins.json');
const OUTPUT_FILE = path.resolve(__dirname, '../src/data/latest_additions.json');

const coins = JSON.parse(fs.readFileSync(COINS_FILE, 'utf8'));
const latest = coins.slice(-20).reverse().map(c => c.id);

fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ ids: latest, generatedAt: new Date().toISOString() }, null, 2));
console.log('latest_additions.json written. IDs:', latest.slice(0, 5), '...');
