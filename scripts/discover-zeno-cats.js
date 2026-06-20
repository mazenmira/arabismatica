'use strict';
/**
 * discover-zeno-cats.js
 * Wide scan of Zeno.ru gallery categories to find Mughal / Delhi Sultanate.
 * Scans ranges: 1-50, 100-200, 200-370, 410-650, 780-810
 * Prints every category whose title contains an India/Islamic keyword,
 * plus every category that has >5 photos or >3 sub-folders.
 *
 * Usage:  node scripts/discover-zeno-cats.js
 *         node scripts/discover-zeno-cats.js --range 600 650
 */

const args      = process.argv.slice(2);
const rangeFlag = args.indexOf('--range');
let customRange = null;
if (rangeFlag >= 0) {
  customRange = [parseInt(args[rangeFlag + 1]), parseInt(args[rangeFlag + 2])];
}

const BASE_URL         = 'https://www.zeno.ru';
const RATE_LIMIT_MS    = 1600;
const FETCH_TIMEOUT_MS = 12000;

// ── ZenoSession ───────────────────────────────────────────────────────────────
class ZenoSession {
  constructor() { this.cookie = ''; this.lastReqTime = 0; }

  async init() {
    const r1 = await this._raw(BASE_URL + '/showphoto.php');
    this._mergeCookies(r1.setCookie);
    await this._sleep(1200);
    const r2 = await this._raw(BASE_URL + '/showphoto.php');
    this._mergeCookies(r2.setCookie);
    await this._sleep(500);
    console.log('  Session ready.');
  }

  async fetch(url) {
    const elapsed = Date.now() - this.lastReqTime;
    const wait    = Math.max(0, RATE_LIMIT_MS - elapsed);
    if (wait > 0) await this._sleep(wait);
    const r = await this._raw(url);
    this._mergeCookies(r.setCookie);
    this.lastReqTime = Date.now();
    if (r.body.includes('Forwarding to requested page')) {
      await this._sleep(1500);
      const r2 = await this._raw(url);
      this._mergeCookies(r2.setCookie);
      this.lastReqTime = Date.now();
      return r2.body;
    }
    return r.body;
  }

  async _raw(url, redirects = 5) {
    const ctrl = new AbortController();
    const t    = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await globalThis.fetch(url, {
        signal:   ctrl.signal,
        redirect: 'manual',
        headers: {
          'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
          'Accept':          'text/html,application/xhtml+xml,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cookie':          this.cookie,
        },
      });
      clearTimeout(t);
      const sc = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        this._mergeCookies(sc);
        const loc = new URL(res.headers.get('location'), url).href;
        if (redirects > 0) return this._raw(loc, redirects - 1);
        return { body: '', status: res.status, setCookie: [] };
      }
      const body = await res.text();
      return { body, status: res.status, setCookie: sc };
    } catch (err) {
      clearTimeout(t);
      return { body: '', status: 0, setCookie: [] };
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function stripHtml(h) {
  return h
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .trim();
}

function parseTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  if (!m) return '';
  return stripHtml(m[1]).replace(/^ZENO\.RU\s*[-–]\s*/i, '').trim();
}

const KEYWORDS = [
  'mughal', 'moghul', 'mogul',
  'delhi', 'sultanate',
  'india', 'indian', 'subcontinent',
  'deccan', 'timurid', 'lodi', 'sayyid',
  'tughluq', 'tughlaq', 'khilji', 'khalji',
  'slave dynasty', 'ghuri', 'ghaznavid',
  'sind', 'sindh', 'bengal', 'bijapur',
  'bahmani', 'golconda',
];

function isRelevant(title) {
  const lo = title.toLowerCase();
  return KEYWORDS.some(k => lo.includes(k));
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const session = new ZenoSession();
  await session.init();

  // Ranges to scan
  const ranges = customRange
    ? [customRange]
    : [
        [1,   50],   // top-level sections
        [100, 200],
        [200, 370],
        [410, 530],
        [530, 650],
        [650, 780],
        [780, 812],
      ];

  console.log('\n══ Zeno.ru Wide Category Scan ══');
  console.log('Keywords: mughal, delhi, india, sultanate, deccan, timurid...\n');

  const found = [];

  for (const [start, end] of ranges) {
    console.log(`-- Scanning ${start}–${end} --`);
    for (let catId = start; catId <= end; catId++) {
      const url  = `${BASE_URL}/showgallery.php?cat=${catId}`;
      const html = await session.fetch(url);
      if (!html || html.length < 300) continue;

      const title   = parseTitle(html);
      if (!title) continue;

      const photos  = (html.match(/showphoto\.php\?photo=\d+/g) || []).length;
      const folders = (html.match(/folder\.png/g) || []).length;
      const hit     = isRelevant(title);

      if (hit) {
        console.log(`  *** cat=${catId}: "${title}" — photos:${photos}, folders:${folders}  <-- MATCH`);
        found.push({ catId, title, photos, folders });
      } else if (photos > 5 || folders > 3) {
        console.log(`      cat=${catId}: "${title}" — photos:${photos}, folders:${folders}`);
      }
    }
  }

  console.log('\n══ Summary of keyword matches ══');
  if (found.length === 0) {
    console.log('  No keyword matches found in scanned ranges.');
    console.log('  Try: node scripts/discover-zeno-cats.js --range <start> <end>');
  } else {
    for (const f of found) {
      console.log(`  cat=${f.catId}: "${f.title}" — photos:${f.photos}, folders:${f.folders}`);
    }
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
