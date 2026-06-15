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

async function patch(ruler, ruler_ar) {
  const r = await fetch(
    `${BASE}/rest/v1/coins?cc=eq.SS&ruler=eq.${encodeURIComponent(ruler)}`,
    { method:'PATCH', headers: H, body: JSON.stringify({ ruler_ar }) }
  );
  const cr = r.headers.get('content-range') || '';
  const cnt = cr.split('/')[1] || '?';
  if (!r.ok) { const t=await r.text(); console.error(`  ✗ ${ruler}: ${t.slice(0,100)}`); return; }
  console.log(`  ✓ ${ruler} → ${ruler_ar}: ${cnt} rows`);
}

async function main() {
  const RULERS = [
    ['Khosrow II',   'خسرو الثاني'],
    ['Khosrow I',    'خسرو الأول'],
    ['Kavad I',      'قباد الأول'],
    ['Bahram V',     'بهرام الخامس'],
    ['Hormizd IV',   'هرمز الرابع'],
    ['Yazdegerd I',  'يزدجرد الأول'],
    ['Bahram II',    'بهرام الثاني'],
    ['Yazdegerd II', 'يزدجرد الثاني'],
    ['Narseh',       'نرسي'],
    ['Boran',        'بوران'],
    ['Shapur II',    'سابور الثاني'],
    ['Bahram I',     'بهرام الأول'],
    ['Ardashir III', 'اردشير الثالث'],
    ['Hormizd II',   'هرمز الثاني'],
    ['Balash',       'بلاش'],
    ['Ardashir II',  'اردشير الثاني'],
    ['Hormizd I',    'هرمز الأول'],
    ['Jamasp',       'جاماسب'],
    ['Hormizd V',    'هرمز الخامس'],
    ['Vistahm',      'وستهم'],
    ['Azarmidukht',  'آزرميدخت'],
    ['Peroz I',      'فيروز الأول'],
    ['Ardashir I',   'اردشير الأول'],
    ['Shapur I',     'سابور الأول'],
    ['Shapur III',   'سابور الثالث'],
    ['Yazdegerd III','يزدجرد الثالث'],
  ];

  console.log('Setting ruler_ar for all Sasanian rulers...\n');
  for (const [en, ar] of RULERS) {
    await patch(en, ar);
  }
  console.log('\nDone.');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
