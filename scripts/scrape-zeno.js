'use strict';

/**
 * Zeno.ru Islamic coin scraper
 *
 * Usage:
 *   node scripts/scrape-zeno.js --list-categories
 *   node scripts/scrape-zeno.js --dynasty umayyad --limit 50
 *   node scripts/scrape-zeno.js --category-id 609 --limit 50
 *   node scripts/scrape-zeno.js --all
 *
 * Progress is saved to scripts/zeno_progress.json after every 100 coins.
 * Output goes to scripts/zeno_raw.json.
 */

const fs    = require('fs');
const path  = require('path');
const https = require('https');

// ── Config ─────────────────────────────────────────────────────────────────────

const SCRIPTS_DIR   = path.resolve(__dirname);
const PROGRESS_FILE = path.join(SCRIPTS_DIR, 'zeno_progress.json');
const OUTPUT_FILE   = path.join(SCRIPTS_DIR, 'zeno_raw.json');

const BASE_URL      = 'https://www.zeno.ru';
const RATE_LIMIT_MS = 1100;   // min ms between requests
const JITTER_MS     = 400;    // max extra random ms
const RETRY_WAIT_MS = 60_000; // ms on 429/503
const BATCH_SIZE    = 100;    // save checkpoint every N coins
const LOG_EVERY     = 50;     // log to console every N coins
const MAX_DEPTH     = 8;      // max subcategory tree depth

// ── Islamic dynasty categories (real Zeno.ru IDs) ─────────────────────────────

const ISLAMIC_CATEGORIES = [
  { id:   609, name: 'Umayyad',               name_ar: 'الدولة الأموية' },
  { id:   543, name: 'Abbasid',               name_ar: 'الخلافة العباسية' },
  { id: 14353, name: 'Ayyubid',               name_ar: 'الأيوبيون' },
  { id:   880, name: 'Mamluk',                name_ar: 'المماليك' },
  { id:   580, name: 'Ottoman',               name_ar: 'الخلافة العثمانية' },
  { id:  5362, name: 'Fatimid',               name_ar: 'الخلافة الفاطمية' },
  { id:  1025, name: 'Buwayhid (Buyid)',      name_ar: 'البويهيون' },
  { id:  1104, name: 'Ghaznavid',             name_ar: 'الغزنويون' },
  { id:  1107, name: 'Great Seljuq',          name_ar: 'السلاجقة' },
  { id:   653, name: 'Ilkhanid',              name_ar: 'الإيلخانيون' },
  { id:   542, name: 'Timurid',               name_ar: 'التيموريون' },
  { id:  1100, name: 'Samanid',               name_ar: 'السامانيون' },
  { id:  1292, name: 'Hamdanid',              name_ar: 'الحمدانيون' },
  { id:  1030, name: 'Aghlabid',              name_ar: 'الأغالبة' },
  { id:   927, name: 'Almoravid',             name_ar: 'المرابطون' },
  { id:  1029, name: 'Almohad',               name_ar: 'الموحدون' },
  { id:  1024, name: 'Umayyad of al-Andalus', name_ar: 'الأمويون في الأندلس' },
  { id:   923, name: 'Safavid',               name_ar: 'الصفويون' },
  { id:  1478, name: 'Artuqid',               name_ar: 'الأرتقيون' },
  { id:  1102, name: 'Zangid',                name_ar: 'الزنكيون' },
  { id:  2333, name: 'Pre-Reform coinage',    name_ar: 'المسكوكات ما قبل الإصلاح' },
  { id:  1039, name: 'Ghorid',                name_ar: 'الغوريون' },
  { id:   885, name: 'Afsharid',              name_ar: 'الأفشاريون' },
  { id:   510, name: 'Qajar',                 name_ar: 'القاجاريون' },
  { id:  6311, name: 'Hafsid',                name_ar: 'الحفصيون' },
  { id:  4783, name: 'Merinid',               name_ar: 'المرينيون' },
  { id:  1484, name: 'Khwarazmshah',          name_ar: 'خوارزمشاه' },
];

// ── Metal normalisation ────────────────────────────────────────────────────────

const METAL_MAP = {
  'gold': 'Gold', 'silver': 'Silver', 'copper': 'Copper', 'bronze': 'Bronze',
  'billon': 'Billon', 'billion': 'Billon', 'brass': 'Brass',
  'au': 'Gold', 'ar': 'Silver', 'ae': 'Bronze', 'bi': 'Billon', 'fe': 'Iron',
};

function normaliseMetal(raw) {
  if (!raw) return '';
  const low = raw.toLowerCase().replace(/[^a-z]/g, '');
  for (const [k, v] of Object.entries(METAL_MAP)) {
    if (low === k || low.startsWith(k)) return v;
  }
  return raw.trim();
}

const ahToCe = (ah) => {
  const n = parseFloat(ah);
  return isNaN(n) ? '' : String(Math.round(n * 0.97 + 622));
};

// ── HTTP session (uses built-in fetch + AbortController for hard timeouts) ────

const FETCH_TIMEOUT_MS = 15000; // hard abort if no response in 15s

class ZenoSession {
  constructor() {
    this.cookie      = '';
    this.lastReqTime = 0;
  }

  async init() {
    const r1 = await this._raw(`${BASE_URL}/showphoto.php`);
    this._mergeCookies(r1.setCookie);
    await this._sleep(1500);
    const r2 = await this._raw(`${BASE_URL}/showphoto.php`);
    this._mergeCookies(r2.setCookie);
    await this._sleep(600);
    console.log('   Session ready. Cookie:', this.cookie.slice(0, 40));
  }

  async fetch(url, retries = 3) {
    const elapsed = Date.now() - this.lastReqTime;
    const wait    = RATE_LIMIT_MS + Math.floor(Math.random() * JITTER_MS) - elapsed;
    if (wait > 0) await this._sleep(wait);

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const r = await this._raw(url);
        this._mergeCookies(r.setCookie);
        this.lastReqTime = Date.now();

        if (r.body.includes('Forwarding to requested page')) {
          await this._sleep(1500);
          const r2 = await this._raw(url);
          this._mergeCookies(r2.setCookie);
          this.lastReqTime = Date.now();
          if (r2.body.includes('Forwarding')) {
            await this._sleep(2000);
            const r3 = await this._raw(url);
            this._mergeCookies(r3.setCookie);
            this.lastReqTime = Date.now();
            return r3.body;
          }
          return r2.body;
        }

        if (r.status === 429 || r.status === 503) {
          console.log(`  ⚠ HTTP ${r.status} — waiting 60s...`);
          await this._sleep(RETRY_WAIT_MS);
          continue;
        }
        if (r.status === 404) return null;
        if (r.status !== 200) throw new Error(`HTTP ${r.status}: ${url}`);
        return r.body;
      } catch (err) {
        if (attempt < retries) {
          await this._sleep(3000 * (attempt + 1));
          continue;
        }
        // Final failure: warn and return null rather than crashing
        console.warn(`  ✗ Giving up on ${url}: ${err.message}`);
        return null;
      }
    }
    return null;
  }

  async _raw(url, redirects = 5) {
    const controller = new AbortController();
    const timer      = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await globalThis.fetch(url, {
        signal:   controller.signal,
        redirect: 'manual',
        headers:  {
          'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
          'Accept':          'text/html,application/xhtml+xml,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
          'Cookie':          this.cookie,
        },
      });
      clearTimeout(timer);

      // Collect Set-Cookie headers
      const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];

      // Follow redirects manually (so we can persist cookies mid-chain)
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        this._mergeCookies(setCookie);
        const loc = new URL(res.headers.get('location'), url).href;
        if (redirects > 0) return this._raw(loc, redirects - 1);
        throw new Error(`Too many redirects: ${url}`);
      }

      const body = await res.text();
      return { body, status: res.status, setCookie };
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') throw new Error(`Timeout (${FETCH_TIMEOUT_MS}ms): ${url}`);
      throw err;
    }
  }

  _mergeCookies(setCookieArray) {
    if (!setCookieArray || !setCookieArray.length) return;
    const jar = new Map(
      this.cookie.split('; ').filter(Boolean).map(p => {
        const eq = p.indexOf('=');
        return [p.slice(0, eq), p.slice(eq + 1)];
      })
    );
    for (const line of setCookieArray) {
      const [pair] = line.split(';');
      const eq = pair.indexOf('=');
      jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
    this.cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
}

// ── HTML parsing ───────────────────────────────────────────────────────────────

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g,    '')
    .replace(/&amp;/g,      '&')
    .replace(/&lt;/g,       '<')
    .replace(/&gt;/g,       '>')
    .replace(/&quot;/g,     '"')
    .replace(/&#39;/g,      "'")
    .replace(/&nbsp;/g,     ' ')
    .replace(/&#(\d+);/g,    (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&#x([\da-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .trim();
}

function extractField(infoHtml, label) {
  const re = new RegExp(`<b>${label}[^<]*</b>([^<]*)`, 'i');
  const m  = infoHtml.match(re);
  return m ? stripHtml(m[1]).trim() : '';
}

function extractArabic(text) {
  const m = (text || '').match(/[؀-ۿݐ-ݿࢠ-ࣿ]+(?:\s+[؀-ۿݐ-ݿࢠ-ࣿ]+)*/g);
  return m ? m.join(' ').trim() : '';
}

function extractNum(str) {
  if (!str) return null;
  const m = str.match(/([\d.]+)/);
  return m ? parseFloat(m[1]) : null;
}

function extractAH(dateStr) {
  if (!dateStr) return '';
  const m = dateStr.match(/(?:AH\s*)?(\d{2,4})(?:\s*AH|\s*\/\s*\d{3,4})?/i);
  return m ? m[1] : '';
}

// ── Parse a coin detail page ───────────────────────────────────────────────────

function parseCoinPage(html, photoId, catMeta) {
  if (!html || html.includes('Forwarding to requested page')) return null;

  // Title line: <div>#ID: Dynasty, Denomination, Ruler, Mint, AH DATE</div>
  const titleM  = html.match(/<div>\s*#\d+:\s*([\s\S]*?)<\/div>/);
  const rawTitle = titleM ? stripHtml(titleM[1]).trim() : '';

  // Additional Info section
  const infoIdx = html.indexOf('Additional Info');
  const infoHtml = infoIdx >= 0 ? html.slice(infoIdx, infoIdx + 3000) : '';

  const weightRaw = extractField(infoHtml, 'Weight');
  const sizeRaw   = extractField(infoHtml, 'Size');
  const mintRaw   = extractField(infoHtml, 'Mint');
  const dateRaw   = extractField(infoHtml, 'Date');
  const denomRaw  = extractField(infoHtml, 'Denomination');
  const metalRaw  = extractField(infoHtml, 'Metal');

  // Photo URL
  const imgM    = html.match(/<img\s+class="photo"[^>]*src="([^"]+)"/);
  const photoUrl = imgM ? imgM[1] : '';

  // AH / CE
  const yah = extractAH(dateRaw);
  const yce  = yah ? ahToCe(yah) : '';

  // Mint
  const mintAr = extractArabic(mintRaw);
  const mintEn = mintRaw
    .replace(mintAr, '')
    .replace(/\(\s*\)/g, '')
    .replace(/[,\-\s]+$/g, '')
    .replace(/^[,\-\s]+/, '')
    .trim();

  // Name
  const coinName   = rawTitle || [denomRaw, catMeta.name].filter(Boolean).join(' - ') || `Z#${photoId}`;
  const coinNameAr = extractArabic(rawTitle);

  // Ruler heuristic — Zeno titles are free-form; this is best-effort.
  // Looks like a ruler: multi-word, starts with capital, no digit prefix, no metal/place keywords
  function looksLikeRuler(seg) {
    if (!seg || seg.length < 4 || seg.length > 60) return false;
    if (/^\d/.test(seg)) return false;  // starts with digit (date)
    if (/^(AH|CE|year|from|mint|temp\.|NM\b)/i.test(seg)) return false;
    if (/^(AR|AE|AV|AU|BI|Dirham|Dinar|Fals|Fils|Para|Qirsh|Drachm|Fels)/i.test(seg)) return false;
    // Single all-caps or title-case short word is likely a place
    if (/^[A-Z][a-z]+$/.test(seg) && seg.split(' ').length === 1) return false;
    return seg.split(/\s+/).length >= 2 || /[A-Z]/.test(seg[0]);
  }

  let ruler = '';
  const titleParts = rawTitle.split(/,\s*/);

  // Try each segment from index 1 onward, pick first that looks like a ruler
  for (let i = 1; i < Math.min(titleParts.length, 5); i++) {
    const seg = titleParts[i]
      .replace(/^(temp\.|ca\.|fl\.)\s*/i, '')
      .replace(/\s*\([\d\-\s]+AH\)\s*/g, '')
      .trim();
    if (looksLikeRuler(seg)) {
      ruler = seg;
      break;
    }
  }

  // Fallback: title starts with ruler name (no dynasty prefix, e.g. "Abd al-Malik bin Marwan ...")
  if (!ruler && titleParts.length >= 1) {
    let seg = titleParts[0]
      .replace(/\s+(AR|AE|AU|AV|BI)\s+.*$/i, '')
      .replace(/\s+(Dirham|Dinar|Fals|Fils|Para).*/i, '')
      .replace(/\s*\([\d\-\s]+AH\)\s*/g, '')
      .trim();
    if (!/^(Umayyad|Abbasid|Fatimid|Mamluk|Ottoman|Ayyubid|Seljuq|Buyid|Ilkhan|Timurid|Safavid|Ghaznavid|Samanid|Artuqid|Zangid|Almoravid|Almohad|Aghlabid|Hamdanid|Hafsid|Merinid|Ilkhan|Ghorid|Afsharid|Qajar)/i.test(seg)
        && looksLikeRuler(seg)) {
      ruler = seg;
    }
  }

  const rulerAr = extractArabic(ruler);

  const id = String(photoId);
  return {
    id:             `zeno-${id}`,
    cc:             'IS',
    co:             'Islamic',
    co_ar:          'إسلامي',
    dyn:            catMeta.name_ar || '',
    name:           coinName,
    nar:            coinNameAr,
    yce,
    yah,
    metal:          normaliseMetal(metalRaw),
    wt:             extractNum(weightRaw),
    dia:            extractNum(sizeRaw),
    km:             '',
    nref:           `Z#${id}`,
    nid:            id,
    type:           'Circulation',
    mint:           mintEn,
    mint_ar:        mintAr,
    ruler,
    ruler_ar:       rulerAr,
    obverse_legend: '',
    reverse_legend: '',
    o:              photoUrl,
    r:              '',
    prices:         null,
    mintageData:    [],
  };
}

// ── Gallery: collect all coin IDs under a category (recursive) ────────────────

/**
 * Given a gallery page HTML, returns:
 *   subcats: array of child category IDs (from folder links)
 *   coinIds: Set of unique coin photo IDs on this page
 *   nextPage: URL of next page if paginated, else null
 */
function parseGalleryPage(html, catId, currentPage) {
  const subcats = [];
  const coinIds = new Set();

  // Subcategory folders: <a href="showgallery.php?cat=NNN"><img src="...folder.png"...>NAME</a>
  const folderRe = /href="[^"]*showgallery\.php\?cat=(\d+)"[^>]*>\s*<img[^>]+folder\.png/g;
  let m;
  while ((m = folderRe.exec(html)) !== null) {
    const id = parseInt(m[1]);
    if (id !== catId) subcats.push(id);
  }

  // Also check the subcategory table rows (lastnav pattern)
  const tableRe = /showgallery\.php\?cat=(\d+)"><img[^>]+folder\.png/g;
  while ((m = tableRe.exec(html)) !== null) {
    const id = parseInt(m[1]);
    if (id !== catId && !subcats.includes(id)) subcats.push(id);
  }

  // Coin thumbnails: showphoto.php?photo=NNN
  const photoRe = /showphoto\.php\?photo=(\d+)/g;
  while ((m = photoRe.exec(html)) !== null) coinIds.add(m[1]);

  // Pagination: page=N links
  let nextPage = null;
  const nextPageM = html.match(new RegExp(`showgallery\\.php\\?cat=${catId}&page=(${currentPage + 1})`));
  if (nextPageM) {
    nextPage = `${BASE_URL}/showgallery.php?cat=${catId}&page=${currentPage + 1}`;
  }

  return { subcats, coinIds, nextPage };
}

/**
 * Collect all coin photo IDs under catId recursively.
 * Respects limit (stops collecting when reached).
 */
async function collectIds(session, catId, limit, collectedIds = new Set(), visitedCats = new Set(), depth = 0) {
  if (depth > MAX_DEPTH || visitedCats.has(catId) || collectedIds.size >= limit) return;
  visitedCats.add(catId);

  let page = 1;
  while (collectedIds.size < limit) {
    const url  = `${BASE_URL}/showgallery.php?cat=${catId}${page > 1 ? `&page=${page}` : ''}`;
    let html;
    try {
      html = await session.fetch(url);
    } catch (err) {
      console.warn(`  ✗ Gallery fetch failed: ${url} — ${err.message}`);
      break;
    }
    if (!html) break;

    const { subcats, coinIds, nextPage } = parseGalleryPage(html, catId, page);

    for (const id of coinIds) {
      collectedIds.add(id);
      if (collectedIds.size >= limit) break;
    }

    // Recurse into subcategories (depth-first so we get coins from all branches)
    for (const subCatId of subcats) {
      if (collectedIds.size >= limit) break;
      try {
        await collectIds(session, subCatId, limit, collectedIds, visitedCats, depth + 1);
      } catch (err) {
        console.warn(`  ✗ Subcategory ${subCatId} walk failed: ${err.message} — skipping`);
      }
    }

    if (!nextPage) break;
    page++;
  }
}

// ── Progress / output ─────────────────────────────────────────────────────────

const loadProgress = () => {
  try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); } catch { return { scrapedIds: [] }; }
};
const saveProgress = (p) => fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2));
const loadOutput   = () => {
  try { return JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8')); } catch { return []; }
};
const saveOutput   = (c) => fs.writeFileSync(OUTPUT_FILE, JSON.stringify(c, null, 2));

// ── Scrape one dynasty category ────────────────────────────────────────────────

async function scrapeCategory(session, catMeta, limit, progress, output) {
  const { id: catId, name } = catMeta;
  console.log(`\n══ ${name} (cat=${catId}, limit=${limit === Infinity ? 'all' : limit}) ══`);

  // Phase A: collect all photo IDs under this category
  console.log('  Collecting coin IDs (recursive gallery walk)...');
  const allIds = new Set();
  try {
    await collectIds(session, catId, limit, allIds, new Set());
  } catch (err) {
    console.warn(`  ✗ Gallery walk error: ${err.message} — proceeding with ${allIds.size} IDs collected so far`);
  }
  console.log(`  Found ${allIds.size} unique photo IDs.`);

  const doneSet  = new Set(progress.scrapedIds);
  const toFetch  = [...allIds].filter(id => !doneSet.has(id));
  console.log(`  ${toFetch.length} to fetch (${allIds.size - toFetch.length} already done).`);

  let scraped = 0, failed = 0;

  for (const photoId of toFetch) {
    if (allIds.size >= limit && scraped >= limit) break;

    let html;
    try {
      html = await session.fetch(`${BASE_URL}/showphoto.php?photo=${photoId}`);
    } catch (err) {
      console.warn(`  ✗ Coin #${photoId}: ${err.message}`);
      failed++;
      continue;
    }

    const coin = parseCoinPage(html, photoId, catMeta);
    if (coin) {
      output.push(coin);
      progress.scrapedIds.push(photoId);
      scraped++;

      if (scraped % LOG_EVERY === 0) {
        console.log(`  ✓ ${scraped} scraped from ${name}  (total output: ${output.length})`);
      }
      if (scraped % BATCH_SIZE === 0) {
        saveProgress(progress);
        saveOutput(output);
        console.log(`  💾 Checkpoint at ${scraped} coins.`);
      }
    } else {
      // Mark as done even if parsing failed (to avoid re-fetching)
      progress.scrapedIds.push(photoId);
    }
  }

  saveProgress(progress);
  saveOutput(output);
  console.log(`  ✓ ${name} complete: ${scraped} scraped, ${failed} failed.`);
  return scraped;
}

// ── CLI ────────────────────────────────────────────────────────────────────────

async function main() {
  const args    = process.argv.slice(2);
  const getArg  = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
  const hasFlag = (f) => args.includes(f);

  // --list-categories: just print and exit
  if (hasFlag('--list-categories')) {
    console.log('\n─── Islamic Coin Categories on Zeno.ru ────────────────────────────────');
    console.log('CatID  | Name                        | Arabic');
    console.log('-------+-----------------------------+-------------------------------');
    for (const c of ISLAMIC_CATEGORIES) {
      console.log(`${String(c.id).padEnd(7)}| ${c.name.padEnd(29)}| ${c.name_ar}`);
    }
    console.log(`\nTotal: ${ISLAMIC_CATEGORIES.length} categories`);
    return;
  }

  let cats  = [];
  let limit = Infinity;
  if (getArg('--limit')) limit = parseInt(getArg('--limit'));

  if (hasFlag('--all')) {
    cats = ISLAMIC_CATEGORIES;
  } else if (getArg('--category-id')) {
    const id  = parseInt(getArg('--category-id'));
    cats = [ISLAMIC_CATEGORIES.find(c => c.id === id) || { id, name: `Category ${id}`, name_ar: '' }];
  } else if (getArg('--dynasty')) {
    const q = getArg('--dynasty').toLowerCase();
    const cat = ISLAMIC_CATEGORIES.find(c => c.name.toLowerCase().includes(q));
    if (!cat) { console.error(`"${getArg('--dynasty')}" not found. Use --list-categories.`); process.exit(1); }
    cats = [cat];
  } else {
    console.log('No target specified — running pilot: Umayyad, 50 coins.\n');
    cats  = [ISLAMIC_CATEGORIES[0]];
    if (limit === Infinity) limit = 50;
  }

  console.log(`Target    : ${cats.map(c => c.name).join(', ')}`);
  console.log(`Limit     : ${limit === Infinity ? 'all' : limit} coins per category`);
  console.log(`Output    : ${OUTPUT_FILE}`);
  console.log(`Progress  : ${PROGRESS_FILE}`);

  console.log('\n── Establishing Zeno.ru session...');
  const session = new ZenoSession();
  await session.init();

  const progress = loadProgress();
  const output   = loadOutput();

  let total = 0;
  for (const cat of cats) {
    total += await scrapeCategory(session, cat, limit, progress, output);
  }

  console.log(`\n✅ Done! Scraped ${total} new coins. Total in file: ${output.length}`);

  if (output.length > 0) {
    console.log('\n─── Sample coins (first 3) ────────────────────────────────────────────');
    output.slice(0, 3).forEach(c => console.log(JSON.stringify(c, null, 2)));
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
