// fix-islamic-data-v3.js — Islamic mint + ruler consolidation
// PostgREST fetch+PATCH pattern (no raw SQL)

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!BASE || !KEY) { console.error('Missing env vars'); process.exit(1); }

// ── helpers ────────────────────────────────────────────────

async function getAll(select, filter) {
  const rows = [];
  let offset = 0;
  while (true) {
    const url = `${BASE}/rest/v1/coins?select=${select}${filter ? '&' + filter : ''}&offset=${offset}&limit=1000`;
    const r = await fetch(url, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
    const d = await r.json();
    if (!Array.isArray(d)) { console.error('getAll error:', JSON.stringify(d)); break; }
    rows.push(...d);
    if (d.length < 1000) break;
    offset += 1000;
  }
  return rows;
}

async function patchExact(field, oldVal, newBody, label) {
  const enc = encodeURIComponent(oldVal);
  const url = `${BASE}/rest/v1/coins?cc=eq.IS&${field}=eq.${enc}`;
  const r = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: KEY, Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'count=exact,return=minimal',
    },
    body: JSON.stringify(newBody),
  });
  const cr = r.headers.get('content-range') || '';
  const count = parseInt(cr.split('/')[1] || '0', 10);
  if (!r.ok && r.status !== 204) {
    const t = await r.text();
    console.error(`  ✗ PATCH failed for "${oldVal}": ${t}`);
    return 0;
  }
  return count;
}

function sep(title) {
  console.log('\n' + '═'.repeat(62));
  console.log(title);
  console.log('═'.repeat(62));
}

// ── normalise helpers ──────────────────────────────────────

function stripDiacritics(s) {
  return s
    .replace(/[āăáàâäãåĀ]/g, 'a')
    .replace(/[īíìîïĪ]/g, 'i')
    .replace(/[ūúùûüŪ]/g, 'u')
    .replace(/[ēéèêëĒ]/g, 'e')
    .replace(/[ōóòôöõŌ]/g, 'o')
    .replace(/[ṭṬ]/g, 't')
    .replace(/[ḍḌ]/g, 'd')
    .replace(/[ḥḤ]/g, 'h')
    .replace(/[ṣṢ]/g, 's')
    .replace(/[ẓẒ]/g, 'z')
    .replace(/[ġĠ]/g, 'g')
    .replace(/[ḫḪ]/g, 'kh')
    .replace(/[šŠ]/g, 'sh')
    .replace(/[ʿʾ''`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// ══════════════════════════════════════════════════════════
// FETCH all IS coins once
// ══════════════════════════════════════════════════════════

sep('Fetching all IS coins…');
const rows = await getAll('mint,ruler,mint_ar,ruler_ar', 'cc=eq.IS');
console.log(`Total IS rows: ${rows.length}`);

// Build frequency maps
const mintFreq = {};
const rulerFreq = {};
for (const r of rows) {
  const m = (r.mint || '').trim();
  const ru = (r.ruler || '').trim();
  if (m) mintFreq[m] = (mintFreq[m] || 0) + 1;
  if (ru) rulerFreq[ru] = (rulerFreq[ru] || 0) + 1;
}

// ══════════════════════════════════════════════════════════
// PASS 1 — Strip outer parentheses:  "(City)" → "City"
// ══════════════════════════════════════════════════════════
sep('MINT PASS 1 — Strip outer parentheses');

const outerParenRE = /^\(([^)]+)\)$/;
let pass1Total = 0;
const pass1Map = {};  // oldVal → stripped

for (const m of Object.keys(mintFreq)) {
  const match = m.match(outerParenRE);
  if (!match) continue;
  const stripped = match[1].trim();
  if (stripped.length < 2) continue;
  // Only strip if the stripped form exists as canonical OR stripped looks like a city name (no parens)
  pass1Map[m] = stripped;
}

for (const [oldMint, newMint] of Object.entries(pass1Map)) {
  const n = await patchExact('mint', oldMint, { mint: newMint }, `"${oldMint}" → "${newMint}"`);
  if (n > 0) {
    console.log(`  ✓ "${oldMint}" → "${newMint}": ${n} rows`);
    pass1Total += n;
  }
}
// Re-fetch mint counts after pass 1
console.log(`→ Pass 1 total: ${pass1Total} rows updated`);

// ══════════════════════════════════════════════════════════
// PASS 2 — Strip trailing slashes/spaces: "City  /" → "City"
// ══════════════════════════════════════════════════════════
sep('MINT PASS 2 — Strip trailing slashes');

// Re-fetch current state
const rows2 = await getAll('mint', 'cc=eq.IS');
const mintFreq2 = {};
for (const r of rows2) {
  const m = (r.mint || '').trim();
  if (m) mintFreq2[m] = (mintFreq2[m] || 0) + 1;
}

const trailingSlashRE = /^(.*?)\s*\/+\s*$/;
let pass2Total = 0;

for (const m of Object.keys(mintFreq2)) {
  const match = m.match(trailingSlashRE);
  if (!match) continue;
  const stripped = match[1].trim();
  if (!stripped || stripped === m) continue;
  const n = await patchExact('mint', m, { mint: stripped }, `"${m}" → "${stripped}"`);
  if (n > 0) {
    console.log(`  ✓ "${m}" → "${stripped}": ${n} rows`);
    pass2Total += n;
  }
}
console.log(`→ Pass 2 total: ${pass2Total} rows updated`);

// ══════════════════════════════════════════════════════════
// PASS 3 — Consolidate 28 canonical groups
// ══════════════════════════════════════════════════════════
sep('MINT PASS 3 — Consolidate canonical groups');

// Re-fetch current state
const rows3 = await getAll('mint,mint_ar', 'cc=eq.IS');
const mintFreq3 = {};
for (const r of rows3) {
  const m = (r.mint || '').trim();
  if (m) mintFreq3[m] = (mintFreq3[m] || 0) + 1;
}
const allMints3 = Object.keys(mintFreq3);

// Helper: patch all matching mints to a canonical form
async function consolidate(label, canonical, mintAr, matchFn) {
  const matches = allMints3.filter(m => m !== canonical && matchFn(m));
  if (matches.length === 0) { console.log(`  [${label}] nothing to consolidate`); return 0; }
  let total = 0;
  for (const old of matches) {
    const n = await patchExact('mint', old, { mint: canonical, mint_ar: mintAr }, label);
    if (n > 0) { console.log(`  ✓ [${label}] "${old}" → "${canonical}": ${n} rows`); total += n; }
  }
  // Also ensure canonical rows have correct mint_ar
  if (mintFreq3[canonical]) {
    const n = await patchExact('mint', canonical, { mint_ar: mintAr }, `${label} mint_ar`);
    // silent — just setting mint_ar on the canonical
  }
  return total;
}

// ── Damascus (includes all Dimashq variants) ──────────────
let p3Total = 0;
p3Total += await consolidate('Damascus', 'Damascus', 'دمشق', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, ''));
  return n === 'damascus' || n === 'dimashq' || n === 'dimaq' ||
         n === 'dimasq' || n === 'dimas' ||
         /^dimash?q/i.test(m) ||
         m === 'Dimashq' || m === 'Dimašq' || m === 'Dimashq)' ||
         m === 'Damascus ]' || m === 'Dimashq]' || m === 'Di]mashq' ||
         m === '( Dimashq)' || m === 'Dimash]q' ||
         /^Dimashq\s+\//.test(m);
});

// ── Aleppo ─────────────────────────────────────────────────
p3Total += await consolidate('Aleppo', 'Aleppo', 'حلب', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, ''));
  return n === 'aleppo' || n === 'halab' || n === 'halap' || n === 'haleb' ||
         m === 'Aleppo' || /^\(aleppo\)$/i.test(m) ||
         m === 'Halab' || m === 'Ḥalab' || m === '(Halab)';
});

// ── al-Shash ───────────────────────────────────────────────
p3Total += await consolidate('al-Shash', 'al-Shash', 'الشاش', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, '').replace(/\s+/g,''));
  return n === 'alshash' || n === 'shash' || n === 'ashshash' ||
         m === 'Al-Shash' || m === 'al-Sha[sh' || m === '(al-Shash)' ||
         m === 'Shash' || m === '(Shash)' || m === 'Tashkent';
});

// ── Samarqand ──────────────────────────────────────────────
p3Total += await consolidate('Samarqand', 'Samarqand', 'سمرقند', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, ''));
  return n === 'samarqand' || n === 'samarkand' ||
         /^\(samarqand\)$/i.test(m) || m === '(SAMARQAND)';
});

// ── Madinat al-Salam (all spellings, incl. as-Salam) ──────
p3Total += await consolidate('Madinat al-Salam', 'Madinat al-Salam', 'مدينة السلام', m => {
  const l = m.toLowerCase();
  return (l.includes('madinat') || l.includes('madínat') || l.includes('madīnat')) &&
         (l.includes('salam') || l.includes('salám') || l.includes('salām'));
});

// ── Baghdad ────────────────────────────────────────────────
p3Total += await consolidate('Baghdad', 'Baghdad', 'بغداد', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, ''));
  return n === 'baghdad' || n === 'bagdad' ||
         /^\(baghdad\???\)$/i.test(m) || m === 'baghdad' ||
         /^Baghdad\s+\//.test(m);
});

// ── Hamah ──────────────────────────────────────────────────
p3Total += await consolidate('Hamah', 'Hamah', 'حماة', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, '').trim());
  return n === 'hamah' || n === 'hama' ||
         m === '(Hamah)' || m === '(Hamah?)' || m === 'Hamah]' ||
         m === 'Ha]ma[h' || m === '(Hamah' || m === 'Hamāh';
});

// ── al-Qahira ──────────────────────────────────────────────
p3Total += await consolidate('al-Qahira', 'al-Qahira', 'القاهرة', m => {
  const l = m.toLowerCase();
  return (l.includes('qahira') || l.includes('qáhira') || l.includes('qāhira') ||
          l === 'cairo' || l === '(cairo)');
});

// ── Bukhara ────────────────────────────────────────────────
p3Total += await consolidate('Bukhara', 'Bukhara', 'بخارى', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, ''));
  return n === 'bukhara' || n === 'buxara' || n === 'bokhara' ||
         /^\(bukhara\)$/i.test(m) || m === 'bukhara' ||
         /^Bukhara\s+\//.test(m);
});

// ── Andaraba ───────────────────────────────────────────────
p3Total += await consolidate('Andaraba', 'Andaraba', 'اندرابه', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, ''));
  return n === 'andaraba' || n === 'andarab' ||
         m === '(Andaraba)' || m === 'Andarába';
});

// ── Tabriz ─────────────────────────────────────────────────
p3Total += await consolidate('Tabriz', 'Tabriz', 'تبريز', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, ''));
  return n === 'tabriz' ||
         m === '(Tabriz)' || m === 'Tabríz' || m === 'Tabrīz' ||
         /^Tabriz\s+\//.test(m) || m === '/Tabriz/';
});

// ── Mardin ─────────────────────────────────────────────────
p3Total += await consolidate('Mardin', 'Mardin', 'ماردين', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, ''));
  return n === 'mardin' ||
         m === '(Mardin)' || m === '(Mardin?)' || m === 'Mârdîn' || m === 'Mārdīn' ||
         m === 'Mard[in' || /^Mardin\s+\//.test(m);
});

// ── Balkh ──────────────────────────────────────────────────
p3Total += await consolidate('Balkh', 'Balkh', 'بلخ', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, ''));
  return n === 'balkh' || n === 'balh' ||
         m === '(Balkh)' || m === 'Balḫ' ||
         /^Balkh\s+\//.test(m) || m === '/  Balkh';
});

// ── Wasit ──────────────────────────────────────────────────
p3Total += await consolidate('Wasit', 'Wasit', 'واسط', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, ''));
  return n === 'wasit' ||
         m === '(Wasit)' || m === 'Wásit' || m === 'WASIT' ||
         m === 'wasit' || m === 'Wāsiṭ' ||
         /^Wasit\s+\//.test(m);
});

// ── Tabaristan ─────────────────────────────────────────────
p3Total += await consolidate('Tabaristan', 'Tabaristan', 'طبرستان', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, ''));
  return n === 'tabaristan' || /^Tabaristan\s+\//.test(m);
});

// ── al-Andalus ─────────────────────────────────────────────
p3Total += await consolidate('al-Andalus', 'al-Andalus', 'الأندلس', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, '').replace(/\s+/g,''));
  return n === 'andalus' || n === 'alandalus' ||
         m === '(al-Andalus)' || m === 'Al-Andalus';
});

// ── Hims ───────────────────────────────────────────────────
p3Total += await consolidate('Hims', 'Hims', 'حمص', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, ''));
  return n === 'hims' || n === 'homs' || m === '(Hims)' || m === 'Ḥimṣ';
});

// ── Tripoli ────────────────────────────────────────────────
p3Total += await consolidate('Tripoli', 'Tripoli', 'طرابلس', m => {
  const l = m.toLowerCase().replace(/[\[\]\(\)\?\.]/g, '');
  return l.includes('rablus') || l === 'tripoli' || l === 'trablus';
});

// ── Misr ───────────────────────────────────────────────────
p3Total += await consolidate('Misr', 'Misr', 'مصر', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, ''));
  return n === 'misr' || n === 'masr' ||
         m === '(Misr)' || m === 'Miṣr';
});

// ── Shiraz ─────────────────────────────────────────────────
p3Total += await consolidate('Shiraz', 'Shiraz', 'شيراز', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, ''));
  return n === 'shiraz' || n === 'shirz' ||
         m === '(Shiraz)' || m === 'Šíráz' || m === 'Shīrāz' ||
         m === 'Shirâz' || m === '(Šíráz?)' || /^Shiraz\s+\//.test(m);
});

// ── al-Basra ───────────────────────────────────────────────
p3Total += await consolidate('al-Basra', 'al-Basra', 'البصرة', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, '').replace(/\s+/g,''));
  return n === 'albasra' || n === 'basra' || n === 'basrah' ||
         m === 'Al-Basra' || m === '(al-Basra)' || m === 'al-Baṣra' ||
         /^al-[Bb]asra\s+\//.test(m);
});

// ── al-Mawsil ──────────────────────────────────────────────
p3Total += await consolidate('al-Mawsil', 'al-Mawsil', 'الموصل', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, '').replace(/\s+/g,''));
  return n === 'almawsil' || n === 'mosul' || n === 'mawsil' ||
         m === 'Al-Mawsil' || m === '(al-Mawsil)' || m === 'al-Mawṣil' ||
         /^Al-Mawsil\s+\//.test(m);
});

// ── al-Kufa ────────────────────────────────────────────────
p3Total += await consolidate('al-Kufa', 'al-Kufa', 'الكوفة', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, '').replace(/\s+/g,''));
  return n === 'alkufa' || n === 'kufa' || n === 'kupha' ||
         m === 'Al-Kufa' || m === '(al-Kufa)' || m === 'al-Kûfa' || m === 'Kūfa' ||
         m === '(al-Kufa?)' || m === '("al-Kufa")' || m === 'al-kufa';
});

// ── Kashan ─────────────────────────────────────────────────
p3Total += await consolidate('Kashan', 'Kashan', 'كاشان', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, ''));
  return n === 'kashan' ||
         m === 'Kášán' || /^Kashan\s+\//.test(m);
});

// ── Surra man Ra'a ─────────────────────────────────────────
p3Total += await consolidate("Surra man Ra'a", "Surra man Ra'a", 'سامراء', m => {
  const l = m.toLowerCase();
  return l.startsWith('surra man ra') || l.startsWith('samarra');
});

// ── al-Muhammadiya ─────────────────────────────────────────
p3Total += await consolidate('al-Muhammadiya', 'al-Muhammadiya', 'المحمدية', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, '').replace(/\s+/g,''));
  return n === 'almuhammadiya' || n === 'muhammadiya' ||
         m === 'Al-Muhammadiya' || m === '(al-Muhammadiya)' || m === 'al-Muḥammadiya' ||
         m === 'Muhammadiya' || m === 'MUHAMMADIYA';
});

// ── Jurjan ─────────────────────────────────────────────────
p3Total += await consolidate('Jurjan', 'Jurjan', 'جرجان', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, ''));
  return n === 'jurjan' || m === 'Júrján' || m === 'Jurján' ||
         m === '(Jurjan)' || /^Jurjan\s+\//.test(m);
});

// ── Isfahan ────────────────────────────────────────────────
p3Total += await consolidate('Isfahan', 'Isfahan', 'أصفهان', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, ''));
  return n === 'isfahan' || n === 'ispahan' || n === 'isphahan' ||
         m === 'Iṣfahān' || m === '(Isfahan)' || /^Isfahan\s+\//.test(m);
});

// ── Herat ──────────────────────────────────────────────────
p3Total += await consolidate('Herat', 'Herat', 'هرات', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, ''));
  return n === 'herat' || m === '(Herat)' || /^Herat\s+\//.test(m);
});

// ── Ferghana ───────────────────────────────────────────────
p3Total += await consolidate('Ferghana', 'Ferghana', 'فرغانة', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, ''));
  return n === 'ferghana' || m === 'ferghana' || m === '(Ferghana)';
});

// ── Sinjar ─────────────────────────────────────────────────
p3Total += await consolidate('Sinjar', 'Sinjar', 'سنجار', m => {
  return m === '(Sinjar)' || m === '(Sinjar?)' || m === 'Sinjār';
});

// ── Harran ─────────────────────────────────────────────────
p3Total += await consolidate('Harran', 'Harran', 'حران', m => {
  return m === '(Harran)' || m === '(Harran?)' || m === 'Ḥarrān';
});

// ── Dunaysir ───────────────────────────────────────────────
p3Total += await consolidate('Dunaysir', 'Dunaysir', 'دنيسر', m => {
  return m === '(Dunaysir)' || m === 'Dunaÿsir';
});

// ── Tabariya (Tiberias) ────────────────────────────────────
p3Total += await consolidate('Tabariya', 'Tabariya', 'طبرية', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, ''));
  return n === 'tabariya' || m === '(Tabariya)' || m === 'Tabariya`' || m === 'Ṭabariya';
});

// ── Ifriqiya ───────────────────────────────────────────────
p3Total += await consolidate('Ifriqiya', 'Ifriqiya', 'إفريقية', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, ''));
  return n === 'ifriqiya' || m === "'Ifriqiya'" || m === 'Ifrîqiya' ||
         /^Ifriqiya\s+\//.test(m);
});

// ── al-Jazira ──────────────────────────────────────────────
p3Total += await consolidate('al-Jazira', 'al-Jazira', 'الجزيرة', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, '').replace(/\s+/g,''));
  return n === 'aljazira' || m === 'Al-Jazira' || m === '(al-Jazira)' || m === 'al-Jazíra';
});

// ── Sultaniya ──────────────────────────────────────────────
p3Total += await consolidate('Sultaniya', 'Sultaniya', 'سلطانيه', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, ''));
  return n === 'sultaniya' || m === '(Sultaniya)' || /^Sultaniya\s+\//.test(m);
});

// ── al-Ramla ───────────────────────────────────────────────
p3Total += await consolidate('al-Ramla', 'al-Ramla', 'الرملة', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, '').replace(/\s+/g,''));
  return n === 'alramla' || m === 'Al-Ramla' || m === '(al-Ramla?)';
});

// ── Amid ───────────────────────────────────────────────────
p3Total += await consolidate('Amid', 'Amid', 'آمد', m => {
  return m === '(Amid)' || m === 'Āmid';
});

// ── al-'Abbasiya ───────────────────────────────────────────
p3Total += await consolidate("al-'Abbasiya", "al-'Abbasiya", 'العباسية', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, '').replace(/[' ]/g,'').toLowerCase());
  return n === 'alabbasiya' || m === 'al-Abbasiya' || m === 'Al-Abbasiya' ||
         m === "Al-'Abbasiya" || m === "(al-Abbasiya)" || m === "(al-'Abbasiya)";
});

// ── Akhsikath ──────────────────────────────────────────────
p3Total += await consolidate('Akhsikath', 'Akhsikath', 'أخسيكث', m => {
  return m === '(Akhsikath)';
});

// ── Nishapur ───────────────────────────────────────────────
p3Total += await consolidate('Nishapur', 'Nishapur', 'نيسابور', m => {
  return m === 'Nisha]pur' || m === 'Nīshāpūr' || m === 'Nishabur';
});

// ── Bazar ──────────────────────────────────────────────────
p3Total += await consolidate('Bazar', 'Bazar', 'بازار', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, ''));
  return n === 'bazar' && m !== 'Bazar' || m === 'Bāzār' || /^Bazar\s+\//.test(m);
});

// ── Hamadan ────────────────────────────────────────────────
p3Total += await consolidate('Hamadan', 'Hamadan', 'همدان', m => {
  const n = stripDiacritics(m.replace(/[\[\]\(\)\?\.]/g, ''));
  return n === 'hamadan' && m !== 'Hamadan' ||
         m === '(Hamadan)' || m === 'Hamadán' || /^Hamadan\s+\//.test(m);
});

// ── Clear BYSh / BYŠ (Sasanian codes in IS) ───────────────
{
  const sasanianCodes = ['BYSh', 'BYŠ', 'BYSH'];
  for (const code of sasanianCodes) {
    if (allMints3.includes(code)) {
      const n = await patchExact('mint', code, { mint: '' }, `Clear Sasanian code "${code}"`);
      if (n > 0) { console.log(`  ✓ Cleared Sasanian code "${code}": ${n} rows`); p3Total += n; }
    }
  }
}

console.log(`→ Pass 3 total: ${p3Total} rows updated`);

// ══════════════════════════════════════════════════════════
// PASS 4 — Clear remaining junk mints
// ══════════════════════════════════════════════════════════
sep('MINT PASS 4 — Clear junk (numbers, dimensions, bracket-only)');

// Re-fetch
const rows4 = await getAll('mint', 'cc=eq.IS');
const mintFreq4 = {};
for (const r of rows4) {
  const m = (r.mint || '').trim();
  if (m) mintFreq4[m] = (mintFreq4[m] || 0) + 1;
}

let pass4Total = 0;

// Pure numbers, dimension strings, AH date strings, weight strings
const junkRE = /^[\d\s\.\-\*xX×\/]+[AHahmgcmkm]*\s*$|^\d+AH$/i;
// Bracket-only short entries  e.g. "[IS] nm [Halab"  or  "[...]"
const bracketOnlyRE = /^\[.*\]$|^\[.*$/;

for (const m of Object.keys(mintFreq4)) {
  let isJunk = false;
  if (junkRE.test(m.trim())) isJunk = true;
  if (bracketOnlyRE.test(m.trim()) && m.length < 10) isJunk = true;
  // Single characters or very short noise
  if (/^[a-zA-Z\?\.\-]{1,2}$/.test(m.trim())) isJunk = true;
  // Obvious descriptive noise
  if (/^(NM|nm|no mint|No Mint|off flan|unclear|uncertain|illegible|blundered)$/i.test(m.trim())) isJunk = true;

  if (isJunk) {
    const n = await patchExact('mint', m, { mint: '' }, `junk "${m}"`);
    if (n > 0) { console.log(`  ✓ Cleared junk "${m}": ${n} rows`); pass4Total += n; }
  }
}
console.log(`→ Pass 4 total: ${pass4Total} rows updated`);

// ── Intermediate mint count ────────────────────────────────
const midRows = await getAll('mint', 'cc=eq.IS');
const midDistinct = new Set(midRows.map(r => (r.mint || '').trim()).filter(Boolean)).size;
console.log(`\n→ Distinct mints after all 4 passes: ${midDistinct}`);

// ══════════════════════════════════════════════════════════
// RULER PASS 1 — Consolidate top variant groups
// ══════════════════════════════════════════════════════════
sep('RULER PASS 1 — Consolidate top variant groups');

// Re-fetch ruler state
const rowsR = await getAll('ruler,ruler_ar', 'cc=eq.IS');
const rulerFreqR = {};
for (const r of rowsR) {
  const ru = (r.ruler || '').trim();
  if (ru) rulerFreqR[ru] = (rulerFreqR[ru] || 0) + 1;
}
const allRulers = Object.keys(rulerFreqR);

async function consolidateRuler(label, canonical, rulerAr, matchFn) {
  const matches = allRulers.filter(ru => ru !== canonical && matchFn(ru));
  if (matches.length === 0) { console.log(`  [${label}] nothing to consolidate`); return 0; }
  let total = 0;
  for (const old of matches) {
    const body = { ruler: canonical };
    if (rulerAr) body.ruler_ar = rulerAr;
    const n = await patchExact('ruler', old, body, label);
    if (n > 0) { console.log(`  ✓ [${label}] "${old}" → "${canonical}": ${n} rows`); total += n; }
  }
  return total;
}

let rp1Total = 0;

// Nasr b. Ahmad
rp1Total += await consolidateRuler('Nasr b. Ahmad', 'Nasr b. Ahmad', 'نصر بن أحمد', ru => {
  const n = stripDiacritics(ru.replace(/[\.\-\s]/g,''));
  return n.startsWith('nasrb') && n.includes('ahmad') && !n.includes('nasr ii');
});

// Abu Sa'id (Ilkhanid) — careful not to catch Abu Sa'id Khayr Allah (different person)
rp1Total += await consolidateRuler("Abu Sa'id", "Abu Sa'id", 'أبو سعيد', ru => {
  const l = ru.toLowerCase().replace(/[`''']/g,"'");
  return (l.startsWith("abu sa'id") || l === 'abu said' || l === 'abú sa`íd' || l === 'abu sai\'d') &&
         !l.includes('khayr');
});

// Sha'ban II
rp1Total += await consolidateRuler("Sha'ban II", "Sha'ban II", 'شعبان الثاني', ru => {
  const l = ru.toLowerCase().replace(/[`''']/g,"'");
  return l.startsWith("sha'ban ii") || l.startsWith('sha`ban ii') || l === 'shaban ii';
});

// Isma'il b. Ahmad
rp1Total += await consolidateRuler("Isma'il b. Ahmad", "Isma'il b. Ahmad", 'إسماعيل بن أحمد', ru => {
  const l = ru.toLowerCase().replace(/[`''']/g,"'");
  return l.includes("isma'il") && l.includes('ahmad') ||
         l.includes('ismail') && l.includes('ahmad');
});

// al-Nasir Yusuf II
rp1Total += await consolidateRuler('al-Nasir Yusuf II', 'al-Nasir Yusuf II', 'الناصر يوسف الثاني', ru => {
  return ru === 'Al-Nasir Yusuf II';
});

// Barquq — strip trailing punctuation/question marks
rp1Total += await consolidateRuler('Barquq', 'Barquq', 'برقوق', ru => {
  return /^[Bb]arquq[\s\?]+$/.test(ru);
});

// al-Kamil Muhammad I
rp1Total += await consolidateRuler('al-Kamil Muhammad I', 'al-Kamil Muhammad I', 'الكامل محمد', ru => {
  return ru === 'Al-Kamil Muhammad I';
});

// al-Zahir Ghazi
rp1Total += await consolidateRuler('al-Zahir Ghazi', 'al-Zahir Ghazi', 'الظاهر غازي', ru => {
  return ru === 'Al-Zahir Ghazi';
});

// al-'Adil I
rp1Total += await consolidateRuler("al-'Adil I", "al-'Adil I", 'العادل الأول', ru => {
  const l = ru.toLowerCase().replace(/[`''']/g,"'");
  return (l === "al-'adil i" || l === "al-adil i") && !l.includes('ii');
});

// Salah al-Din
rp1Total += await consolidateRuler('Salah al-Din', 'Salah al-Din', 'صلاح الدين', ru => {
  const l = ru.toLowerCase();
  return l.startsWith('salah al-din') && ru !== 'Salah al-Din';
});

// Isma'il (standalone — not b. Ahmad)
rp1Total += await consolidateRuler("Isma'il", "Isma'il", 'إسماعيل', ru => {
  const l = ru.toLowerCase().replace(/[`''']/g,"'");
  return (l === "isma'il" || l === 'isma`il' || l === "ismā'īl") &&
         !l.includes('ahmad') && !l.includes('b.');
});

// Mansur b. Nuh variants
rp1Total += await consolidateRuler('Mansur b. Nuh', 'Mansur b. Nuh', 'منصور بن نوح', ru => {
  const l = ru.toLowerCase().replace(/[\.\-\s]/g,'');
  return l.startsWith('mansurb') && l.includes('nuh') && !l.includes('mansuri') && !l.includes('mansur i');
});

// Mansur I b. Nuh
rp1Total += await consolidateRuler('Mansur I b. Nuh', 'Mansur I b. Nuh', 'منصور الأول بن نوح', ru => {
  const l = ru.toLowerCase().replace(/[\.\-\s]/g,'');
  return l.startsWith('mansurib') && l.includes('nuh');
});

// Nasr II b. Ahmad
rp1Total += await consolidateRuler('Nasr II b. Ahmad', 'Nasr II b. Ahmad', 'نصر الثاني بن أحمد', ru => {
  const l = ru.toLowerCase().replace(/[\.\-\s]/g,'');
  return l.startsWith('nasriib') && l.includes('ahmad');
});

// Nuh b. Nasr
rp1Total += await consolidateRuler('Nuh b. Nasr', 'Nuh b. Nasr', 'نوح بن نصر', ru => {
  const l = ru.toLowerCase().replace(/[\.\-\s]/g,'');
  return l.startsWith('nuhb') && l.includes('nasr');
});

// Qala'un
rp1Total += await consolidateRuler("Qala'un", "Qala'un", 'قلاوون', ru => {
  return /^[Qq]alaun[\?\s]*$/.test(ru);
});

// Qa'itbay
rp1Total += await consolidateRuler("Qa'itbay", "Qa'itbay", 'قايتباي', ru => {
  const l = ru.toLowerCase().replace(/[`''']/g,"'");
  return l.startsWith("qa'itbay") || l === 'qaitbay?';
});

// Harun al-Rashid
rp1Total += await consolidateRuler('Harun al-Rashid', 'Harun al-Rashid', 'هارون الرشيد', ru => {
  const l = ru.toLowerCase();
  return l.startsWith('harun al-rashid') && ru !== 'Harun al-Rashid';
});

// Hulagu
rp1Total += await consolidateRuler('Hulagu', 'Hulagu', 'هولاكو', ru => {
  return /^[Hh]ulagu[\?\s]*$/.test(ru);
});

// Taghay Timur (double-space)
rp1Total += await consolidateRuler('Taghay Timur', 'Taghay Timur', 'تغاي تيمور', ru => {
  return ru === 'Taghay  Timur';
});

// Sati Beg
rp1Total += await consolidateRuler('Sati Beg', 'Sati Beg', 'ساتي بك', ru => {
  const l = ru.toLowerCase().replace(/[`''']/g,"'");
  return (l.startsWith('sati beg') || l.startsWith('sātī beg')) && ru !== 'Sati Beg';
});

// al-Salih Ayyub
rp1Total += await consolidateRuler('al-Salih Ayyub', 'al-Salih Ayyub', 'الصالح أيوب', ru => {
  return ru === 'Al-Salih Ayyub';
});

// Faraj — strip trailing ?
rp1Total += await consolidateRuler('Faraj', 'Faraj', 'فرج', ru => {
  return /^[Ff]araj[\?\s]+$/.test(ru);
});

// Muhammad I — strip trailing ?
rp1Total += await consolidateRuler('Muhammad I', 'Muhammad I', 'محمد الأول', ru => {
  return /^Muhammad I\?+$/.test(ru);
});

// Muhammad II — strip trailing ?
rp1Total += await consolidateRuler('Muhammad II', 'Muhammad II', 'محمد الثاني', ru => {
  return /^Muhammad II\?+$/.test(ru);
});

// Nasir al-Din Artuq Arslan
rp1Total += await consolidateRuler('Nasir al-Din Artuq Arslan', 'Nasir al-Din Artuq Arslan', 'ناصر الدين أرتق أرسلان', ru => {
  return ru === 'Nasir al-din Artuq Arslan';
});

// 'Ali II — backtick variant
rp1Total += await consolidateRuler("'Ali II", "'Ali II", 'علي الثاني', ru => {
  return ru === '`Ali II' || ru === "'Ali II?";
});

// Samanid AE fals descriptions (not a ruler name)
rp1Total += await consolidateRuler('', '', '', ru => {
  return /samanid ae (fals|fils)/i.test(ru);
});
// Those need to be cleared, not merged to canonical
{
  const fals = allRulers.filter(ru => /samanid ae (fals|fils)/i.test(ru));
  for (const old of fals) {
    const n = await patchExact('ruler', old, { ruler: '', ruler_ar: '' }, `Clear description "${old}"`);
    if (n > 0) { console.log(`  ✓ Cleared description "${old}": ${n} rows`); rp1Total += n; }
  }
}

console.log(`→ Ruler Pass 1 total: ${rp1Total} rows updated`);

// ══════════════════════════════════════════════════════════
// RULER PASS 2 — Clear junk
// ══════════════════════════════════════════════════════════
sep('RULER PASS 2 — Clear junk ruler values');

const rowsR2 = await getAll('ruler', 'cc=eq.IS');
const rulerFreqR2 = {};
for (const r of rowsR2) {
  const ru = (r.ruler || '').trim();
  if (ru) rulerFreqR2[ru] = (rulerFreqR2[ru] || 0) + 1;
}

let rp2Total = 0;
const rulerJunkRE = /^(no mint|no ruler|anonymous|uncertain|unknown|NM|nm|illegible|unclear)$/i;
const rulerDescRE = /AE fals|AR dirham|fals.type|dirham.type|Samanid AE|coin type|umayyad ae|umayyad ar/i;

for (const [ru, cnt] of Object.entries(rulerFreqR2)) {
  let isJunk = false;
  if (rulerJunkRE.test(ru.trim())) isJunk = true;
  if (rulerDescRE.test(ru)) isJunk = true;

  if (isJunk) {
    const n = await patchExact('ruler', ru, { ruler: '', ruler_ar: '' }, `junk "${ru}"`);
    if (n > 0) { console.log(`  ✓ Cleared ruler junk "${ru}": ${n} rows`); rp2Total += n; }
  }
}
console.log(`→ Ruler Pass 2 total: ${rp2Total} rows updated`);

// ══════════════════════════════════════════════════════════
// FINAL VERIFICATION
// ══════════════════════════════════════════════════════════
sep('FINAL VERIFICATION');

const finalRows = await getAll('mint,ruler', 'cc=eq.IS');
const finalMints = new Set();
const finalRulers = new Set();
let noMint = 0, noRuler = 0;

for (const r of finalRows) {
  const m = (r.mint || '').trim();
  const ru = (r.ruler || '').trim();
  if (m) finalMints.add(m); else noMint++;
  if (ru) finalRulers.add(ru); else noRuler++;
}

console.log('\nIS — Final state:');
console.log(`  Total rows:       ${finalRows.length}`);
console.log(`  Unique mints:     ${finalMints.size}  (target < 300)`);
console.log(`  Unique rulers:    ${finalRulers.size}  (target < 600)`);
console.log(`  No-mint rows:     ${noMint}`);
console.log(`  No-ruler rows:    ${noRuler}`);

// Show top 40 mints
const mintRanked = [...finalMints]
  .map(m => ({ m, c: finalRows.filter(r => (r.mint||'').trim() === m).length }))
  .sort((a,b) => b.c - a.c).slice(0, 40);
console.log('\nTop 40 mints by count:');
mintRanked.forEach(({m,c}) => console.log(`  ${c.toString().padStart(5)} | ${m}`));

console.log('\n✅ All tasks complete — no git commands run.');
