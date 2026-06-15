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

// Run a PATCH update and return affected row count from content-range header
async function patch(filter, body, label) {
  const url = `${BASE}/rest/v1/coins?${filter}`;
  const r = await fetch(url, { method:'PATCH', headers: H, body: JSON.stringify(body) });
  if (!r.ok) {
    const t = await r.text();
    console.error(`  ✗ ${label}: HTTP ${r.status} — ${t.slice(0,200)}`);
    return 0;
  }
  // content-range: 0-N/total or */count
  const cr = r.headers.get('content-range') || '';
  const cnt = cr.split('/')[1] || '?';
  console.log(`  ✓ ${label}: ${cnt} rows`);
  return parseInt(cnt)||0;
}

// Fetch distinct values for a column in cc=SS coins (paginated)
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
      const v = row[col] || '(null)';
      vals[v] = (vals[v]||0)+1;
    }
    if (d.length < 1000) break;
    offset += 1000;
  }
  return Object.entries(vals).sort((a,b)=>b[1]-a[1]);
}

async function main() {
  let totalFixed = 0;

  // ════════════════════════════════════════════════════════
  // METALS — Fix abbreviated metal codes
  // ════════════════════════════════════════════════════════
  console.log('\n══ METALS ══════════════════════════════════════════');

  totalFixed += await patch(
    'cc=eq.SS&metal=in.(AG,Ag,ag,AR,ar)',
    { metal: 'Silver' },
    'AG/AR → Silver'
  );
  totalFixed += await patch(
    'cc=eq.SS&metal=in.(AV,AU,Au,av,au)',
    { metal: 'Gold' },
    'AV/AU → Gold'
  );
  totalFixed += await patch(
    'cc=eq.SS&metal=in.(AE,ae,Æ)',
    { metal: 'Bronze' },
    'AE/Æ → Bronze'
  );
  totalFixed += await patch(
    'cc=eq.SS&metal=in.(BI,Bi,bi)',
    { metal: 'Billon' },
    'BI → Billon'
  );

  // ════════════════════════════════════════════════════════
  // RULERS — Standardise real rulers, clear junk
  // ════════════════════════════════════════════════════════
  console.log('\n══ RULERS ══════════════════════════════════════════');

  // Clean "Khusru II, AD 590-628 ▼" → "Khosrow II"
  // The ▼ arrow and date suffix need to go
  totalFixed += await patch(
    'cc=eq.SS&ruler=ilike.*Khusru II*',
    { ruler: 'Khosrow II', ruler_ar: 'خسرو الثاني' },
    'Khusru II → Khosrow II'
  );
  totalFixed += await patch(
    'cc=eq.SS&ruler=ilike.*Khosrow II*&ruler=not.eq.Khosrow II',
    { ruler: 'Khosrow II', ruler_ar: 'خسرو الثاني' },
    'Khosrow II variants cleanup'
  );

  // Vistahm (Bistam), AD 591-592 → Vistahm
  totalFixed += await patch(
    'cc=eq.SS&ruler=ilike.*Vistahm*',
    { ruler: 'Vistahm', ruler_ar: 'وستهم' },
    'Vistahm cleanup'
  );

  // Clear URLs
  totalFixed += await patch(
    'cc=eq.SS&ruler=ilike.*http*',
    { ruler: null, ruler_ar: null },
    'Clear URL rulers'
  );
  totalFixed += await patch(
    'cc=eq.SS&ruler=ilike.*zeno.ru*',
    { ruler: null, ruler_ar: null },
    'Clear zeno.ru rulers'
  );

  // Clear mint abbreviations wrongly in ruler field.
  // These are 2-5 uppercase letter codes — clearly not ruler names.
  // Pattern: exactly 2-6 chars, all uppercase letters (possibly with ? suffix)
  // We target the specific values we saw in the audit:
  const junkRulers = ['BYSh','ShY','AHM','LYW','NAL','WYHC','AYLAN','AYL','APL','ALM','APH','WLC'];
  for (const jr of junkRulers) {
    totalFixed += await patch(
      `cc=eq.SS&ruler=eq.${encodeURIComponent(jr)}`,
      { ruler: null, ruler_ar: null },
      `Clear ruler="${jr}"`
    );
  }

  // ════════════════════════════════════════════════════════
  // MINTS — Map Sasanian monograms to city names
  // ════════════════════════════════════════════════════════
  console.log('\n══ MINTS ═══════════════════════════════════════════');

  // Mapping: [ [filter values (IN list)], 'City name', 'Arabic name' ]
  const mintMap = [
    // Bishapur (Fars province)
    [['BYSh','BYSH','BYSh (Bishapur)'],                     'Bishapur',            'بيشابور'],
    // Jayy = Isfahan area
    [['GD','GD (Jayy)','GD (Jay)'],                         'Jayy',                'جي'],
    // Hamadan
    [['AHM','AHM (Hamadan)','AHM (= Ahmadān = Hamadān)','AHM(?)'], 'Hamadan',     'همدان'],
    // Ray / Rayy
    [['LD','LD (Rayy)','LD (Ray)'],                         'Ray',                 'الري'],
    // Stakhr (Persepolis area)
    [['ST','STH','STHR'],                                   'Stakhr',              'استخر'],
    // Sakastan (Sistan)
    [['SK','SK (Sakastan)'],                                'Sakastan',            'سجستان'],
    // Shiraz
    [['ShY','ShY (Shiraz)'],                                'Shiraz',              'شيراز'],
    // Ardashir-Khwarrah (Fars)
    [['AW','AW (Ardashir-Khwarrah)'],                       'Ardashir-Khwarrah',  'اردشير خوره'],
    // Narmashir / Kirman region
    [['NAL','NAL (Narmashir?, Kirman)'],                    'Narmashir',           'نرماشير'],
    // Darabgird
    [['DA','DA (Darabgird)'],                               'Darabgird',           'دارابگرد'],
    // Amul (Tabaristan)
    [['AM','AM (probably Amul)','AM (Amul)'],               'Amul',                'آمل'],
    // Nishapur / Abarshahr (Khorasan)
    [['APL','APL (Abarshahr)','APL (= Abaršahr)','APL (Abarshahr, = Nishapur)','APL (or PL)','APL(?)','APL = Nishapur','"APL"','APL (Abarshahr)'], 'Nishapur', 'نيسابور'],
    // Armenia
    [['ALM','ALM (Armenia)'],                               'Armenia',             'أرمينيا'],
    // Ahvaz (Khuzestan)
    [['AY','AY?'],                                          'Ahvaz',               'الأهواز'],
    // Gundeshapur (Veh-Andiyok-Shapur)
    [['WH'],                                                'Gundeshapur',         'جنديسابور'],
    // Nihavand
    [['NY'],                                                'Nihavand',            'نهاوند'],
    // Merv (Khorasan)
    [['ML','MLW','MRW','MRV'],                              'Merv',                'مرو'],
    // Ctesiphon
    [['CTH','CTSP'],                                        'Ctesiphon',           'المدائن'],
  ];

  for (const [abbrevs, city, cityAr] of mintMap) {
    // Build IN filter; single values use eq, multiple use in.(...)
    const escaped = abbrevs.map(a => a.replace(/,/g,'%2C'));
    const filter = abbrevs.length === 1
      ? `cc=eq.SS&mint=eq.${encodeURIComponent(abbrevs[0])}`
      : `cc=eq.SS&mint=in.(${abbrevs.map(a=>encodeURIComponent(a)).join(',')})`;
    totalFixed += await patch(filter, { mint: city, mint_ar: cityAr }, `mint → ${city}`);
  }

  // ════════════════════════════════════════════════════════
  // IS / Modern coins audit — check for junk
  // ════════════════════════════════════════════════════════
  console.log('\n══ AUDIT: Islamic ruler junk ════════════════════════');
  {
    const r = await fetch(
      `${BASE}/rest/v1/coins?cc=eq.IS&select=ruler&ruler=not.is.null&limit=1000`,
      { headers: { 'apikey':KEY,'Authorization':'Bearer '+KEY } }
    );
    const d = await r.json();
    const junk = d.filter(row =>
      row.ruler && (
        /https?:/.test(row.ruler) ||
        /^[A-Z]{2,5}$/.test(row.ruler) ||
        row.ruler.length < 4
      )
    );
    if (junk.length) {
      console.log(`  ⚠  ${junk.length} suspicious IS ruler entries:`);
      const c = {};
      for (const j of junk) c[j.ruler]=(c[j.ruler]||0)+1;
      Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,10).forEach(([k,v])=>console.log(`    ${v}\t${k}`));
    } else {
      console.log('  ✓ No junk found in IS ruler field');
    }
  }

  console.log('\n══ AUDIT: Islamic mint junk ═════════════════════════');
  {
    const r = await fetch(
      `${BASE}/rest/v1/coins?cc=eq.IS&select=mint&mint=not.is.null&limit=1000`,
      { headers: { 'apikey':KEY,'Authorization':'Bearer '+KEY } }
    );
    const d = await r.json();
    const junk = d.filter(row =>
      row.mint && (/https?:/.test(row.mint) || /^[A-Z]{2,5}$/.test(row.mint))
    );
    if (junk.length) {
      console.log(`  ⚠  ${junk.length} suspicious IS mint entries:`);
      const c = {};
      for (const j of junk) c[j.mint]=(c[j.mint]||0)+1;
      Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,10).forEach(([k,v])=>console.log(`    ${v}\t${k}`));
    } else {
      console.log('  ✓ No junk found in IS mint field');
    }
  }

  console.log('\n══ AUDIT: Modern coins metal ════════════════════════');
  {
    const r = await fetch(
      `${BASE}/rest/v1/coins?cc=not.eq.IS&cc=not.eq.SS&select=metal&limit=1000`,
      { headers: { 'apikey':KEY,'Authorization':'Bearer '+KEY } }
    );
    const d = await r.json();
    const c = {};
    for (const row of d) c[row.metal||'(null)']=(c[row.metal||'(null)']||0)+1;
    Object.entries(c).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(`  ${v}\t${k}`));
  }

  // ════════════════════════════════════════════════════════
  // FINAL STATE — show Sasanian data after fixes
  // ════════════════════════════════════════════════════════
  console.log('\n══ FINAL: Sasanian metals ═══════════════════════════');
  (await distinctSS('metal')).forEach(([k,v])=>console.log(`  ${v}\t${k}`));

  console.log('\n══ FINAL: Sasanian rulers (top 20) ══════════════════');
  (await distinctSS('ruler')).slice(0,20).forEach(([k,v])=>console.log(`  ${v}\t${k}`));

  console.log('\n══ FINAL: Sasanian mints (top 20) ═══════════════════');
  (await distinctSS('mint')).slice(0,20).forEach(([k,v])=>console.log(`  ${v}\t${k}`));

  console.log(`\n══ TOTAL ROWS UPDATED: ${totalFixed} ══════════════════════`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
