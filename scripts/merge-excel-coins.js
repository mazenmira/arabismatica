'use strict';

const XLSX = require('xlsx');
const fs   = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────

const EXCEL_DIR  = 'D:/01 - Arab Collector Repo/18 - Arabic-Catalogue/merged data';
const COINS_PATH = path.resolve(__dirname, '../src/data/coins.json');

const FILE_META = {
  'Algeria_Coins_Merged.xlsx':       { cc: 'DZ', co: 'Algeria',        co_ar: 'الجزائر' },
  'Comoros_Coins_Merged.xlsx':       { cc: 'KM', co: 'Comoros',        co_ar: 'جزر القمر' },
  'Egypt_Coins_Merged.xlsx':         { cc: 'EG', co: 'Egypt',          co_ar: 'مصر' },
  'Hejaz_and_Nagd_Coins_Merged.xlsx':{ cc: 'HN', co: 'Hejaz & Najd',  co_ar: 'الحجاز ونجد' },
  'Iraq_Coins_Merged.xlsx':          { cc: 'IQ', co: 'Iraq',           co_ar: 'العراق' },
  'Jordan_Coins_Merged.xlsx':        { cc: 'JO', co: 'Jordan',         co_ar: 'الأردن' },
  'Kuwait_Coins_Merged.xlsx':        { cc: 'KW', co: 'Kuwait',         co_ar: 'الكويت' },
  'Lebanon_Coins_Merged.xlsx':       { cc: 'LB', co: 'Lebanon',        co_ar: 'لبنان' },
  'Libya_Coins_Merged.xlsx':         { cc: 'LY', co: 'Libya',          co_ar: 'ليبيا' },
  'Mauritania_Coins_Merged.xlsx':    { cc: 'MR', co: 'Mauritania',     co_ar: 'موريتانيا' },
  'Morocco_Coins_Merged.xlsx':       { cc: 'MA', co: 'Morocco',        co_ar: 'المغرب' },
  'Oman_Coins_Merged.xlsx':          { cc: 'OM', co: 'Oman',           co_ar: 'عُمان' },
  'Palestine_Coins_Merged.xlsx':     { cc: 'PS', co: 'Palestine',      co_ar: 'فلسطين' },
  'Qatar_Coins_Merged.xlsx':         { cc: 'QA', co: 'Qatar',          co_ar: 'قطر' },
  'Qatar_and_Dubai_Coins_Merged.xlsx':{ cc: 'QD', co: 'Qatar & Dubai', co_ar: 'قطر ودبي' },
  'Saudi_Coins_Merged.xlsx':         { cc: 'SA', co: 'Saudi Arabia',   co_ar: 'المملكة العربية السعودية' },
  'Sudan_Coins_Merged.xlsx':         null,   // skip — already complete in coins.json
  'Syria_Coins_Merged.xlsx':         { cc: 'SY', co: 'Syria',          co_ar: 'سوريا' },
  'Tunisia_Coins_Merged.xlsx':       { cc: 'TN', co: 'Tunisia',        co_ar: 'تونس' },
  'UAE_Coins_Merged.xlsx':           { cc: 'AE', co: 'UAE',            co_ar: 'الإمارات العربية المتحدة' },
  'Yemen_Coins_Merged.xlsx':         { cc: 'YE', co: 'Yemen',          co_ar: 'اليمن' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extract nid (Numista ID) from URL like https://en.numista.com/483797 */
function nidFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const m = url.match(/\/(\d+)\s*$/);
  return m ? m[1] : null;
}

/** Parse description_piece: "Copper • 8.5 g • ⌀ 14.1 mm … KM# 1, N# 483797" */
function parseDescription(desc) {
  if (!desc || typeof desc !== 'string') return {};
  const result = {};

  const metalMatch = desc.match(/^([^•\n]+?)(?:\s*•|$)/);
  if (metalMatch) result.metal = metalMatch[1].trim();

  const wtMatch = desc.match(/([\d.]+)\s*g(?:\s*•|\s*⌀|\s*\n|$)/);
  if (wtMatch) result.wt = parseFloat(wtMatch[1]);

  const diaMatch = desc.match(/⌀\s*([\d.]+)\s*mm/);
  if (diaMatch) result.dia = parseFloat(diaMatch[1]);

  // KM# may have optional space and letters: "KM# A1", "KM# 85"
  const kmMatch = desc.match(/KM#\s*([^\s,]+)/);
  if (kmMatch) result.km = 'KM#' + kmMatch[1];

  // N# is the Numista ID
  const nidMatch = desc.match(/N#\s*(\d+)/);
  if (nidMatch) result.nidFromDesc = nidMatch[1];

  return result;
}

/** Map description_piece 3 → type */
function parseType(cat) {
  if (!cat || typeof cat !== 'string') return 'Circulation';
  if (/commemorative/i.test(cat)) return 'Commemorative';
  if (/circulation/i.test(cat))   return 'Circulation';
  return 'Circulation';
}

/**
 * Parse date string → { yce, yah }
 * Handles: "1308 (1891) A", "926 (1520)", "ND (1603-1605)", "1343 (1925)"
 */
function parseDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    // Might be a numeric year from the comment column
    return { yce: String(dateStr || ''), yah: '' };
  }
  // Gregorian in parens: "1308 (1891)"
  const gregMatch = dateStr.match(/\((\d{3,4})(?:-\d+)?\)/);
  // Hijri before the paren
  const hijriMatch = dateStr.match(/^(\d{3,4})\s*(?:\(|$)/);
  return {
    yce: gregMatch  ? gregMatch[1]  : (hijriMatch ? '' : dateStr.trim()),
    yah: hijriMatch ? hijriMatch[1] : '',
  };
}

/** Parse mintage string: "100 200" → 100200, "1,200,000" → 1200000 */
function parseMintage(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  const s = String(raw).replace(/[\s,]/g, '');
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}

/** Build a prices object; nullify zero/empty */
function buildPrices(row) {
  const grades = ['G', 'VG', 'F', 'VF', 'XF', 'AU', 'UNC'];
  const prices = {};
  let hasAny = false;
  for (const g of grades) {
    const v = row[g];
    const n = (v !== null && v !== undefined && v !== '') ? parseFloat(v) : null;
    prices[g] = (n !== null && !isNaN(n)) ? n : null;
    if (prices[g] !== null) hasAny = true;
  }
  return hasAny ? prices : null;
}

/** Build a mintageData entry */
function buildMintageEntry(mintageRaw, dateStr) {
  const count = parseMintage(mintageRaw);
  if (count === null) return null;
  const { yce, yah } = parseDate(dateStr);
  return {
    YearHijri:      yah ? parseInt(yah, 10) : null,
    YearGregorian:  yce ? parseInt(yce, 10) : null,
    Mintmark:       'None',
    MintageCount:   count,
    Note:           null,
    Rarity:         null,
  };
}

/** Check if a mintageData entry with the same year+count already exists */
function mintageEntryExists(arr, entry) {
  return arr.some(e =>
    e.YearGregorian === entry.YearGregorian &&
    e.MintageCount  === entry.MintageCount
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const coins     = JSON.parse(fs.readFileSync(COINS_PATH, 'utf8'));
const totalBefore = coins.length;

// Index existing coins by nid for O(1) lookup
const byNid = new Map();
for (const coin of coins) {
  if (coin.nid) byNid.set(String(coin.nid), coin);
}

const stats = {
  enriched: {},
  appended: {},
  failed:   [],
  skipped:  0,
};

const files = fs.readdirSync(EXCEL_DIR).filter(f => f.endsWith('.xlsx'));

for (const file of files) {
  const meta = FILE_META[file];
  if (meta === null) { stats.skipped++; continue; }
  if (!meta) { console.warn('Unknown file, skipping:', file); continue; }

  const { cc, co, co_ar } = meta;
  stats.enriched[cc] = stats.enriched[cc] || 0;
  stats.appended[cc] = stats.appended[cc] || 0;

  const wb = XLSX.readFile(path.join(EXCEL_DIR, file));
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws);   // keyed by header names

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // Excel 1-indexed + header row

    // Skip blank Excel rows
    if (!row['photo_avers href'] && !row['description_piece'] && !row['description_piece 2']) continue;

    // ── Resolve nid ──────────────────────────────────────────────────────────
    let nid = nidFromUrl(row['photo_avers href']);
    const descData = parseDescription(row['description_piece']);

    // Cross-check nid from description if URL parse failed
    if (!nid && descData.nidFromDesc) nid = descData.nidFromDesc;

    // ── Parse common fields ───────────────────────────────────────────────────
    const dateStr  = row['date'] !== undefined ? String(row['date']) : null;
    const { yce, yah } = parseDate(dateStr);
    const coinType = parseType(row['description_piece 3']);
    const prices   = buildPrices(row);
    const mintEntry = buildMintageEntry(row['Mintage'], dateStr);

    const oImg = (typeof row['photo_avers src']  === 'string' && row['photo_avers src'].startsWith('http'))
      ? row['photo_avers src'] : null;
    const rImg = (typeof row['photo_revers src'] === 'string' && row['photo_revers src'].startsWith('http'))
      ? row['photo_revers src'] : null;

    const coinName = (typeof row['description_piece 2'] === 'string')
      ? row['description_piece 2'].trim() : null;

    // ── Match or create ───────────────────────────────────────────────────────
    let existing = nid ? byNid.get(nid) : null;

    if (existing) {
      // ── Enrich existing coin ────────────────────────────────────────────────
      if (prices && !existing.prices) existing.prices = prices;

      if (mintEntry) {
        if (!existing.mintageData) existing.mintageData = [];
        if (!mintageEntryExists(existing.mintageData, mintEntry))
          existing.mintageData.push(mintEntry);
      }

      if (!existing.o && oImg) existing.o = oImg;
      if (!existing.r && rImg) existing.r = rImg;
      if ((!existing.metal || existing.metal === '') && descData.metal) existing.metal = descData.metal;
      if ((!existing.wt   || existing.wt === null)  && descData.wt   !== undefined) existing.wt = descData.wt;
      if ((!existing.dia  || existing.dia === null)  && descData.dia  !== undefined) existing.dia = descData.dia;
      if ((!existing.km   || existing.km === '')     && descData.km)  existing.km = descData.km;
      if ((!existing.name || existing.name === '')   && coinName) existing.name = coinName;
      if ((!existing.type || existing.type === '')   && coinType) existing.type = coinType;

      stats.enriched[cc]++;

    } else {
      // ── Append new coin ─────────────────────────────────────────────────────
      if (!nid) {
        stats.failed.push({ file, rowNum, reason: 'no nid resolvable', date: dateStr, name: coinName });
        continue;
      }

      const newId = `${cc.toLowerCase()}-${nid}`;

      // Don't append if this id already exists (shouldn't happen but be safe)
      if (coins.some(c => c.id === newId)) {
        stats.enriched[cc]++;   // count it as enriched via id match
        continue;
      }

      const newCoin = {
        id:    newId,
        cc,
        co,
        co_ar,
        dyn:   null,
        name:  coinName || '',
        nar:   '',
        yce:   yce || '',
        yah:   yah || '',
        metal: descData.metal  || '',
        wt:    descData.wt     ?? null,
        dia:   descData.dia    ?? null,
        km:    descData.km     || '',
        nref:  `N#${nid}`,
        nid,
        type:  coinType,
        mint:  '',
        o:     oImg || '',
        r:     rImg || '',
      };

      if (mintEntry) newCoin.mintageData = [mintEntry];
      if (prices)    newCoin.prices = prices;

      coins.push(newCoin);
      byNid.set(nid, newCoin);
      stats.appended[cc]++;
    }
  }
}

// ── Write output ──────────────────────────────────────────────────────────────

fs.writeFileSync(COINS_PATH, JSON.stringify(coins, null, 2), 'utf8');

// ── Report ────────────────────────────────────────────────────────────────────

const totalAfter = coins.length;
const allCCs = [...new Set([...Object.keys(stats.enriched), ...Object.keys(stats.appended)])].sort();

console.log('\n════════════════════════════════════════════════════════');
console.log(`  Coins before : ${totalBefore}`);
console.log(`  Coins after  : ${totalAfter}  (+${totalAfter - totalBefore} new)`);
console.log(`  Sudan file   : skipped (${stats.skipped} file)`);
console.log('════════════════════════════════════════════════════════');
console.log('  Country breakdown:');
console.log('  ' + 'CC'.padEnd(6) + 'Enriched'.padEnd(12) + 'Appended');
console.log('  ' + '──'.padEnd(6) + '────────'.padEnd(12) + '────────');
for (const cc of allCCs) {
  const e = stats.enriched[cc] || 0;
  const a = stats.appended[cc] || 0;
  console.log('  ' + cc.padEnd(6) + String(e).padEnd(12) + a);
}
console.log('════════════════════════════════════════════════════════');

if (stats.failed.length > 0) {
  console.log(`\n  ⚠  ${stats.failed.length} rows failed to parse (no nid):`);
  console.log('  ' + 'File'.padEnd(40) + 'Row'.padEnd(6) + 'Reason'.padEnd(25) + 'Name');
  for (const f of stats.failed) {
    console.log('  ' + f.file.padEnd(40) + String(f.rowNum).padEnd(6) + f.reason.padEnd(25) + (f.name || ''));
  }
} else {
  console.log('\n  ✓  No failed rows.');
}
console.log();
