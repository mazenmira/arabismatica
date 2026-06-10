'use strict';
/**
 * sync-is-fields.js
 *
 * Batch-upserts coin_type_tag, ruler_ar, mint_ar for all IS coins
 * from coins.json → Supabase.
 *
 * Prerequisites:
 *   Run this SQL in Supabase SQL Editor first:
 *     ALTER TABLE coins ADD COLUMN IF NOT EXISTS coin_type_tag text;
 *
 * Usage:
 *   node scripts/sync-is-fields.js
 *   node scripts/sync-is-fields.js --dry-run
 */
const fs   = require('fs');
const path = require('path');

// ── Load .env.local ────────────────────────────────────────────────────────────
function loadEnv() {
  const f = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}
loadEnv();

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const DRY_RUN    = process.argv.includes('--dry-run');
const BATCH_SIZE = 500;
const HEADERS    = {
  'Content-Type':  'application/json',
  'apikey':        SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Prefer':        'resolution=merge-duplicates',
};

async function upsertBatch(rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/coins`, {
    method:  'POST',
    headers: HEADERS,
    body:    JSON.stringify(rows),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 400)}`);
  }
}

async function getDbCount(field) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/coins?select=${field}&${field}=not.is.null&${field}=not.eq.&cc=eq.IS&limit=1`,
    { headers: { ...HEADERS, 'Prefer': 'count=exact' } }
  );
  const range = res.headers.get('content-range');
  return range ? range.split('/')[1] : '?';
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       sync-is-fields.js — IS field sync to Supabase      ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE UPSERT'}\n`);

  console.log('Loading coins.json…');
  const coins = JSON.parse(fs.readFileSync(
    path.resolve(__dirname, '../src/data/coins.json'), 'utf8'
  ));
  const isCoins = coins.filter(c => c.cc === 'IS');
  console.log(`  Found ${isCoins.length.toLocaleString()} IS coins\n`);

  // Build minimal upsert rows — only id + the three fields
  const rows = isCoins.map(c => ({
    id:            c.id,
    coin_type_tag: c.coin_type_tag || null,
    ruler_ar:      c.ruler_ar      || '',
    mint_ar:       c.mint_ar       || '',
  }));

  if (DRY_RUN) {
    console.log('DRY RUN — first 3 rows:');
    rows.slice(0, 3).forEach(r => console.log(' ', JSON.stringify(r)));
    console.log('\nDry run complete — no data written.');
    return;
  }

  const batches = Math.ceil(rows.length / BATCH_SIZE);
  let done = 0, failed = 0;

  for (let b = 0; b < batches; b++) {
    const batch = rows.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    try {
      await upsertBatch(batch);
      done += batch.length;
      const pct = Math.round(done / rows.length * 100);
      process.stdout.write(`\r  Batch ${b + 1}/${batches} — ${done.toLocaleString()}/${rows.length.toLocaleString()} (${pct}%)   `);
    } catch (err) {
      failed += batch.length;
      console.error(`\n  ✗ Batch ${b + 1} failed: ${err.message}`);
      if (err.message.includes('column "coin_type_tag" of relation "coins" does not exist')) {
        console.error('\n  ⚠  Run this SQL in Supabase SQL Editor first:');
        console.error('       ALTER TABLE coins ADD COLUMN IF NOT EXISTS coin_type_tag text;');
        process.exit(1);
      }
      if (err.message.includes('401') || err.message.includes('403')) {
        console.error('  Fatal auth error — aborting.'); break;
      }
    }
    if (b < batches - 1) await new Promise(r => setTimeout(r, 120));
  }

  process.stdout.write('\n\n');

  // Verify counts in Supabase
  console.log('Verifying Supabase counts for IS coins…');
  const [tagCount, rulerArCount, mintArCount] = await Promise.all([
    getDbCount('coin_type_tag'),
    getDbCount('ruler_ar'),
    getDbCount('mint_ar'),
  ]);

  console.log('─'.repeat(44));
  console.log(`  coin_type_tag populated : ${tagCount}`);
  console.log(`  ruler_ar populated      : ${rulerArCount}`);
  console.log(`  mint_ar populated       : ${mintArCount}`);
  console.log('─'.repeat(44));

  if (failed > 0) {
    console.log(`\n  ⚠  ${failed} rows failed.`);
  } else {
    console.log(`\n  ✅ Sync complete — ${done.toLocaleString()} IS coins updated.`);
  }
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
