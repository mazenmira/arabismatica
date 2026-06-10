'use strict';
/**
 * enrich-is-quality.js
 *
 * Comprehensive re-enrichment of IS coins in coins.json:
 *   1. denomination  — case-insensitive name/metal rules
 *   2. metal         — normalise ~80 messy raw values → canonical
 *   3. coin_type_tag — use fixed denomination+metal for accurate tagging
 *
 * Then batch-upserts denomination, metal, coin_type_tag to Supabase.
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
const DRY_RUN          = process.argv.includes('--dry-run');
const BATCH_SIZE       = 500;

// ── Metal normalisation ────────────────────────────────────────────────────────
// Handles: AV/av/Av, AR/Ag/ag/аr (Cyrillic), AE/Æ/æ/ае (Cyrillic), Pb, etc.
function normaliseMetal(raw, name) {
  const r = (raw || '').trim();
  const n = (name || '').toLowerCase();

  if (!r && !n) return '';

  const rl = r.toLowerCase().replace(/\s+/g, ' ');

  // ── Gold ──────────────────────────────────────────────────────────────────
  if (/^av[.\s(]|^av$/i.test(r))               return 'Gold';
  if (/gold/i.test(r))                          return 'Gold';
  if (/pale.?gold|pale av/i.test(r))            return 'Gold';
  if (/electr/i.test(r))                        return 'Gold'; // electron/electrum
  if (/gilt (copper|ae|bronze)/i.test(r))       return 'Gold'; // gilt = gold-plated
  if (/^av/i.test(n))                           return 'Gold'; // name starts AV

  // ── Billon (debased silver — before pure Silver check) ────────────────────
  if (/billon/i.test(r))                        return 'Billon';
  if (/debased|fourrée|fourree|fouree|fourré|fourrée|plated|pale silver/i.test(r)) return 'Billon';
  if (/base (ar|silver)/i.test(r))              return 'Billon';
  if (/debased (ar|silver)/i.test(r))           return 'Billon';

  // ── Silver ─────────────────────────────────────────────────────────────────
  // Raw field exact matches: AR, Ag, AG, ag, Ag., аr (Cyrillic), АR (Cyrillic)
  if (/^(ar|ag|аr|АR)\.?$/i.test(r))           return 'Silver';
  if (/silver/i.test(r))                        return 'Silver';
  if (/^ag-sn/i.test(r))                        return 'Silver'; // silver-tin alloy
  if (/^base metal/i.test(rl) && /ar|silver/i.test(n)) return 'Silver';
  if (/^ar\b/i.test(n) && !/^ae\b/i.test(n))   return 'Silver'; // name: "AR dirham"

  // ── Lead ──────────────────────────────────────────────────────────────────
  if (/^(pb|pb\s|pb\.|pb\?|pblead)/i.test(r.replace(/\s/g,''))) return 'Lead';
  if (/\blead\b/i.test(r))                      return 'Lead';

  // ── Bronze / Copper ────────────────────────────────────────────────────────
  if (/^(ae|æ|ае|äe|aae)\.?$/i.test(r))        return 'Bronze'; // AE, Æ, Cyrillic ае
  if (/bronze|copper|brass|kupfer|coper|cooper/i.test(r)) return 'Bronze';
  if (/^cu[\s/.]|^cu$/i.test(r))               return 'Bronze';
  if (/tin[- ]?lead bronze|low[- ]?tin bronze/i.test(r)) return 'Bronze';
  if (/yellow bronze|cast ae|cu-brass/i.test(rl)) return 'Bronze';
  if (/^ae\b/i.test(n))                         return 'Bronze'; // name: "AE fals"

  // ── Keep as-is if already a canonical value ───────────────────────────────
  if (['Gold','Silver','Bronze','Copper','Billon','Lead','Brass',
       'Nickel','Steel','Aluminium','Iron','Tin'].includes(r)) return r;

  // ── Fallback: return normalised raw or empty ──────────────────────────────
  return r;
}

// ── Denomination extraction ────────────────────────────────────────────────────
function getDenomination(name, metal) {
  const n = (name || '').toLowerCase();
  const m = (metal || '').toLowerCase();

  // Gold coin families
  if (/d[ií]n[aá]r|dinar/i.test(n))                    return 'Dinar';
  if (/ashrafi|sultani/i.test(n))                        return 'Dinar'; // gold coin types
  if (/^av\b/i.test(n))                                  return 'Dinar';

  // Silver coin families
  if (/dirham|dirhm|dirhem|drachm|danik/i.test(n))      return 'Dirham';
  if (/^ar\b/i.test(n))                                  return 'Dirham';

  // Copper / base metal
  if (/\bfals\b|\bfils\b|\bfels\b|\bfalus\b/i.test(n)) return 'Fals/Fils';
  if (/^ae\b/i.test(n))                                  return 'Fals/Fils';

  // Other denominations
  if (/\bpara\b/i.test(n))                               return 'Para';
  if (/qirsh|piastre/i.test(n))                          return 'Qirsh';
  if (/\briyal\b|\brial\b/i.test(n))                     return 'Riyal';

  // Fall back to metal when name gives no clues
  if (/^av|^gold/i.test(m))                             return 'Dinar';
  if (/^ar$|^ag|^silver/i.test(m))                      return 'Dirham';
  if (/^ae|^bronze|^copper|^brass/i.test(m))            return 'Fals/Fils';
  if (/^billon/i.test(m))                               return 'Dirham'; // billon dirham
  if (/^lead|^pb/i.test(m))                             return 'Fals/Fils'; // lead tokens

  return null;
}

// ── coin_type_tag ─────────────────────────────────────────────────────────────
function getCoinTypeTag(name, denom, metal, yce) {
  const n = (name || '').toLowerCase();

  // Specific named types (highest priority)
  if (name.includes('Arab-Byzantine'))  return 'Arab-Byzantine';
  if (name.includes('Arab-Sasanian'))   return 'Arab-Sasanian';
  if (name.includes('Pseudo-Byzantine') || name.includes('pseudo-byzantine')) return 'Arab-Byzantine';
  if (name.includes('Standing Caliph')) return 'Standing Caliph';
  if (/anonymous/i.test(n))            return 'Anonymous';
  if (/fractional|½|1\/2|quarter/i.test(n)) return 'Fractional';

  // Denomination + era based
  const year = parseInt(yce || '9999');
  if (denom === 'Dirham' && year < 750)  return 'Early Dirham';
  if (denom === 'Dinar')                 return 'Dinar';
  if (denom === 'Dirham')                return 'Dirham';
  if (denom === 'Fals/Fils')             return 'Fals/Fils';
  if (denom === 'Para')                  return 'Para';
  if (denom === 'Qirsh')                 return 'Qirsh';
  if (denom === 'Riyal')                 return 'Riyal';

  return 'Other';
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║         enrich-is-quality.js — IS data quality fix       ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);

  const COINS_FILE = path.resolve(__dirname, '../src/data/coins.json');
  console.log('Loading coins.json…');
  const coins = JSON.parse(fs.readFileSync(COINS_FILE, 'utf8'));
  const isCoins = coins.filter(c => c.cc === 'IS');
  console.log(`  ${isCoins.length.toLocaleString()} IS coins\n`);

  // ── Apply enrichment ────────────────────────────────────────────────────────
  const denomCounts = {};
  const tagCounts   = {};
  const metalBefore = {};
  const metalAfter  = {};

  for (const coin of isCoins) {
    // 1. Normalise metal
    const oldMetal = coin.metal || '';
    const newMetal = normaliseMetal(oldMetal, coin.name);
    metalBefore[oldMetal] = (metalBefore[oldMetal] || 0) + 1;
    metalAfter[newMetal]  = (metalAfter[newMetal]  || 0) + 1;
    coin.metal = newMetal;

    // 2. Extract denomination (using new metal)
    const denom = getDenomination(coin.name, coin.metal);
    coin.denomination = denom;
    denomCounts[denom || '(null)'] = (denomCounts[denom || '(null)'] || 0) + 1;

    // 3. coin_type_tag
    const tag = getCoinTypeTag(coin.name, denom, coin.metal, coin.yce);
    coin.coin_type_tag = tag;
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  }

  // ── Print results ───────────────────────────────────────────────────────────
  console.log('── Denomination counts ─────────────────────────────────────');
  Object.entries(denomCounts).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => {
    console.log(`  ${k.padEnd(18)} ${String(v).padStart(7)}`);
  });

  console.log('\n── coin_type_tag counts ────────────────────────────────────');
  Object.entries(tagCounts).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => {
    console.log(`  ${k.padEnd(22)} ${String(v).padStart(7)}`);
  });

  console.log('\n── Metal normalisation (top changes) ───────────────────────');
  const changed = Object.entries(metalBefore)
    .filter(([k]) => {
      // find what it mapped to by checking after
      return !['Gold','Silver','Bronze','Billon','Lead','Copper','Brass',
               'Nickel','Steel','Aluminium','Iron','Tin'].includes(k);
    })
    .sort((a,b) => b[1]-a[1]);
  changed.forEach(([k,v]) => console.log(`  ${String(v).padStart(5)}  ${k || '(empty)'} → (normalised)`));

  if (DRY_RUN) {
    console.log('\nDry run complete — coins.json NOT written.\n');
    return;
  }

  // ── Write coins.json ────────────────────────────────────────────────────────
  console.log('\nWriting coins.json…');
  fs.writeFileSync(COINS_FILE, JSON.stringify(coins), 'utf8');
  console.log('  Done.\n');

  // ── Supabase sync ───────────────────────────────────────────────────────────
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('⚠  Missing Supabase env vars — skipping DB sync.');
    return;
  }

  const HEADERS = {
    'Content-Type':  'application/json',
    'apikey':        SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Prefer':        'resolution=merge-duplicates',
  };

  const rows = isCoins.map(c => ({
    id:            c.id,
    denomination:  c.denomination  || null,
    metal:         c.metal         || '',
    coin_type_tag: c.coin_type_tag || null,
  }));

  console.log(`Syncing ${rows.length.toLocaleString()} IS coins to Supabase…`);
  const batches = Math.ceil(rows.length / BATCH_SIZE);
  let done = 0, failed = 0;

  for (let b = 0; b < batches; b++) {
    const batch = rows.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/coins`, {
        method: 'POST', headers: HEADERS, body: JSON.stringify(batch),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`);
      }
      done += batch.length;
      process.stdout.write(`\r  Batch ${b+1}/${batches} — ${done.toLocaleString()}/${rows.length.toLocaleString()} (${Math.round(done/rows.length*100)}%)  `);
    } catch (err) {
      failed += batch.length;
      console.error(`\n  ✗ Batch ${b+1} failed: ${err.message}`);
      if (/401|403/.test(err.message)) { console.error('  Fatal auth error.'); break; }
    }
    if (b < batches - 1) await new Promise(r => setTimeout(r, 120));
  }
  process.stdout.write('\n');

  // ── Verify ──────────────────────────────────────────────────────────────────
  const verify = async (field) => {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/coins?select=${field}&${field}=not.is.null&${field}=not.eq.&cc=eq.IS&limit=1`,
      { headers: { ...HEADERS, 'Prefer': 'count=exact' } }
    );
    return res.headers.get('content-range')?.split('/')[1] ?? '?';
  };

  const [dCount, mCount, tCount] = await Promise.all([
    verify('denomination'), verify('metal'), verify('coin_type_tag'),
  ]);

  console.log('\n── Supabase verification ───────────────────────────────────');
  console.log(`  denomination populated  : ${dCount}`);
  console.log(`  metal non-empty         : ${mCount}`);
  console.log(`  coin_type_tag populated : ${tCount}`);
  console.log(`  failed batches          : ${failed}`);

  if (failed === 0) {
    console.log(`\n  ✅ Complete — ${done.toLocaleString()} IS coins updated in Supabase.`);
  }
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
