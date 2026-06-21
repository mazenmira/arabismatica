/**
 * Migrate Delhi Sultanate coins from delhi_coins.json to Supabase coins table.
 * Usage: node scripts/migrate-delhi.js [--dry-run]
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

const fs   = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const DRY_RUN    = process.argv.includes('--dry-run');
const BATCH_SIZE = 50;
const JSON_FILE  = path.join(__dirname, '../src/data/delhi_coins.json');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function main() {
  if (!fs.existsSync(JSON_FILE)) {
    console.error(`❌ File not found: ${JSON_FILE}`);
    console.error('   Run "node scripts/scrape-delhi.js --run" first to generate the data.');
    process.exit(1);
  }

  const raw   = fs.readFileSync(JSON_FILE, 'utf8');
  const coins = JSON.parse(raw);
  console.log(`📦 Loaded ${coins.length} Delhi Sultanate coins from ${JSON_FILE}`);

  if (DRY_RUN) {
    console.log('🔍 DRY RUN — sample of first 3 records:');
    coins.slice(0, 3).forEach(c => console.log(JSON.stringify(c, null, 2)));
    return;
  }

  let upserted = 0;
  let errors   = 0;

  // Map scraped fields to DB column names; drop extras not in schema
  const STRING_COLS = ['cc','co','co_ar','dyn','name','nar','km','yce','yah','metal',
    'nref','nid','type','denomination','mint','mint_ar','ruler','ruler_ar',
    'obverse_legend','reverse_legend','o','r','coin_type_tag'];
  const cleaned = coins.map(c => {
    const row = { id: c.id };
    for (const k of STRING_COLS) {
      row[k] = c[k] ?? '';
    }
    row.wt          = c.wt          ?? null;
    row.dia         = c.dia         ?? null;
    row.prices      = c.prices      ?? null;
    row.mintage_data = c.mintageData ?? null;
    row.auction     = c.auction     ?? null;
    return row;
  });

  for (let i = 0; i < cleaned.length; i += BATCH_SIZE) {
    const batch = cleaned.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('coins')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Batch ${i}–${i + batch.length} failed:`, error.message);
      errors += batch.length;
    } else {
      upserted += batch.length;
      if (upserted % 500 === 0 || upserted === cleaned.length) {
        console.log(`  ✔ ${upserted} upserted  (total: ${upserted})`);
      } else {
        process.stdout.write(`\r✅ Upserted ${upserted}/${cleaned.length} coins…`);
      }
    }
  }

  console.log(`\n\n✅ Migration complete — ${upserted} upserted, ${errors} errors`);
  if (errors > 0) process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });
