'use strict';

/**
 * scrape-sasanian.js
 *
 * Scrapes Sasanian coins from Zeno.ru (cat=611 "Sasanians" and all subcategories).
 * Produces src/data/sasanian_coins.json and a progress checkpoint file.
 *
 * Includes all enrichment fields from the first scrape:
 *   zeno_description, obverse_legend, reverse_legend,
 *   references, condition, die_axis, upload_date, keywords
 *
 * Usage:
 *   node scripts/scrape-sasanian.js --test          # 5 coins, print samples
 *   node scripts/scrape-sasanian.js --run            # full run
 *   node scripts/scrape-sasanian.js --resume         # continue from checkpoint
 *   node scripts/scrape-sasanian.js --limit 200      # custom limit
 */

const fs   = require('fs');
const path = require('path');

// ── Paths ──────────────────────────────────────────────────────────────────────
const SCRIPTS_DIR    = path.resolve(__dirname);
const OUTPUT_FILE    = path.join(SCRIPTS_DIR, '..', 'src', 'data', 'sasanian_coins.json');
const PROGRESS_FILE  = path.join(SCRIPTS_DIR, 'sasanian_progress.json');

// ── Config ─────────────────────────────────────────────────────────────────────
const BASE_URL         = 'https://www.zeno.ru';
const RATE_LIMIT_MS    = 2000;
const JITTER_MS        = 500;
const RETRY_WAIT_MS    = 90_000;
const FETCH_TIMEOUT_MS = 15_000;
const MAX_DEPTH        = 8;
const BATCH_SIZE       = 500;
const LOG_EVERY        = 50;
const TEST_LIMIT       = 5;

// ── Sasanian root category ─────────────────────────────────────────────────────
const SASANIAN_CAT = {
  id:      611,
  name:    'Sasanian Empire',
  name_ar: 'الساسانيون',
  cc:      'SS',
};

// ── CLI ────────────────────────────────────────────────────────────────────────
const args     = process.argv.slice(2);
const hasFlag  = (f) => args.includes(f);
const getArg   = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };

const TEST_MODE   = hasFlag('--test');
const RESUME_MODE = hasFlag('--resume');
const FULL_RUN    = hasFlag('--run');
const CUSTOM_LIMIT = getArg('--limit') ? parseInt(getArg('--limit')) : null;

const LIMIT = TEST_MODE ? TEST_LIMIT
            : CUSTOM_LIMIT ? CUSTOM_LIMIT
            : Infinity;

// ── ZenoSession ───────────────────────────────────────────────────────────────

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
    console.log('  Session ready. Cookie:', this.cookie.slice(0, 60) + '...');
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
          console.log(`  ⚠ HTTP ${r.status} — waiting 90s...`);
          await this._sleep(RETRY_WAIT_MS);
          continue;
        }
        if (r.status === 404) return null;
        if (r.status !== 200) throw new Error(`HTTP ${r.status}: ${url}`);
        return r.body;
      } catch (err) {
        if (attempt < retries) { await this._sleep(3000 * (attempt + 1)); continue; }
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
          'Accept-Language': 'en-US,en;q=0.9',
          'Cookie':          this.cookie,
        },
      });
      clearTimeout(timer);
      const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
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
      if (err.name === 'AbortError') throw new Error(`Timeout: ${url}`);
      throw err;
    }
  }

  _mergeCookies(arr) {
    if (!arr || !arr.length) return;
    const jar = new Map(
      this.cookie.split('; ').filter(Boolean).map(p => {
        const eq = p.indexOf('=');
        return [p.slice(0, eq), p.slice(eq + 1)];
      })
    );
    for (const line of arr) {
      const [pair] = line.split(';');
      const eq = pair.indexOf('=');
      jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
    this.cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
}

// ── HTML helpers ───────────────────────────────────────────────────────────────

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
    .replace(/&#(\d+);/g,   (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&#x([\da-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .trim();
}

function extractField(infoHtml, label) {
  const re = new RegExp(`<b>${label}[^<]*</b>([^<]*)`, 'i');
  const m  = infoHtml.match(re);
  return m ? stripHtml(m[1]).trim() : '';
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

function ahToCe(ah) {
  const n = parseInt(ah);
  return isNaN(n) ? '' : String(Math.round(n * 0.97 + 622));
}

function normaliseMetal(raw) {
  const s = (raw || '').toLowerCase();
  if (/^ar\b|silver/.test(s)) return 'Silver';
  if (/^av\b|^au\b|gold/.test(s))  return 'Gold';
  if (/^ae\b|copper|bronze/.test(s)) return 'Bronze';
  if (/billon/.test(s)) return 'Billon';
  return raw || '';
}

// ── Photo Details extraction (from enrich-zeno-descriptions.js) ───────────────

function parseEnrichmentData(html) {
  const result = {};
  if (!html) return result;

  // ── Photo Details box ──
  const pdIdx = html.indexOf('Photo Details');
  if (pdIdx >= 0) {
    const pdBlock = html.slice(pdIdx, pdIdx + 4000);

    // Description: italic span inside Photo Details
    const descM = pdBlock.match(/<span[^>]*style="[^"]*italic[^"]*"[^>]*>([\s\S]*?)<\/span>/i)
                || pdBlock.match(/<i>([\s\S]{10,}?)<\/i>/i);
    if (descM) {
      const raw = stripHtml(descM[1]).replace(/\s+/g, ' ').trim();
      if (raw.length > 5) result.zeno_description = raw;
    }

    // Upload date
    const dateM = pdBlock.match(/(\d{1,2}-\w+-\d{4})/);
    if (dateM) result.upload_date = dateM[1];

    // Views
    const viewM = pdBlock.match(/Views:\s*(\d+)/i);
    if (viewM) result.views = parseInt(viewM[1]);
  }

  // ── Additional Info box ──
  const aiIdx = html.indexOf('Additional Info');
  if (aiIdx >= 0) {
    const aiBlock = html.slice(aiIdx, aiIdx + 3000);

    // Keywords: linked keyword spans
    const kwRe  = /<a[^>]+keywords[^>]*>([^<]+)<\/a>/g;
    const kws   = [];
    let kwM;
    while ((kwM = kwRe.exec(aiBlock)) !== null) kws.push(kwM[1].trim());
    if (kws.length) result.keywords = kws.join(' ');

    // Die axis
    const axisM = aiBlock.match(/<b>Die axis[^<]*<\/b>([^<]*)/i);
    if (axisM) result.die_axis = stripHtml(axisM[1]).trim();
  }

  // ── Description text patterns ──
  const desc = result.zeno_description || '';

  // OBVERSE: ... / REVERSE: ...
  const obvM = desc.match(/OBVERSE:\s*([^\n]+?)(?:\n|REVERSE:|$)/i);
  if (obvM) result.obverse_legend = obvM[1].trim();

  const revM = desc.match(/REVERSE:\s*([^\n]+?)(?:\n|REFERENCES:|CONDITION:|$)/i);
  if (revM) result.reverse_legend = revM[1].trim();

  // REFERENCES: ...
  const refM = desc.match(/REFERENCES?:\s*([^\n]+)/i);
  if (refM) result.references = refM[1].trim();

  // CONDITION: ...
  const conM = desc.match(/CONDITION:\s*([^\n]+)/i);
  if (conM) result.condition = conM[1].trim();

  return result;
}

// ── Parse a coin detail page ───────────────────────────────────────────────────

function parseCoinPage(html, photoId) {
  if (!html || html.includes('Forwarding to requested page')) return null;

  // Title line
  const titleM   = html.match(/<div>\s*#\d+:\s*([\s\S]*?)<\/div>/);
  const rawTitle = titleM ? stripHtml(titleM[1]).trim() : '';

  // Additional Info section
  const infoIdx  = html.indexOf('Additional Info');
  const infoHtml = infoIdx >= 0 ? html.slice(infoIdx, infoIdx + 3000) : '';

  const weightRaw = extractField(infoHtml, 'Weight');
  const sizeRaw   = extractField(infoHtml, 'Size');
  const mintRaw   = extractField(infoHtml, 'Mint');
  const dateRaw   = extractField(infoHtml, 'Date');
  const denomRaw  = extractField(infoHtml, 'Denomination');
  const metalRaw  = extractField(infoHtml, 'Metal');

  // Photo URL
  const imgM     = html.match(/<img\s+class="photo"[^>]*src="([^"]+)"/);
  const photoUrl = imgM ? imgM[1] : '';

  // Category breadcrumb — extract ruler/king name from subcategory
  const crumbRe  = /showgallery\.php\?cat=\d+[^>]*>([^<]{3,80})</g;
  const crumbs   = [];
  let cm;
  while ((cm = crumbRe.exec(html)) !== null) {
    const name = stripHtml(cm[1]).trim();
    if (name && !name.includes('Sasanian') && !name.includes('PRE-ISLAMIC') && !name.includes('Iran')) {
      crumbs.push(name);
    }
  }
  // Last breadcrumb segment closest to the coin is most specific ruler
  const subCatName = crumbs[crumbs.length - 1] || '';

  const yah = extractAH(dateRaw);
  const yce = yah ? ahToCe(yah) : '';

  const id = String(photoId);
  const enrichment = parseEnrichmentData(html);

  // Mint: use Mint field from Additional Info, fallback to rawTitle parsing
  const mintRawClean = mintRaw.replace(/[,\-\s]+$/g, '').trim();

  // Ruler: try subCatName first (per-king subcategory), then title heuristic
  let ruler = subCatName;

  const coin = {
    id:             `zeno-${id}`,
    cc:             'SS',
    co:             'Sasanian Empire',
    co_ar:          'الإمبراطورية الساسانية',
    dyn:            'الساسانيون',
    dyn_en:         'Sasanian Empire',
    period_ce:      '224-651',
    name:           rawTitle || [denomRaw, ruler].filter(Boolean).join(', ') || `Z#${id}`,
    nar:            '',
    yce,
    yah,
    metal:          normaliseMetal(metalRaw),
    wt:             extractNum(weightRaw),
    dia:            extractNum(sizeRaw),
    km:             '',
    nref:           `Z#${id}`,
    nid:            id,
    type:           'Circulation',
    mint:           mintRawClean,
    mint_ar:        '',
    ruler,
    ruler_ar:       '',
    o:              photoUrl,
    r:              '',
    prices:         null,
    mintageData:    [],
    // Enrichment fields
    zeno_description: enrichment.zeno_description || null,
    upload_date:      enrichment.upload_date       || null,
    keywords:         enrichment.keywords          || null,
    obverse_legend:   enrichment.obverse_legend    || null,
    reverse_legend:   enrichment.reverse_legend    || null,
    references:       enrichment.references        || null,
    condition:        enrichment.condition         || null,
    die_axis:         enrichment.die_axis          || null,
  };

  return coin;
}

// ── Gallery walk ───────────────────────────────────────────────────────────────

function parseGalleryPage(html, catId, currentPage) {
  const subcats  = [];
  const coinIds  = new Set();

  const folderRe = /href="[^"]*showgallery\.php\?cat=(\d+)"[^>]*>\s*<img[^>]+folder\.png/g;
  let m;
  while ((m = folderRe.exec(html)) !== null) {
    const id = parseInt(m[1]);
    if (id !== catId) subcats.push(id);
  }

  const tableRe = /showgallery\.php\?cat=(\d+)"><img[^>]+folder\.png/g;
  while ((m = tableRe.exec(html)) !== null) {
    const id = parseInt(m[1]);
    if (id !== catId && !subcats.includes(id)) subcats.push(id);
  }

  const photoRe = /showphoto\.php\?photo=(\d+)/g;
  while ((m = photoRe.exec(html)) !== null) coinIds.add(m[1]);

  let nextPage = null;
  if (html.match(new RegExp(`showgallery\\.php\\?cat=${catId}&page=(${currentPage + 1})`))) {
    nextPage = `${BASE_URL}/showgallery.php?cat=${catId}&page=${currentPage + 1}`;
  }

  return { subcats, coinIds, nextPage };
}

async function collectIds(session, catId, limit, collected = new Set(), visited = new Set(), depth = 0) {
  if (depth > MAX_DEPTH || visited.has(catId) || collected.size >= limit) return;
  visited.add(catId);

  let page = 1;
  while (collected.size < limit) {
    const url = `${BASE_URL}/showgallery.php?cat=${catId}${page > 1 ? `&page=${page}` : ''}`;
    let html;
    try { html = await session.fetch(url); } catch (err) { console.warn(`  ✗ Gallery ${url}: ${err.message}`); break; }
    if (!html) break;

    const { subcats, coinIds, nextPage } = parseGalleryPage(html, catId, page);

    for (const id of coinIds) {
      collected.add(id);
      if (collected.size >= limit) break;
    }

    for (const subId of subcats) {
      if (collected.size >= limit) break;
      try { await collectIds(session, subId, limit, collected, visited, depth + 1); }
      catch (err) { console.warn(`  ✗ Subcat ${subId}: ${err.message}`); }
    }

    if (!nextPage) break;
    page++;
  }
}

// ── Progress helpers ───────────────────────────────────────────────────────────

const loadProgress = () => {
  try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); }
  catch { return { scrapedIds: [] }; }
};
const saveProgress = (p) => fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2));
const loadOutput   = () => {
  try { return JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8')); }
  catch { return []; }
};
const saveOutput   = (c) => fs.writeFileSync(OUTPUT_FILE, JSON.stringify(c, null, 2));

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  if (!TEST_MODE && !FULL_RUN && !RESUME_MODE && !CUSTOM_LIMIT) {
    console.log('No mode specified.');
    console.log('Usage:');
    console.log('  node scripts/scrape-sasanian.js --test       # 5 coins');
    console.log('  node scripts/scrape-sasanian.js --run        # full run');
    console.log('  node scripts/scrape-sasanian.js --resume     # resume');
    console.log('  node scripts/scrape-sasanian.js --limit 200  # custom limit');
    process.exit(0);
  }

  console.log('Sasanian coin scraper');
  console.log('  Category: cat=611 (Sasanians on Zeno.ru)');
  console.log('  Parent: cat=784 Iran > cat=781 PRE-ISLAMIC ASIA');
  console.log('  Mode:', TEST_MODE ? 'TEST (5 coins)' : RESUME_MODE ? 'RESUME' : `FULL (limit: ${LIMIT === Infinity ? 'all' : LIMIT})`);
  console.log('');

  const session  = new ZenoSession();
  await session.init();

  const progress = RESUME_MODE ? loadProgress() : { scrapedIds: [] };
  const output   = RESUME_MODE ? loadOutput() : [];

  console.log(`\n══ Sasanian Empire (cat=611) ══`);
  console.log('  Collecting coin IDs (recursive gallery walk)...');

  const allIds = new Set();
  await collectIds(session, SASANIAN_CAT.id, LIMIT, allIds, new Set());
  console.log(`  Found ${allIds.size} unique photo IDs.`);

  const doneSet = new Set(progress.scrapedIds);
  const toFetch = [...allIds].filter(id => !doneSet.has(id));
  console.log(`  ${toFetch.length} to fetch (${allIds.size - toFetch.length} already done).`);

  let scraped = 0, failed = 0;

  for (const photoId of toFetch) {
    let html;
    try {
      html = await session.fetch(`${BASE_URL}/showphoto.php?photo=${photoId}`);
    } catch (err) {
      console.warn(`  ✗ Coin #${photoId}: ${err.message}`);
      failed++;
      continue;
    }

    const coin = parseCoinPage(html, photoId);
    if (coin) {
      output.push(coin);
      progress.scrapedIds.push(photoId);
      scraped++;

      if (TEST_MODE) {
        console.log(`\n── Sample coin ${scraped} ──────────────────────────────────────`);
        console.log(`  id:              ${coin.id}`);
        console.log(`  name:            ${coin.name}`);
        console.log(`  ruler:           ${coin.ruler}`);
        console.log(`  mint:            ${coin.mint}`);
        console.log(`  metal:           ${coin.metal}`);
        console.log(`  wt:              ${coin.wt}`);
        console.log(`  dia:             ${coin.dia}`);
        console.log(`  yce/yah:         ${coin.yce} / ${coin.yah}`);
        console.log(`  zeno_description: ${coin.zeno_description ? coin.zeno_description.slice(0, 120) + '...' : 'null'}`);
        console.log(`  obverse_legend:  ${coin.obverse_legend || 'null'}`);
        console.log(`  reverse_legend:  ${coin.reverse_legend || 'null'}`);
        console.log(`  references:      ${coin.references || 'null'}`);
        console.log(`  condition:       ${coin.condition || 'null'}`);
        console.log(`  die_axis:        ${coin.die_axis || 'null'}`);
        console.log(`  keywords:        ${coin.keywords || 'null'}`);
        console.log(`  upload_date:     ${coin.upload_date || 'null'}`);
        console.log(`  image:           ${coin.o ? coin.o.slice(0, 80) : 'null'}`);
      } else if (scraped % LOG_EVERY === 0) {
        console.log(`  ✓ ${scraped} scraped  (total: ${output.length})`);
      }

      if (scraped % BATCH_SIZE === 0) {
        saveProgress(progress);
        saveOutput(output);
        console.log(`  💾 Checkpoint: ${scraped} coins saved.`);
      }
    } else {
      progress.scrapedIds.push(photoId);
    }

    if (LIMIT !== Infinity && scraped >= LIMIT) break;
  }

  saveProgress(progress);
  saveOutput(output);

  console.log(`\n══ Done ══`);
  console.log(`  Scraped: ${scraped}`);
  console.log(`  Failed:  ${failed}`);
  console.log(`  Output:  ${OUTPUT_FILE}`);

  if (TEST_MODE) {
    console.log(`\nTest complete. ${scraped} sample coins shown above.`);
    console.log(`Run with --run to scrape all Sasanian coins.`);
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
