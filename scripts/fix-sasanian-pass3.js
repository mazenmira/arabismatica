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
    try { const msg = JSON.parse(t); console.error(`  ✗ ${label}: ${msg.code} — ${msg.message}`); }
    catch { console.error(`  ✗ ${label}: HTTP ${r.status}`); }
    return 0;
  }
  const cr = r.headers.get('content-range') || '';
  const cnt = cr.split('/')[1] || '?';
  console.log(`  ✓ ${label}: ${cnt} rows`);
  return parseInt(cnt)||0;
}

async function distinctSS(col) {
  const vals = {};
  let offset = 0;
  for (;;) {
    const r = await fetch(
      `${BASE}/rest/v1/coins?cc=eq.SS&select=${col}&limit=1000&offset=${offset}`,
      { headers: { 'apikey':KEY,'Authorization':'Bearer '+KEY } }
    );
    const d = await r.json();
    if (!d.length) break;
    for (const row of d) {
      const v = row[col] ?? '(null)';
      vals[v] = (vals[v]||0)+1;
    }
    if (d.length < 1000) break;
    offset += 1000;
  }
  return Object.entries(vals).sort((a,b)=>b[1]-a[1]);
}

async function main() {
  let total = 0;

  // ════════════════════════════════════════════════════════
  // CRITICAL FIX: Khosrow II mis-classified as Khosrow I
  // The `ilike.*Khosrow I*` filter in pass 2 caught "Khosrow II"
  // because "Khosrow II" contains "Khosrow I" as substring.
  // Fix: any coin currently ruler='Khosrow I' whose name contains
  // "Khusru II" or "Khosrow II" → restore to Khosrow II
  // ════════════════════════════════════════════════════════
  console.log('\n══ CRITICAL: Restore Khosrow II ═════════════════════');
  total += await patch(
    'cc=eq.SS&ruler=eq.Khosrow I&name=ilike.*Khusru II*',
    { ruler: 'Khosrow II', ruler_ar: 'خسرو الثاني' },
    'name~Khusru II → Khosrow II'
  );
  total += await patch(
    'cc=eq.SS&ruler=eq.Khosrow I&name=ilike.*Khosrow II*',
    { ruler: 'Khosrow II', ruler_ar: 'خسرو الثاني' },
    'name~Khosrow II → Khosrow II'
  );
  total += await patch(
    'cc=eq.SS&ruler=eq.Khosrow I&name=ilike.*Chosroes II*',
    { ruler: 'Khosrow II', ruler_ar: 'خسرو الثاني' },
    'name~Chosroes II → Khosrow II'
  );

  // ════════════════════════════════════════════════════════
  // RULERS — remaining standardisations and cleanup
  // ════════════════════════════════════════════════════════
  console.log('\n══ RULERS pass 3 ════════════════════════════════════');

  // Bahram I (not caught by Varhran*I* filter due to negations)
  total += await patch(
    'cc=eq.SS&ruler=ilike.*Varhran*I*&ruler=not.ilike.*II*&ruler=not.ilike.*III*&ruler=not.ilike.*IV*&ruler=not.ilike.*V*',
    { ruler: 'Bahram I', ruler_ar: 'بهرام الأول' },
    'Bahram I'
  );
  total += await patch(
    'cc=eq.SS&ruler=ilike.*Bahram I*&ruler=not.ilike.*II*&ruler=not.ilike.*III*&ruler=not.ilike.*IV*&ruler=not.ilike.*V*&ruler=not.eq.Bahram I',
    { ruler: 'Bahram I', ruler_ar: 'بهرام الأول' },
    'Bahram I variants'
  );

  // Hormizd V
  total += await patch(
    'cc=eq.SS&ruler=ilike.*Hormizd V*&ruler=not.eq.Hormizd V',
    { ruler: 'Hormizd V', ruler_ar: 'هرمز الخامس' },
    'Hormizd V'
  );
  total += await patch(
    'cc=eq.SS&ruler=ilike.*Hormizd 5*',
    { ruler: 'Hormizd V', ruler_ar: 'هرمز الخامس' },
    'Hormizd V (5)'
  );

  // Peroz I — catch more variants
  total += await patch(
    'cc=eq.SS&ruler=ilike.*Peroz*&ruler=not.eq.Peroz I',
    { ruler: 'Peroz I', ruler_ar: 'فيروز الأول' },
    'Peroz variants'
  );
  total += await patch(
    'cc=eq.SS&ruler=ilike.*Firuz*',
    { ruler: 'Peroz I', ruler_ar: 'فيروز الأول' },
    'Firuz → Peroz I'
  );

  // Yazdegerd III
  total += await patch(
    'cc=eq.SS&ruler=ilike.*Yazdegird III*',
    { ruler: 'Yazdegerd III', ruler_ar: 'يزدجرد الثالث' },
    'Yazdegerd III'
  );
  total += await patch(
    'cc=eq.SS&ruler=ilike.*Yazdgird III*',
    { ruler: 'Yazdegerd III', ruler_ar: 'يزدجرد الثالث' },
    'Yazdgird III'
  );

  // Shapur II (catch any remaining "Shapur the Great" references)
  total += await patch(
    'cc=eq.SS&ruler=ilike.*Shapur II*&ruler=not.eq.Shapur II',
    { ruler: 'Shapur II', ruler_ar: 'سابور الثاني' },
    'Shapur II variants'
  );

  // Clear remaining junk ruler values → '' (NOT NULL, so must use empty string)
  const junkRulers3 = [
    'AR drachm',
    'Base metal',
    '"ZWZWN" and related issues',
    'KL / DL',
    'AV & AR',
    'Bronze / base metal issues',
    'Period of the Western Turks, AD 600-700',
    'Persian Occupation of Syria, 610-630AD',
    'Mintless / mint uncertain',
    'Mintless facing bust types',
    'LAM',
    'Rare issues',
    'Late Sasanian / early Arab-Sasanian',
    'Arab-Sasanian',
    'Post-reform Arab-Sasanian',
    'Imitations',
    'Copper',
    'Potin',
  ];

  for (const junk of junkRulers3) {
    total += await patch(
      `cc=eq.SS&ruler=eq.${encodeURIComponent(junk)}`,
      { ruler: '' },
      `ruler="${junk.slice(0,30)}" → ''`
    );
  }

  // Any remaining ruler that is just uppercase letters (mint abbreviation)
  // We'll handle known remaining ones explicitly:
  const upperAbbrevs = ['AYLAN','AYL','MRT','APH','WLC','LYW','NAL','ALM','AHM','ShY','MY','NM','AS','YZ','GW','BN','AT','PL','NY'];
  for (const a of upperAbbrevs) {
    total += await patch(
      `cc=eq.SS&ruler=eq.${encodeURIComponent(a)}`,
      { ruler: '' },
      `ruler="${a}" → ''`
    );
  }

  // ════════════════════════════════════════════════════════
  // METALS pass 3 — Lead variants with ilike
  // ════════════════════════════════════════════════════════
  console.log('\n══ METALS pass 3 ════════════════════════════════════');

  // Catch all remaining Pb/PB/lead variants with ilike
  // (previous pass used an IN list which failed on special chars)
  total += await patch('cc=eq.SS&metal=ilike.PB*', { metal: 'Lead' }, 'PB* → Lead');
  total += await patch('cc=eq.SS&metal=ilike.Pb*', { metal: 'Lead' }, 'Pb* → Lead');
  total += await patch('cc=eq.SS&metal=ilike.lead*', { metal: 'Lead' }, 'lead* → Lead');
  total += await patch(
    'cc=eq.SS&metal=ilike.*lead*&metal=not.eq.Lead',
    { metal: 'Lead' }, '*lead* → Lead'
  );

  // ════════════════════════════════════════════════════════
  // MINTS pass 3 — Clear remaining junk
  // ════════════════════════════════════════════════════════
  console.log('\n══ MINTS pass 3 ═════════════════════════════════════');

  // '?' in mint field — clearly unknown
  total += await patch('cc=eq.SS&mint=eq.%3F', { mint: '' }, 'mint=? → clear');

  // AYLAN — appears in both mints and rulers, it's actually a mint
  // In Sasanian numismatics, AYLAN = Alān = a Caucasian region
  total += await patch('cc=eq.SS&mint=eq.AYLAN', { mint: 'Aran', mint_ar: 'آران' }, 'AYLAN → Aran');

  // APH — uncertain, leave with descriptive name
  total += await patch('cc=eq.SS&mint=eq.APH', { mint: 'APH (unidentified)', mint_ar: '' }, 'APH → descriptive');

  // WLC — uncertain
  total += await patch('cc=eq.SS&mint=eq.WLC', { mint: 'WLC (unidentified)', mint_ar: '' }, 'WLC → descriptive');

  // NM — 883 coins, major mint. In Sasanian studies NM = Nîm (Nemrud) or
  // more likely "No Mint" / mint uncertain. We label it conservatively.
  total += await patch('cc=eq.SS&mint=eq.NM', { mint: 'NM (unidentified)', mint_ar: '' }, 'NM → descriptive');

  // Clear remaining single-char or pure-number mints
  total += await patch('cc=eq.SS&mint=ilike.%3F%25', { mint: '' }, 'mint starts with ? → clear');

  // ════════════════════════════════════════════════════════
  // FINAL STATE
  // ════════════════════════════════════════════════════════
  console.log('\n══ FINAL: Metals ════════════════════════════════════');
  (await distinctSS('metal')).slice(0,20).forEach(([k,v])=>console.log(`  ${v}\t${k}`));

  console.log('\n══ FINAL: Rulers (top 30) ═══════════════════════════');
  (await distinctSS('ruler')).slice(0,30).forEach(([k,v])=>console.log(`  ${v}\t${k}`));

  console.log('\n══ FINAL: Mints (top 25) ════════════════════════════');
  (await distinctSS('mint')).slice(0,25).forEach(([k,v])=>console.log(`  ${v}\t${k}`));

  console.log(`\n══ PASS 3 TOTAL ROWS UPDATED: ${total} ════════════════`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
