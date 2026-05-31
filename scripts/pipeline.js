'use strict';

/**
 * pipeline.js — scrape + merge for multiple dynasties in one process.
 * Runs each dynasty, merges into coins.json, then moves to the next.
 *
 * Usage:  node scripts/pipeline.js
 * Log:    scripts/pipeline.log  (stdout+stderr via shell redirect)
 */

const fs   = require('fs');
const path = require('path');

const SCRIPTS_DIR   = path.resolve(__dirname);
const PROGRESS_FILE = path.join(SCRIPTS_DIR, 'zeno_progress.json');
const OUTPUT_FILE   = path.join(SCRIPTS_DIR, 'zeno_raw.json');
const COINS_FILE    = path.resolve(SCRIPTS_DIR, '../src/data/coins.json');

// ── Pipeline definition ────────────────────────────────────────────────────────

const PIPELINE = [
  { id:   609, name: 'Umayyad',  name_ar: 'الدولة الأموية',       limit: Infinity },
  { id:   543, name: 'Abbasid',  name_ar: 'الخلافة العباسية',     limit: 2000     },
  { id:  5362, name: 'Fatimid',  name_ar: 'الخلافة الفاطمية',     limit: Infinity },
  { id: 14353, name: 'Ayyubid',  name_ar: 'الأيوبيون',            limit: Infinity },
  { id:   880, name: 'Mamluk',   name_ar: 'المماليك',             limit: Infinity },
];

// ── Config ─────────────────────────────────────────────────────────────────────

const BASE_URL        = 'https://www.zeno.ru';
const RATE_LIMIT_MS   = 1100;
const JITTER_MS       = 400;
const RETRY_WAIT_MS   = 60_000;
const BATCH_SIZE      = 100;
const LOG_EVERY       = 50;
const MAX_DEPTH       = 8;
const FETCH_TIMEOUT   = 15_000;

// ── Helpers ────────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  process.stdout.write(`[${ts}] ${msg}\n`);
}

const ahToCe = ah => {
  const n = parseFloat(ah);
  return isNaN(n) ? '' : String(Math.round(n * 0.97 + 622));
};

const METAL_MAP = {
  'gold':'Gold','silver':'Silver','copper':'Copper','bronze':'Bronze',
  'billon':'Billon','billion':'Billon','brass':'Brass',
  'au':'Gold','ar':'Silver','ae':'Bronze','bi':'Billon','fe':'Iron',
};
function normaliseMetal(raw) {
  if (!raw) return '';
  const low = raw.toLowerCase().replace(/[^a-z]/g, '');
  for (const [k, v] of Object.entries(METAL_MAP)) if (low === k || low.startsWith(k)) return v;
  return raw.trim();
}

// ── HTTP session ───────────────────────────────────────────────────────────────

class ZenoSession {
  constructor() { this.cookie = ''; this.lastReq = 0; }

  async init() {
    const r1 = await this._raw(`${BASE_URL}/showphoto.php`);
    this._mergeCookies(r1.sc);
    await sleep(1500);
    const r2 = await this._raw(`${BASE_URL}/showphoto.php`);
    this._mergeCookies(r2.sc);
    await sleep(600);
    log(`Session ready. Cookie: ${this.cookie.slice(0, 45)}...`);
  }

  async get(url, retries = 3) {
    const wait = RATE_LIMIT_MS + Math.floor(Math.random() * JITTER_MS) - (Date.now() - this.lastReq);
    if (wait > 0) await sleep(wait);

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const r = await this._raw(url);
        this._mergeCookies(r.sc);
        this.lastReq = Date.now();

        if (r.body && r.body.includes('Forwarding to requested page')) {
          await sleep(1500);
          const r2 = await this._raw(url);
          this._mergeCookies(r2.sc);
          this.lastReq = Date.now();
          if (r2.body && r2.body.includes('Forwarding')) {
            await sleep(2000);
            const r3 = await this._raw(url);
            this._mergeCookies(r3.sc);
            this.lastReq = Date.now();
            return r3.body;
          }
          return r2.body;
        }

        if (r.status === 429 || r.status === 503) {
          log(`⚠ HTTP ${r.status} at ${url} — waiting 60s...`);
          await sleep(RETRY_WAIT_MS);
          continue;
        }
        if (r.status === 404) return null;
        if (r.status !== 200) throw new Error(`HTTP ${r.status}: ${url}`);
        return r.body;
      } catch (err) {
        if (attempt < retries) { await sleep(3000 * (attempt + 1)); continue; }
        log(`✗ Giving up on ${url}: ${err.message}`);
        return null;
      }
    }
    return null;
  }

  async _raw(url, redirects = 5) {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
    try {
      const res = await globalThis.fetch(url, {
        signal: ctrl.signal, redirect: 'manual',
        headers: {
          'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
          'Accept':          'text/html,application/xhtml+xml,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
          'Cookie':          this.cookie,
        },
      });
      clearTimeout(timer);
      const sc = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        this._mergeCookies(sc);
        const loc = new URL(res.headers.get('location'), url).href;
        return redirects > 0 ? this._raw(loc, redirects - 1) : { body: '', status: 0, sc: [] };
      }
      const body = await res.text();
      return { body, status: res.status, sc };
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') throw new Error(`Timeout ${FETCH_TIMEOUT}ms: ${url}`);
      throw err;
    }
  }

  _mergeCookies(sc) {
    if (!sc || !sc.length) return;
    const jar = new Map(this.cookie.split('; ').filter(Boolean).map(p => {
      const eq = p.indexOf('='); return [p.slice(0, eq), p.slice(eq + 1)];
    }));
    for (const line of sc) {
      const [pair] = line.split(';');
      const eq = pair.indexOf('=');
      jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
    this.cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }
}

// ── HTML parsing ───────────────────────────────────────────────────────────────

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')
    .replace(/&#39;/g,"'").replace(/&nbsp;/g,' ')
    .replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(parseInt(n)))
    .replace(/&#x([\da-f]+);/gi,(_,h)=>String.fromCharCode(parseInt(h,16)))
    .trim();
}

function extractField(html, label) {
  const m = html.match(new RegExp(`<b>${label}[^<]*</b>([^<]*)`, 'i'));
  return m ? stripHtml(m[1]).trim() : '';
}

function extractArabic(text) {
  const m = (text||'').match(/[؀-ۿݐ-ݿࢠ-ࣿ]+(?:\s+[؀-ۿݐ-ݿࢠ-ࣿ]+)*/g);
  return m ? m.join(' ').trim() : '';
}
function extractNum(s) { const m=(s||'').match(/([\d.]+)/); return m?parseFloat(m[1]):null; }
function extractAH(s) { const m=(s||'').match(/(?:AH\s*)?(\d{2,4})(?:\s*AH|\s*\/\s*\d{3,4})?/i); return m?m[1]:''; }

// ── Parse coin detail page ─────────────────────────────────────────────────────

function parseCoinPage(html, photoId, catMeta) {
  if (!html || html.includes('Forwarding to requested page')) return null;

  const titleM   = html.match(/<div>\s*#\d+:\s*([\s\S]*?)<\/div>/);
  const rawTitle = titleM ? stripHtml(titleM[1]).trim() : '';

  const infoIdx  = html.indexOf('Additional Info');
  const infoHtml = infoIdx >= 0 ? html.slice(infoIdx, infoIdx + 3000) : '';

  const weightRaw = extractField(infoHtml, 'Weight');
  const sizeRaw   = extractField(infoHtml, 'Size');
  const mintRaw   = extractField(infoHtml, 'Mint');
  const dateRaw   = extractField(infoHtml, 'Date');
  const denomRaw  = extractField(infoHtml, 'Denomination');
  const metalRaw  = extractField(infoHtml, 'Metal');

  const imgM    = html.match(/<img\s+class="photo"[^>]*src="([^"]+)"/);
  const photoUrl = imgM ? imgM[1] : '';

  const yah = extractAH(dateRaw);
  const yce = yah ? ahToCe(yah) : '';

  const mintAr = extractArabic(mintRaw);
  const mintEn = mintRaw.replace(mintAr,'').replace(/\(\s*\)/g,'').replace(/[,\-\s]+$/g,'').replace(/^[,\-\s]+/,'').trim();

  const coinName   = rawTitle || [denomRaw, catMeta.name].filter(Boolean).join(' - ') || `Z#${photoId}`;
  const coinNameAr = extractArabic(rawTitle);

  function looksLikeRuler(s) {
    if (!s || s.length < 4 || s.length > 60) return false;
    if (/^\d/.test(s)) return false;
    if (/^(AH|CE|year|from|mint|temp\.|NM\b)/i.test(s)) return false;
    if (/^(AR|AE|AV|AU|BI|Dirham|Dinar|Fals|Fils|Para|Qirsh|Drachm|Fels)/i.test(s)) return false;
    if (/^[A-Z][a-z]+$/.test(s) && s.split(' ').length === 1) return false;
    return s.split(/\s+/).length >= 2 || /[A-Z]/.test(s[0]);
  }

  let ruler = '';
  const parts = rawTitle.split(/,\s*/);
  for (let i = 1; i < Math.min(parts.length, 5); i++) {
    const seg = parts[i].replace(/^(temp\.|ca\.|fl\.)\s*/i,'').replace(/\s*\([\d\-\s]+AH\)\s*/g,'').trim();
    if (looksLikeRuler(seg)) { ruler = seg; break; }
  }
  if (!ruler && parts.length >= 1) {
    const seg = parts[0]
      .replace(/\s+(AR|AE|AU|AV|BI)\s+.*$/i,'').replace(/\s+(Dirham|Dinar|Fals|Fils|Para).*/i,'')
      .replace(/\s*\([\d\-\s]+AH\)\s*/g,'').trim();
    const dynastyPrefixes = /^(Umayyad|Abbasid|Fatimid|Mamluk|Ottoman|Ayyubid|Seljuq|Buyid|Ilkhan|Timurid|Safavid|Ghaznavid|Samanid|Artuqid|Zangid|Almoravid|Almohad|Aghlabid|Hamdanid|Hafsid|Merinid|Ghorid|Afsharid|Qajar)/i;
    if (!dynastyPrefixes.test(seg) && looksLikeRuler(seg)) ruler = seg;
  }

  const id = String(photoId);
  return {
    id: `zeno-${id}`, cc: 'IS', co: 'Islamic', co_ar: 'إسلامي',
    dyn: catMeta.name_ar || '', name: coinName, nar: coinNameAr,
    yce, yah, metal: normaliseMetal(metalRaw),
    wt: extractNum(weightRaw), dia: extractNum(sizeRaw),
    km: '', nref: `Z#${id}`, nid: id, type: 'Circulation',
    mint: mintEn, mint_ar: mintAr,
    ruler, ruler_ar: extractArabic(ruler),
    obverse_legend: '', reverse_legend: '',
    o: photoUrl, r: '', prices: null, mintageData: [],
  };
}

// ── Gallery traversal ──────────────────────────────────────────────────────────

function parseGalleryPage(html, catId, page) {
  const subcats = [];
  const coinIds = new Set();

  const folderRe = /href="[^"]*showgallery\.php\?cat=(\d+)"[^>]*>\s*<img[^>]+folder\.png/g;
  let m;
  while ((m = folderRe.exec(html)) !== null) {
    const id = parseInt(m[1]);
    if (id !== catId) subcats.push(id);
  }
  const photoRe = /showphoto\.php\?photo=(\d+)/g;
  while ((m = photoRe.exec(html)) !== null) coinIds.add(m[1]);

  const nextPage = html.includes(`cat=${catId}&page=${page + 1}`)
    ? `${BASE_URL}/showgallery.php?cat=${catId}&page=${page + 1}`
    : null;

  return { subcats, coinIds, nextPage };
}

async function collectIds(session, catId, limit, collectedIds, visitedCats, depth = 0) {
  if (depth > MAX_DEPTH || visitedCats.has(catId) || collectedIds.size >= limit) return;
  visitedCats.add(catId);

  let page = 1;
  while (collectedIds.size < limit) {
    const url  = `${BASE_URL}/showgallery.php?cat=${catId}${page > 1 ? `&page=${page}` : ''}`;
    const html = await session.get(url);
    if (!html) break;

    const { subcats, coinIds, nextPage } = parseGalleryPage(html, catId, page);
    for (const id of coinIds) {
      collectedIds.add(id);
      if (collectedIds.size >= limit) break;
    }

    for (const sub of subcats) {
      if (collectedIds.size >= limit) break;
      try { await collectIds(session, sub, limit, collectedIds, visitedCats, depth + 1); }
      catch (e) { log(`  ✗ Subcategory ${sub} walk error: ${e.message} — skipping`); }
    }

    if (!nextPage) break;
    page++;
  }
}

// ── Progress / output ─────────────────────────────────────────────────────────

const loadProgress = () => {
  try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); } catch { return { scrapedIds: [] }; }
};
const saveProgress = p  => fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2));
const loadOutput   = () => {
  try { return JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8')); } catch { return []; }
};
const saveOutput   = c  => fs.writeFileSync(OUTPUT_FILE, JSON.stringify(c, null, 2));

// ── Merge (inline) ─────────────────────────────────────────────────────────────

function mergeIntoCatalog(dynastyLabel) {
  const zeno   = JSON.parse(fs.readFileSync(OUTPUT_FILE,  'utf8'));
  const all    = JSON.parse(fs.readFileSync(COINS_FILE,   'utf8'));
  const before = all.length;

  const existingNids  = new Set(all.map(c => c.nid));
  const existingNrefs = new Set(all.map(c => c.nref).filter(Boolean));
  const toAdd = [];
  const byCat = {};

  for (const coin of zeno) {
    if (existingNids.has(coin.nid) || existingNrefs.has(coin.nref)) continue;
    toAdd.push(coin);
    existingNids.add(coin.nid);
    existingNrefs.add(coin.nref);
    const k = coin.dyn || coin.co || 'Unknown';
    byCat[k] = (byCat[k] || 0) + 1;
  }

  const after = before + toAdd.length;
  log(`  Merge [${dynastyLabel}]: ${before} → ${after} (+${toAdd.length} new, ${zeno.length - toAdd.length} skipped as dupes)`);
  if (toAdd.length > 0) {
    Object.entries(byCat).forEach(([k, n]) => log(`    ${n}  ${k}`));
    fs.writeFileSync(COINS_FILE, JSON.stringify([...all, ...toAdd], null, 2));
  } else {
    log('  Nothing new to add.');
  }
  return toAdd.length;
}

// ── Scrape one dynasty ─────────────────────────────────────────────────────────

async function scrapeDynasty(session, catMeta, limit) {
  const { id: catId, name } = catMeta;
  log(`\n${'═'.repeat(60)}`);
  log(`Dynasty: ${name}  (cat=${catId}, limit=${limit === Infinity ? 'all' : limit})`);
  log('═'.repeat(60));

  const progress = loadProgress();
  const output   = loadOutput();
  const doneSet  = new Set(progress.scrapedIds);

  log(`  Collecting coin IDs...`);
  const allIds = new Set();
  try {
    await collectIds(session, catId, limit, allIds, new Set());
  } catch (e) {
    log(`  ✗ Gallery walk error: ${e.message} — continuing with ${allIds.size} IDs`);
  }

  const toFetch = [...allIds].filter(id => !doneSet.has(id));
  log(`  Found ${allIds.size} IDs, ${toFetch.length} to fetch (${allIds.size - toFetch.length} already done)`);

  let scraped = 0, failed = 0;

  for (const photoId of toFetch) {
    const html = await session.get(`${BASE_URL}/showphoto.php?photo=${photoId}`);
    const coin = parseCoinPage(html, photoId, catMeta);
    if (coin) {
      output.push(coin);
      progress.scrapedIds.push(photoId);
      scraped++;
      if (scraped % LOG_EVERY === 0) log(`  ✓ ${scraped}/${toFetch.length} scraped from ${name}  (raw total: ${output.length})`);
      if (scraped % BATCH_SIZE === 0) { saveProgress(progress); saveOutput(output); log(`  💾 Checkpoint at ${scraped}`); }
    } else {
      progress.scrapedIds.push(photoId);
      failed++;
    }
  }

  saveProgress(progress);
  saveOutput(output);
  log(`  ✓ ${name} complete: ${scraped} scraped, ${failed} null/failed`);
  return scraped;
}

// ── Main pipeline ──────────────────────────────────────────────────────────────

async function main() {
  log('╔══════════════════════════════════════════════════════════╗');
  log('║          Zeno.ru Islamic Coins — Full Pipeline           ║');
  log('╚══════════════════════════════════════════════════════════╝');
  log(`Dynasties: ${PIPELINE.map(p => p.name).join(' → ')}`);
  log(`Output   : ${OUTPUT_FILE}`);
  log(`Merge    : ${COINS_FILE}\n`);

  const session = new ZenoSession();
  await session.init();

  const summary = [];

  for (const cat of PIPELINE) {
    const t0      = Date.now();
    const scraped = await scrapeDynasty(session, cat, cat.limit);
    const merged  = mergeIntoCatalog(cat.name);
    const mins    = ((Date.now() - t0) / 60000).toFixed(1);
    summary.push({ name: cat.name, scraped, merged, mins });
    log(`\n  ↳ ${cat.name}: ${scraped} scraped, ${merged} merged in ${mins} min\n`);
  }

  log('\n╔══════════════════════════════════════════════════════════╗');
  log('║                    Pipeline Complete                     ║');
  log('╠══════════════════════════════════════════════════════════╣');
  for (const r of summary) {
    log(`║  ${r.name.padEnd(12)} : ${String(r.scraped).padStart(5)} scraped, ${String(r.merged).padStart(5)} merged  (${r.mins} min)  ║`);
  }
  log('╚══════════════════════════════════════════════════════════╝');

  // Final coins.json count
  const finalCount = JSON.parse(fs.readFileSync(COINS_FILE, 'utf8')).length;
  log(`\ncoins.json final count: ${finalCount.toLocaleString()}`);
}

main().catch(err => {
  log(`\nFATAL: ${err.message}`);
  log(err.stack);
  process.exit(1);
});
