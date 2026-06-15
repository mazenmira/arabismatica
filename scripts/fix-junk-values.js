'use strict';
const fs   = require('fs');
const path = require('path');

function loadEnv() {
  const f = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(f)) {
    for (const l of fs.readFileSync(f,'utf8').split('\n')) {
      const m = l.match(/^([^#=]+)=(.*)/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g,'');
    }
  }
}
loadEnv();

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H    = {
  'apikey': KEY,
  'Authorization': 'Bearer '+KEY,
  'Content-Type': 'application/json',
  'Prefer': 'count=exact,return=minimal',
};

async function patch(filter, body, label) {
  const r = await fetch(`${BASE}/rest/v1/coins?${filter}`, { method:'PATCH', headers: H, body: JSON.stringify(body) });
  const cr = r.headers.get('content-range') || '';
  const cnt = cr.split('/')[1] || '?';
  if (!r.ok) { const t=await r.text(); console.error(`  ✗ ${label}: ${t.slice(0,120)}`); return 0; }
  const n = parseInt(cnt) || 0;
  if (n > 0) console.log(`  ✓ ${label}: ${cnt} rows`);
  return n;
}

async function main() {
  console.log('Fixing junk values (using empty string instead of null — NOT NULL constraint)...\n');

  // mint column is NOT NULL — use '' (empty string) instead of null
  const JUNK_MINTS = ['?', '??', '—', '-', '--', 'unknown', 'Unknown', 'n/a', 'N/A'];
  // ruler column is also NOT NULL — use '' too
  const JUNK_RULERS = ['?', '??', '—', '-', '--', 'unknown', 'Unknown', 'n/a', 'N/A', 'Help ID', 'help ID'];

  console.log('Clearing junk mints → "" (empty string)...');
  let total = 0;
  for (const v of JUNK_MINTS) {
    const n = await patch(
      `mint=eq.${encodeURIComponent(v)}`,
      { mint: '' },
      `mint="${v}" → ""`
    );
    total += n;
  }

  console.log('\nClearing junk rulers → "" ...');
  for (const v of JUNK_RULERS) {
    const n = await patch(
      `ruler=eq.${encodeURIComponent(v)}`,
      { ruler: '' },
      `ruler="${v}" → ""`
    );
    total += n;
  }

  // Also clear Sasanian junk mints that we identified earlier
  // (the exact match ones that the script detected as short codes)
  console.log('\nClearing Sasanian unresolvable mint codes → ""...');
  const SS_JUNK = [
    // Quoted strings
    '"BBA"', '"AS"', '"AHM"', '"HL"', '"AZ"', '"HLY"', '"LYW"', '"SK"',
    '"ST (Istkhr)"', '"ST"', '"KWN BBA"', '"HLYDY"', '"LD"', '"BYSh"',
    '"WYHC"', '"ART"', '"MY"', '"AY"', '"HLM"', '"BHL"', '"Theopolis"',
    '"Nikomedia"', '"Theoupolis (Antioch)"', '"Antioch"', '"THEUP"-"Antioch"',
    '"Nicomedia"', '"Constantinople"', '"CON"', '"ONIKC"', '"ML"', '"GD" (Jay)"',
    '"Kabul"', '"Westen"', '"Balkh"', '"Taxilla"', '"AW"', '"GW"', '"YZ"',
    '"Western"', '"APL"', '"ZWZWN"', '"ZWZWNY""',
    // Pure digits
    '2', '3', '5', '14', '25', '26', '35', '41',
    // Ambiguous/unresolvable short codes not mapped
    'DL', 'AH', 'AL', 'VISP', 'ZL', 'LAM', 'LAN', 'WTH', 'AYL', 'SHY',
    'ZLNG', 'GLM', 'WSY', 'LDY', 'GWM', 'MA', 'GWD', 'HWC', 'BST', 'MLWL',
    'YZD', 'BHL', 'HLM', 'MRWY', 'HA', 'GY', 'GWL', 'H', 'LWDY', 'MYA',
    'AR', 'ND', 'TP', 'WL', 'WYCH', 'STHL', 'AWH', 'AP', 'HY', 'LY', 'RD',
    'HWC',
    // Single quotes
    "'Ctesiphon'",
  ];

  for (const v of SS_JUNK) {
    await patch(
      `cc=eq.SS&mint=eq.${encodeURIComponent(v)}`,
      { mint: '' },
      `SS mint="${v}" → ""`
    );
  }

  console.log(`\nDone. Total rows updated: ${total}`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
