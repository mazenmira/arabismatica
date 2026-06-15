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
  const url = `${BASE}/rest/v1/coins?${filter}`;
  const r = await fetch(url, { method:'PATCH', headers: H, body: JSON.stringify(body) });
  if (!r.ok) {
    const t = await r.text();
    try { const msg = JSON.parse(t); console.error(`  ✗ ${label}: ${msg.code}`); }
    catch { console.error(`  ✗ ${label}: HTTP ${r.status}`); }
    return 0;
  }
  const cr = r.headers.get('content-range') || '';
  const cnt = cr.split('/')[1] || '?';
  console.log(`  ✓ ${label}: ${cnt} rows`);
  return parseInt(cnt)||0;
}

async function main() {
  let total = 0;

  console.log('\n══ RULERS: real rulers still in old format ══════════');
  // Azarmidukht — real Sasanian queen
  total += await patch(
    'cc=eq.SS&ruler=ilike.*Azarmidukht*',
    { ruler: 'Azarmidukht', ruler_ar: 'آزرميدخت' },
    'Azarmidukht'
  );
  // Boran variants
  total += await patch(
    'cc=eq.SS&ruler=ilike.*Boran*&ruler=not.eq.Boran',
    { ruler: 'Boran', ruler_ar: 'بوران' },
    'Boran variants'
  );
  // Peroz I catch-all (already 6 correct, catch any with dates)
  total += await patch(
    'cc=eq.SS&ruler=ilike.*Peroz I*&ruler=not.eq.Peroz I',
    { ruler: 'Peroz I', ruler_ar: 'فيروز الأول' },
    'Peroz I variants'
  );

  console.log('\n══ RULERS: clear remaining mint abbreviations/junk ══');
  const junk5 = [
    'HWC','GLM','BHL','GW (DMY)','GNCKL','HLYDY','SML','YD (GD?)','LHW',
    'MLWWNALT','HLM','DYWAS','BST','MLWL','BYST','YZD',
    'Countermarks','Islamic, AD 650-700',
    'Without mintsignature B ("Taxila") or Kidarite imitation',
    'Persian Occupation of Egypt, 618-628AD',
    'AR hemidrachm','Hephtalite, AD 450-600',
    'Unusual / enigmatic mint signatures',
    'Bust right, with diadem and Parthian-style tiara decorated with eagle',
    'AV double dinar, dinar and fractional dinar (⅕ dinar?)',
    'AR 1/6 drachm/obol',
    'Dated and inscribed tetradrachms in Greek',
    'hoard','hoard of Dr. Lanz',
    'Bust right with diadem and Parthian-style tiara with mural decoration',
    'AV dinar and fractionai dinar (1/5 dinar?)',
    'Hormizd, usurper, AD 593, or Caucasian imitations',
    'GW (DMY)',
  ];
  for (const junk of junk5) {
    total += await patch(
      `cc=eq.SS&ruler=eq.${encodeURIComponent(junk)}`,
      { ruler: '' },
      `"${junk.slice(0,40)}" → ''`
    );
  }

  console.log('\n══ MINTS: remaining known abbreviations ══════════════');
  // KL = Kirman (Kirmanshah region)
  total += await patch('cc=eq.SS&mint=eq.KL', { mint: 'Kirman', mint_ar: 'كرمان' }, 'KL → Kirman');
  // LAM = unclear; probably Lambakin or another mint. Leave as-is.
  // AH — 41 rows. Could be Ahvaz (AY) variant. Very uncertain. Leave.

  console.log(`\n══ PASS 5 TOTAL: ${total} ════════════════════════════`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
