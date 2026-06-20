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
  process.env.SUPABASE_URL,
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

  for (let i = 0; i < coins.length; i += BATCH_SIZE) {
    const batch = coins.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('coins')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Batch ${i}–${i + batch.length} failed:`, error.message);
      errors += batch.length;
    } else {
      upserted += batch.length;
      process.stdout.write(`\r✅ Upserted ${upserted}/${coins.length} coins…`);
    }
  }

  console.log(`\n\n✅ Migration complete — ${upserted} upserted, ${errors} errors`);
}

main().catch(err => { console.error(err); process.exit(1); });
