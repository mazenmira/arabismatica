'use strict';

/**
 * merge-zeno.js — Merge scraped Zeno.ru coins into src/data/coins.json
 *
 * Usage:
 *   node scripts/merge-zeno.js
 *   node scripts/merge-zeno.js --dry-run   (preview without writing)
 */

const fs   = require('fs');
const path = require('path');

const SCRIPTS_DIR  = path.resolve(__dirname);
const ZENO_FILE    = path.join(SCRIPTS_DIR, 'zeno_raw.json');
const COINS_FILE   = path.resolve(__dirname, '../src/data/coins.json');

const DRY_RUN = process.argv.includes('--dry-run');

function main() {
  // ── Load files ──────────────────────────────────────────────────────────────
  if (!fs.existsSync(ZENO_FILE)) {
    console.error(`✗ ${ZENO_FILE} not found. Run scrape-zeno.js first.`);
    process.exit(1);
  }
  if (!fs.existsSync(COINS_FILE)) {
    console.error(`✗ ${COINS_FILE} not found.`);
    process.exit(1);
  }

  const zenoCoins  = JSON.parse(fs.readFileSync(ZENO_FILE,  'utf8'));
  const allCoins   = JSON.parse(fs.readFileSync(COINS_FILE, 'utf8'));

  const before = allCoins.length;

  // ── Build lookup of existing nids ──
  const existingNids = new Set(allCoins.map(c => c.nid));

  // Also index existing coins with Z# nref to avoid duplication by nref
  const existingNrefs = new Set(allCoins.map(c => c.nref).filter(Boolean));

  // ── Filter new coins ────────────────────────────────────────────────────────
  const toAdd   = [];
  const skipped = [];

  // Grouped stats by dynasty
  const byDynasty = {};

  for (const coin of zenoCoins) {
    const isDupeNid  = existingNids.has(coin.nid);
    const isDupeNref = existingNrefs.has(coin.nref);

    if (isDupeNid || isDupeNref) {
      skipped.push(coin);
      continue;
    }

    toAdd.push(coin);
    existingNids.add(coin.nid);
    existingNrefs.add(coin.nref);

    const dynKey = coin.dyn || coin.co || 'Unknown';
    byDynasty[dynKey] = (byDynasty[dynKey] || 0) + 1;
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  const after = before + toAdd.length;

  console.log('\n─── Merge Summary ──────────────────────────────────────────────────────');
  console.log(`  coins.json before : ${before.toLocaleString()} coins`);
  console.log(`  Zeno raw coins    : ${zenoCoins.length.toLocaleString()} coins`);
  console.log(`  Already in DB     : ${skipped.length.toLocaleString()} skipped (duplicates)`);
  console.log(`  New coins to add  : ${toAdd.length.toLocaleString()}`);
  console.log(`  coins.json after  : ${after.toLocaleString()} coins`);

  if (toAdd.length > 0) {
    console.log('\n  New coins by dynasty:');
    for (const [dyn, count] of Object.entries(byDynasty).sort((a,b) => b[1]-a[1])) {
      console.log(`    ${count.toString().padStart(6)}  ${dyn}`);
    }
  }

  if (DRY_RUN) {
    console.log('\n  ⚠ DRY RUN — coins.json NOT modified.');
    return;
  }

  if (toAdd.length === 0) {
    console.log('\n  Nothing to add. coins.json unchanged.');
    return;
  }

  // ── Append and write ────────────────────────────────────────────────────────
  const merged = [...allCoins, ...toAdd];
  fs.writeFileSync(COINS_FILE, JSON.stringify(merged, null, 2));
  console.log(`\n✅ coins.json updated: ${before} → ${after} coins (+${toAdd.length})`);
}

main();
