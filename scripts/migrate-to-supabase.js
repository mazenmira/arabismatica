'use strict';
/**
 * migrate-to-supabase.js
 *
 * Reads coins.json and bulk-inserts all coins into Supabase
 * using the service role key (bypasses RLS).
 *
 * Prerequisites:
 *   1. Run the SQL schema in Supabase dashboard first.
 *   2. Set env vars (or create .env.local):
 *        NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 *        SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *
 * Usage:
 *   node scripts/migrate-to-supabase.js
 *   node scripts/migrate-to-supabase.js --dry-run     (validate only, no insert)
 *   node scripts/migrate-to-supabase.js --upsert      (upsert instead of insert)
 *   node scripts/migrate-to-supabase.js --from=10000  (resume from coin index)
 */

const fs   = require('fs');
const path = require('path');

// ── Load env ───────────────────────────────────────────────────────────────────
function loadEnv() {
  const envFile = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envFile)) {
    const lines = fs.readFileSync(envFile, 'utf8').split('\n');
    for (const line of lines) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}
loadEnv();

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('✗ Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// ── Config ─────────────────────────────────────────────────────────────────────
const BATCH_SIZE = 500;
const TABLE      = 'coins';
const COINS_FILE = path.resolve(__dirname, '../src/data/coins.json');

const DRY_RUN = process.argv.includes('--dry-run');
const UPSERT  = process.argv.includes('--upsert');
const fromArg = process.argv.find(a => a.startsWith('--from='));
const FROM    = fromArg ? parseInt(fromArg.split('=')[1]) : 0;

// ── Transform coin from JSON shape → DB row ───────────────────────────────────
function toRow(coin) {
  return {
    id:              coin.id               || '',
    cc:              coin.cc               || '',
    co:              coin.co               || '',
    co_ar:           coin.co_ar            || '',
    dyn:             coin.dyn              || '',
    name:            coin.name             || '',
    nar:             coin.nar              || '',
    km:              coin.km               || '',
    yce:             coin.yce              || '',
    yah:             coin.yah              || '',
    metal:           coin.metal            || '',
    wt:              coin.wt               ?? null,
    dia:             coin.dia              ?? null,
    nref:            coin.nref             || '',
    nid:             coin.nid              || '',
    type:            coin.type             || 'Circulation',
    denomination:    coin.denomination     || null,
    mint:            coin.mint             || '',
    mint_ar:         coin.mint_ar          || '',
    ruler:           coin.ruler            || '',
    ruler_ar:        coin.ruler_ar         || '',
    obverse_legend:  coin.obverse_legend   || '',
    reverse_legend:  coin.reverse_legend   || '',
    o:               coin.o                || '',
    r:               coin.r                || '',
    prices:          coin.prices           ?? null,
    mintage_data:    (coin.mintageData && coin.mintageData.length > 0) ? coin.mintageData : null,
    auction:         coin.auction          ?? null,
  };
}

// ── Supabase REST helper (no SDK needed — uses fetch) ─────────────────────────
const HEADERS = {
  'Content-Type':  'application/json',
  'apikey':        SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Prefer':        UPSERT ? 'resolution=merge-duplicates' : 'return=minimal',
};

async function insertBatch(rows) {
  const url    = `${SUPABASE_URL}/rest/v1/${TABLE}`;
  const method = UPSERT ? 'POST' : 'POST';  // both use POST; Prefer header distinguishes
  const res = await fetch(url, {
    method,
    headers: HEADERS,
    body:    JSON.stringify(rows),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 500)}`);
  }
  return res;
}

async function getCount() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?select=id&limit=1`, {
    headers: { ...HEADERS, 'Prefer': 'count=exact' },
  });
  const count = res.headers.get('content-range');
  return count ? count.split('/')[1] : '?';
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║          Arabismatica → Supabase Migration               ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  URL       : ${SUPABASE_URL}`);
  console.log(`  Table     : ${TABLE}`);
  console.log(`  Batch     : ${BATCH_SIZE}`);
  console.log(`  Mode      : ${DRY_RUN ? 'DRY RUN (no writes)' : UPSERT ? 'UPSERT' : 'INSERT'}`);
  console.log(`  Start from: index ${FROM}`);

  const coins = JSON.parse(fs.readFileSync(COINS_FILE, 'utf8'));
  const slice = coins.slice(FROM);
  const total = slice.length;
  console.log(`\n  Loaded ${coins.length.toLocaleString()} coins, inserting ${total.toLocaleString()} (from index ${FROM})\n`);

  if (DRY_RUN) {
    console.log('DRY RUN: validating first 3 rows...');
    [0, 1, 2].forEach(i => { if (slice[i]) console.log(JSON.stringify(toRow(slice[i]), null, 2)); });
    console.log('\nDry run complete — no data written.');
    return;
  }

  let inserted = 0, failed = 0;
  const batches = Math.ceil(total / BATCH_SIZE);

  for (let b = 0; b < batches; b++) {
    const start = b * BATCH_SIZE;
    const end   = Math.min(start + BATCH_SIZE, total);
    const batch = slice.slice(start, end).map(toRow);

    try {
      await insertBatch(batch);
      inserted += batch.length;

      const pct     = Math.round(inserted / total * 100);
      const absIdx  = FROM + inserted;
      process.stdout.write(
        `\r  Batch ${b + 1}/${batches} — ${inserted.toLocaleString()}/${total.toLocaleString()} rows (${pct}%) — global index ${absIdx.toLocaleString()}   `
      );
    } catch (err) {
      failed += batch.length;
      console.error(`\n  ✗ Batch ${b + 1} failed: ${err.message}`);
      console.error(`    Resume with: node scripts/migrate-to-supabase.js --from=${FROM + start}`);
      // Continue to next batch unless it's a fatal auth error
      if (err.message.includes('401') || err.message.includes('403')) {
        console.error('  Fatal auth error — aborting.');
        break;
      }
    }

    // Small delay to avoid rate limits
    if (b < batches - 1) await new Promise(r => setTimeout(r, 150));
  }

  process.stdout.write('\n\n');

  // Final count from Supabase
  let dbCount = '?';
  try { dbCount = await getCount(); } catch { /* ignore */ }

  console.log('─── Migration Complete ──────────────────────────────────────────');
  console.log(`  Inserted : ${inserted.toLocaleString()}`);
  console.log(`  Failed   : ${failed.toLocaleString()}`);
  console.log(`  DB count : ${dbCount}`);
  if (failed > 0) {
    console.log(`\n  ⚠  ${failed} rows failed. Check logs above for --from= resume point.`);
  } else {
    console.log('\n  ✅ All rows migrated successfully.');
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
