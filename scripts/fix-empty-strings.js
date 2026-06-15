'use strict';
const fs   = require('fs');
const path = require('path');

function loadEnv() {
  const f = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(f)) {
    for (const l of fs.readFileSync(f, 'utf8').split('\n')) {
      const m = l.match(/^([^#=]+)=(.*)/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}
loadEnv();

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H    = {
  'apikey':        KEY,
  'Authorization': 'Bearer ' + KEY,
  'Content-Type':  'application/json',
  'Prefer':        'count=exact,return=minimal',
};

async function patch(filter, body, label) {
  const r = await fetch(`${BASE}/rest/v1/coins?${filter}`, {
    method: 'PATCH', headers: H, body: JSON.stringify(body),
  });
  const cr  = r.headers.get('content-range') || '';
  const cnt = cr.split('/')[1] || '?';
  if (!r.ok) { const t = await r.text(); console.error(`  ✗ ${label}: ${t.slice(0, 120)}`); return 0; }
  const n = parseInt(cnt) || 0;
  console.log(`  ✓ ${label}: ${n} rows`);
  return n;
}

async function getAll(select, filter) {
  let all = [], offset = 0;
  while (true) {
    const r = await fetch(
      `${BASE}/rest/v1/coins?select=${select}&${filter}&limit=1000&offset=${offset}`,
      { headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY } }
    );
    const d = await r.json();
    if (!Array.isArray(d) || d.length === 0) break;
    all = all.concat(d);
    if (d.length < 1000) break;
    offset += 1000;
  }
  return all;
}

// ── TASK 1: Set '' → NULL for mint, mint_ar, ruler, ruler_ar ─────────────────
async function task1() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('TASK 1 — Convert empty strings → NULL');
  console.log('═══════════════════════════════════════════════════\n');

  // Note: ruler column is NOT NULL — we can't set it to NULL.
  // Supabase will reject NULL on NOT NULL columns.
  // We'll try and report the error gracefully.

  const OPS = [
    { filter: 'mint=eq.',     body: { mint:     null }, label: 'mint="" → NULL' },
    { filter: 'mint_ar=eq.',  body: { mint_ar:  null }, label: 'mint_ar="" → NULL' },
    { filter: 'ruler=eq.',    body: { ruler:    null }, label: 'ruler="" → NULL (NOT NULL col — may fail)' },
    { filter: 'ruler_ar=eq.', body: { ruler_ar: null }, label: 'ruler_ar="" → NULL' },
  ];

  let total = 0;
  for (const op of OPS) {
    const n = await patch(op.filter, op.body, op.label);
    total += n;
  }
  console.log(`\nTask 1 total: ${total} rows updated`);
}

// ── TASK 2: Audit Sasanian mints and clear remaining junk ────────────────────
async function task2() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('TASK 2 — Verify Sasanian mints');
  console.log('═══════════════════════════════════════════════════\n');

  const rows = await getAll('mint,mint_ar', 'cc=eq.SS&mint=not.is.null&mint=neq.');
  const counts = {};
  const arMap  = {};
  for (const r of rows) {
    counts[r.mint] = (counts[r.mint] || 0) + 1;
    if (r.mint_ar) arMap[r.mint] = r.mint_ar;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  console.log(`mint | mint_ar | count`);
  console.log(`${'─'.repeat(60)}`);
  for (const [m, c] of sorted) {
    console.log(`${String(c).padStart(5)} | ${(arMap[m] || '').padEnd(20)} | ${m}`);
  }

  // Identify still-junk entries: 2-4 ALL-CAPS letters with no spaces,
  // quoted strings, or values that are clearly not city names
  const JUNK_PATTERN = /^(?:[A-Z]{2,4}|"[^"]*"|'[^']*'|\d+)$/;
  const junk = sorted
    .filter(([m]) => JUNK_PATTERN.test(m.trim()))
    .map(([m]) => m);

  if (junk.length > 0) {
    console.log(`\nClearing ${junk.length} remaining junk mint values → NULL:`);
    for (const v of junk) {
      await patch(`cc=eq.SS&mint=eq.${encodeURIComponent(v)}`, { mint: null }, `"${v}" → NULL`);
    }
  } else {
    console.log('\nNo remaining junk mints found — all clean!');
  }
}

async function main() {
  await task1();
  await task2();
  console.log('\n✅ Done.');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
