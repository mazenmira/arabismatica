'use strict';
/**
 * audit-dyn.js
 * Audits the dyn field across coins.json — mirrors the Supabase data exactly.
 */
const fs   = require('fs');
const path = require('path');

const coins = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/data/coins.json'), 'utf8'));
console.log(`Loaded ${coins.length.toLocaleString()} coins\n`);

// ── Arab-state country codes (modern nations) — excluded from query 1 ──────────
const MODERN_CC = new Set([
  'EG','SA','JO','IQ','SY','LB','PS','KW','QA','AE','BH','OM',
  'YE','LY','TN','DZ','MA','SD','SO','DJ','KM','MR','ER','TR'
]);

// ── Query 1: dyn counts for non-modern-Arab coins ─────────────────────────────
console.log('══════════════════════════════════════════════════════════════════');
console.log('QUERY 1: dyn counts WHERE cc NOT IN (modern Arab states)');
console.log('══════════════════════════════════════════════════════════════════');
const q1 = {};
for (const c of coins) {
  if (MODERN_CC.has(c.cc)) continue;
  const key = c.dyn || '(empty)';
  q1[key] = (q1[key] || 0) + 1;
}
const q1sorted = Object.entries(q1).sort((a,b) => b[1] - a[1]);
console.log(`${'dyn'.padEnd(45)} total`);
console.log('─'.repeat(55));
for (const [dyn, total] of q1sorted) {
  console.log(`${dyn.padEnd(45)} ${total.toLocaleString()}`);
}
console.log(`\nTotal distinct dyn values: ${q1sorted.length}\n`);

// ── Query 2: dyn IS NULL / empty / 'Islamic' breakdown by cc ─────────────────
console.log('══════════════════════════════════════════════════════════════════');
console.log('QUERY 2: coins where dyn is null, empty, or "Islamic" — by cc');
console.log('══════════════════════════════════════════════════════════════════');
const q2 = {};
for (const c of coins) {
  const d = c.dyn ?? '';
  if (d !== '' && d !== 'Islamic') continue;
  const key = `${d || '(empty)'} | cc=${c.cc}`;
  q2[key] = (q2[key] || 0) + 1;
}
const q2sorted = Object.entries(q2).sort((a,b) => b[1] - a[1]).slice(0, 30);
console.log(`${'dyn | cc'.padEnd(40)} total`);
console.log('─'.repeat(50));
for (const [key, total] of q2sorted) {
  console.log(`${key.padEnd(40)} ${total.toLocaleString()}`);
}

// ── Query 3: sample rows for suspicious dyn values ───────────────────────────
console.log('\n══════════════════════════════════════════════════════════════════');
console.log('QUERY 3: 3 sample rows for generic/suspicious dyn values');
console.log('══════════════════════════════════════════════════════════════════');

const SUSPICIOUS = ['Islamic', '', 'Unknown', null, 'Other', 'Medieval'];
for (const dyn of SUSPICIOUS) {
  const matches = coins.filter(c => (c.dyn ?? '') === (dyn ?? ''));
  if (matches.length === 0) continue;
  console.log(`\n▶ dyn="${dyn ?? 'null'}"  (${matches.length.toLocaleString()} total)`);
  matches.slice(0, 3).forEach((c, i) => {
    console.log(`  [${i+1}] id=${c.id}  cc=${c.cc}  name="${(c.name||'').slice(0,70)}"`);
    console.log(`       yce=${c.yce}  yah=${c.yah}  mint="${c.mint||''}"  ruler="${c.ruler||''}"`);
  });
}

// ── Bonus: full dyn inventory for cc='IS' ────────────────────────────────────
console.log('\n══════════════════════════════════════════════════════════════════');
console.log('BONUS: All dyn values for cc=IS (Islamic coins)');
console.log('══════════════════════════════════════════════════════════════════');
const isMap = {};
for (const c of coins) {
  if (c.cc !== 'IS') continue;
  const key = c.dyn || '(empty)';
  isMap[key] = (isMap[key] || 0) + 1;
}
const isSorted = Object.entries(isMap).sort((a,b) => b[1] - a[1]);
console.log(`${'dyn'.padEnd(45)} total`);
console.log('─'.repeat(55));
for (const [dyn, total] of isSorted) {
  console.log(`${dyn.padEnd(45)} ${total.toLocaleString()}`);
}
console.log(`\nTotal IS coins: ${Object.values(isMap).reduce((a,b)=>a+b,0).toLocaleString()}`);
console.log(`Distinct dyn values in IS: ${isSorted.length}`);
