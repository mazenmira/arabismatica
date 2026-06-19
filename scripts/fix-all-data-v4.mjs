/**
 * fix-all-data-v4.mjs — Tasks 1-4 data cleanup
 * Run: node --env-file=.env.local scripts/fix-all-data-v4.mjs
 *
 * Task 1: Islamic mint deduplication (abbreviations, [IS] prefix, brackets)
 * Task 2: Islamic ruler final cleanup (AH-date rulers, coin-description rulers, name unification)
 * Task 3: Islamic mint Arabic translations (40 pairs)
 * Task 4: Sasanian mint Arabic names (32 pairs)
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY. Use --env-file=.env.local');
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
};

// ── helpers ────────────────────────────────────────────────────────────────

async function fetchAll(table, filter) {
  const PAGE = 1000;
  let offset = 0;
  let all = [];
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?${filter}&limit=${PAGE}&offset=${offset}`;
    const r = await fetch(url, { headers: { ...headers, Prefer: 'count=exact' } });
    const data = await r.json();
    if (!Array.isArray(data) || data.length === 0) break;
    all = all.concat(data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  return all;
}

async function patchByExact(table, field, oldVal, newVal) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${field}=eq.${encodeURIComponent(oldVal)}`;
  const r = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ [field]: newVal }),
  });
  if (!r.ok) {
    const err = await r.text();
    console.warn(`  PATCH failed for ${oldVal} → ${newVal}: ${err}`);
  }
}

async function patchByIn(table, field, values, update) {
  if (values.length === 0) return;
  const url = `${SUPABASE_URL}/rest/v1/${table}?${field}=in.(${values.map(v => `"${v.replace(/"/g,'""')}"`).join(',')})`;
  const r = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(update),
  });
  if (!r.ok) {
    const err = await r.text();
    console.warn(`  PATCH IN failed: ${err}`);
  }
}

// ── TASK 1: Islamic mint deduplication ────────────────────────────────────

async function task1_islamicMints() {
  console.log('\n=== TASK 1: Islamic mint deduplication ===');

  const coins = await fetchAll('coins', 'cc=eq.IS&select=id,mint');
  console.log(`  Fetched ${coins.length} Islamic coins`);

  const cleared = [];    // set to ''
  const isPrefixed = [];  // [IS] Dimashq → Dimashq
  const bracketed = {};   // {oldMint: newMint}

  const abbreviationRe = /^[A-Z]{2,6}\??$/;
  const isPrefixRe = /^\[IS\]\s*/;
  const bracketMintRe = /^\[(.+)\]$/;

  const seen = new Set();

  for (const c of coins) {
    const m = c.mint || '';
    if (!m || seen.has(m)) continue;
    seen.add(m);

    if (abbreviationRe.test(m)) {
      cleared.push(m);
    } else if (isPrefixRe.test(m)) {
      isPrefixed.push(m);
    } else {
      const bm = bracketMintRe.exec(m);
      if (bm) bracketed[m] = bm[1];
    }
  }

  console.log(`  Abbreviation mints to clear: ${cleared.length}`);
  for (const m of cleared) {
    await patchByExact('coins', 'mint', m, '');
    process.stdout.write('.');
  }

  console.log(`\n  [IS]-prefixed mints to fix: ${isPrefixed.length}`);
  for (const m of isPrefixed) {
    const fixed = m.replace(isPrefixRe, '');
    await patchByExact('coins', 'mint', m, fixed);
    process.stdout.write('.');
  }

  const bracketEntries = Object.entries(bracketed);
  console.log(`\n  Bracket mints to fix: ${bracketEntries.length}`);
  for (const [old, fixed] of bracketEntries) {
    await patchByExact('coins', 'mint', old, fixed);
    process.stdout.write('.');
  }

  console.log('\n  Task 1 done.');
}

// ── TASK 2: Islamic ruler final cleanup ───────────────────────────────────

async function task2_islamicRulers() {
  console.log('\n=== TASK 2: Islamic ruler final cleanup ===');

  const coins = await fetchAll('coins', 'cc=eq.IS&select=id,ruler');
  console.log(`  Fetched ${coins.length} Islamic coins`);

  // Patterns that indicate these are descriptions, not ruler names
  const clearRulerRe = [
    /^\d+\s*(AH|ah|هـ)$/,               // "123 AH" or "45 هـ"
    /^\d+[\-–]\d+\s*(AH|ah|هـ)$/,       // "123-456 AH"
    /^Wasit\s+\d+\s*(AH)?$/i,           // "Wasit 123 AH"
    /^[A-Z]{2,6}\s+\d+\s*(AH)?$/,       // "BAS 123 AH"
    /^[A-Za-z ]+\s+\d{2,3}\s*(AH)?$/,  // "Some City 123 AH" — broad
    /^\d+$/,                             // just a number
  ];

  // Name unification map
  const unifyMap = [
    // al-Walid I variants
    { from: ['al-Walid', 'Al-Walid', 'Walid I', 'Al Walid I', 'Al-Walid I', 'al-Walid ibn Abd al-Malik'], to: 'al-Walid I' },
    // Hisham variants
    { from: ['Hisham', 'Hishām', 'Hisham ibn Abd al-Malik'], to: 'Hisham ibn Abd al-Malik' },
    // Harun al-Rashid variants
    { from: ['Harun', 'Harun al-Rashid', 'Hārūn al-Rashīd', 'Harun ar-Rashid', 'Harun Al-Rashid'], to: 'Harun al-Rashid' },
    // al-Mansur variants
    { from: ['Mansur', 'al-Mansour', 'Al-Mansur', 'al Mansur', 'al-Mansūr'], to: 'al-Mansur' },
    // Abd al-Malik
    { from: ['Abd al Malik', 'Abd al-Malik', 'Abd al-Malik ibn Marwan', "'Abd al-Malik"], to: 'Abd al-Malik ibn Marwan' },
  ];

  const seen = new Set();
  const toClear = [];
  const toUnify = []; // { oldVal, newVal }

  for (const c of coins) {
    const r = c.ruler || '';
    if (!r || seen.has(r)) continue;
    seen.add(r);

    let shouldClear = false;
    for (const re of clearRulerRe) {
      if (re.test(r.trim())) { shouldClear = true; break; }
    }
    if (shouldClear) { toClear.push(r); continue; }

    for (const u of unifyMap) {
      if (u.from.some(f => f.toLowerCase() === r.toLowerCase()) && r !== u.to) {
        toUnify.push({ oldVal: r, newVal: u.to });
        break;
      }
    }
  }

  console.log(`  Rulers to clear: ${toClear.length}`);
  for (const r of toClear) {
    await patchByExact('coins', 'ruler', r, '');
    process.stdout.write('.');
  }

  console.log(`\n  Rulers to unify: ${toUnify.length}`);
  for (const { oldVal, newVal } of toUnify) {
    console.log(`    "${oldVal}" → "${newVal}"`);
    await patchByExact('coins', 'ruler', oldVal, newVal);
  }

  console.log('\n  Task 2 done.');
}

// ── TASK 3: Islamic mint Arabic translations ──────────────────────────────

async function task3_islamicMintAr() {
  console.log('\n=== TASK 3: Islamic mint Arabic translations ===');

  const pairs = [
    ['Damascus',       'دمشق'],
    ['Dimashq',        'دمشق'],
    ['Aleppo',         'حلب'],
    ['Halab',          'حلب'],
    ['Baghdad',        'بغداد'],
    ['Madīnat al-Salām', 'مدينة السلام'],
    ['Madinat al-Salam', 'مدينة السلام'],
    ['al-Basra',       'البصرة'],
    ['Basra',          'البصرة'],
    ['al-Kufa',        'الكوفة'],
    ['Kufa',           'الكوفة'],
    ['Cairo',          'القاهرة'],
    ['al-Qahira',      'القاهرة'],
    ['Fustat',         'الفسطاط'],
    ['al-Fustat',      'الفسطاط'],
    ['Alexandria',     'الإسكندرية'],
    ['al-Iskandariyya', 'الإسكندرية'],
    ['Nishapur',       'نيسابور'],
    ['Naysabur',       'نيسابور'],
    ['Samarqand',      'سمرقند'],
    ['Bukhara',        'بخارى'],
    ['Merv',           'مرو'],
    ['Marw',           'مرو'],
    ['Herat',          'هراة'],
    ['Zaranj',         'زرنج'],
    ['Sijistan',       'سجستان'],
    ['Shiraz',         'شيراز'],
    ['Isfahan',        'أصفهان'],
    ['Isfahān',        'أصفهان'],
    ['Ardashir Khurra', 'أردشير خره'],
    ['al-Madina',      'المدينة المنورة'],
    ['Medina',         'المدينة المنورة'],
    ['Mecca',          'مكة المكرمة'],
    ['al-Makkah',      'مكة المكرمة'],
    ['Jerusalem',      'القدس'],
    ['al-Quds',        'القدس'],
    ['Wasit',          'واسط'],
    ['Mosul',          'الموصل'],
    ['al-Mawsil',      'الموصل'],
    ['Tiberias',       'طبريا'],
    ['Ramla',          'الرملة'],
    ['Amid',           'آمد'],
    ['Diyarbakir',     'ديار بكر'],
    ['Tripoli',        'طرابلس'],
    ['Tarabulus',      'طرابلس'],
    ['Tunis',          'تونس'],
    ['al-Qairawan',    'القيروان'],
    ['Sijilmasa',      'سجلماسة'],
    ['Cordoba',        'قرطبة'],
    ['Qurtuba',        'قرطبة'],
  ];

  console.log(`  Updating ${pairs.length} mint_ar mappings for IS coins...`);
  let count = 0;
  for (const [mint, mint_ar] of pairs) {
    const url = `${SUPABASE_URL}/rest/v1/coins?cc=eq.IS&mint=eq.${encodeURIComponent(mint)}`;
    const r = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ mint_ar }),
    });
    if (r.ok) { count++; process.stdout.write('.'); }
    else { console.warn(`  Failed: ${mint} → ${mint_ar}`); }
  }
  console.log(`\n  Updated ${count}/${pairs.length} mint_ar values. Task 3 done.`);
}

// ── TASK 4: Sasanian mint Arabic names ────────────────────────────────────

async function task4_sasanianMintAr() {
  console.log('\n=== TASK 4: Sasanian mint Arabic names ===');

  const pairs = [
    ['Gundeshapur',    'جنديشاپور'],
    ['Jundishapur',    'جنديشاپور'],
    ['Ray',            'الري'],
    ['Rayy',           'الري'],
    ['Bishapur',       'بيشابور'],
    ['Bishapur (BYS)', 'بيشابور'],
    ['Merv',           'مرو'],
    ['Marw',           'مرو'],
    ['Ctesiphon',      'المدائن'],
    ['Madain',         'المدائن'],
    ['al-Madain',      'المدائن'],
    ['Nishapur',       'نيسابور'],
    ['Naysabur',       'نيسابور'],
    ['Stakhr',         'استخر'],
    ['Istakhr',        'استخر'],
    ['Arrajan',        'أرجان'],
    ['Kirman',         'كرمان'],
    ['Kerman',         'كرمان'],
    ['Hamadan',        'همدان'],
    ['Ecbatana',       'همدان'],
    ['Susa',           'شوش'],
    ['Shush',          'شوش'],
    ['Hulwan',         'حلوان'],
    ['Nahavand',       'نهاوند'],
    ['Darabjird',      'دارابجرد'],
    ['Ahwaz',          'الأهواز'],
    ['Shiraz',         'شيراز'],
    ['Persis',         'فارس'],
    ['Fars',           'فارس'],
    ['Kabul',          'كابل'],
    ['Sind',           'السند'],
    ['Bukhara',        'بخارى'],
    ['Samarqand',      'سمرقند'],
    ['Herat',          'هراة'],
  ];

  console.log(`  Updating ${pairs.length} mint_ar mappings for SS coins...`);
  let count = 0;
  for (const [mint, mint_ar] of pairs) {
    const url = `${SUPABASE_URL}/rest/v1/coins?cc=eq.SS&mint=eq.${encodeURIComponent(mint)}`;
    const r = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ mint_ar }),
    });
    if (r.ok) { count++; process.stdout.write('.'); }
    else { console.warn(`  Failed: ${mint} → ${mint_ar}`); }
  }
  console.log(`\n  Updated ${count}/${pairs.length} mint_ar values. Task 4 done.`);
}

// ── main ──────────────────────────────────────────────────────────────────

(async () => {
  try {
    await task1_islamicMints();
    await task2_islamicRulers();
    await task3_islamicMintAr();
    await task4_sasanianMintAr();
    console.log('\n✓ All tasks complete.');
  } catch (e) {
    console.error('Fatal error:', e);
    process.exit(1);
  }
})();
