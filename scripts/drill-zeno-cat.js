'use strict';
/**
 * drill-zeno-cat.js
 * Recursively walks a Zeno.ru category tree up to depth 4,
 * printing every subcategory title + photo/folder counts.
 *
 * Usage:
 *   node scripts/drill-zeno-cat.js 1          # walk ISLAMIC WORLD
 *   node scripts/drill-zeno-cat.js 1 --depth 3
 */

const args      = process.argv.slice(2);
const rootCat   = parseInt(args[0] || '1');
const maxDepth  = parseInt((args[args.indexOf('--depth') + 1]) || '4');

const BASE_URL         = 'https://www.zeno.ru';
const RATE_LIMIT_MS    = 1500;
const FETCH_TIMEOUT_MS = 12000;

const KEYWORDS = [
  'mughal','moghul','mogul','delhi','sultanate',
  'india','indian','deccan','timurid','lodi','sayyid',
  'tughluq','tughlaq','khilji','khalji','slave',
  'ghuri','ghaznavid','sind','sindh','bengal',
  'bijapur','bahmani','golconda','sind','kashmir',
];

class ZenoSession {
  constructor() { this.cookie = ''; this.lastReqTime = 0; }

  async init() {
    const r1 = await this._raw(`${BASE_URL}/showphoto.php`);
    this._mergeCookies(r1.setCookie);
    await this._sleep(1200);
    const r2 = await this._raw(`${BASE_URL}/showphoto.php`);
    this._mergeCookies(r2.setCookie);
    await this._sleep(500);
    console.log('  Session ready.\n');
  }

  async fetch(url) {
    const elapsed = Date.now() - this.lastReqTime;
    const wait    = Math.max(0, RATE_LIMIT_MS - elapsed);
    if (wait > 0) await this._sleep(wait);
    const r = await this._raw(url);
    this._mergeCookies(r.setCookie);
    this.lastReqTime = Date.now();
    if (r.body && r.body.includes('Forwarding to requested page')) {
      await this._sleep(1500);
      const r2 = await this._raw(url);
      this._mergeCookies(r2.setCookie);
      this.lastReqTime = Date.now();
      return r2.body;
    }
    return r.body || '';
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
      return { body: await res.text(), status: res.status, setCookie: sc };
    } catch {
      clearTimeout(t);
      return { body: '', status: 0, setCookie: [] };
    }
  }

  _mergeCookies(arr) {
    if (!arr || !arr.length) return;
    const jar = new Map(
      this.cookie.split('; ').filter(Boolean).map(p => {
        const eq = p.indexOf('='); return [p.slice(0, eq), p.slice(eq + 1)];
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

function stripHtml(h) {
  return h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
          .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n))).trim();
}

function parseTitle(html) {
  // Try the breadcrumb last entry for accurate name
  const m = html.match(/<title>([^<]+)<\/title>/i);
  if (!m) return '';
  return stripHtml(m[1]).replace(/^ZENO\.RU\s*[-–]\s*/i, '').trim();
}

function parseSubcats(html, selfId) {
  const ids = new Set();
  const re  = /showgallery\.php\?cat=(\d+)/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const id = parseInt(m[1]);
    if (id !== selfId) ids.add(id);
  }
  return [...ids];
}

async function walk(session, catId, depth, visited, indent) {
  if (depth > maxDepth || visited.has(catId)) return;
  visited.add(catId);

  const html = await session.fetch(`${BASE_URL}/showgallery.php?cat=${catId}`);
  if (!html || html.length < 200) return;

  const title   = parseTitle(html);
  if (!title) return;

  const photos  = (html.match(/showphoto\.php\?photo=\d+/g) || []).length;
  const folders = (html.match(/folder\.png/g) || []).length;
  const hit     = KEYWORDS.some(k => title.toLowerCase().includes(k));
  const marker  = hit ? '  <-- *** MATCH ***' : '';
  const prefix  = '  '.repeat(indent);

  if (hit || photos > 0 || folders > 0) {
    console.log(`${prefix}cat=${catId}: "${title}" — photos:${photos}, folders:${folders}${marker}`);
  }

  if (depth < maxDepth) {
    const subcats = parseSubcats(html, catId);
    for (const sub of subcats) {
      await walk(session, sub, depth + 1, visited, indent + 1);
    }
  }
}

async function main() {
  const session = new ZenoSession();
  await session.init();

  console.log(`Drilling into cat=${rootCat} up to depth ${maxDepth}...\n`);
  const visited = new Set();
  await walk(session, rootCat, 0, visited, 0);
  console.log(`\nDone. Visited ${visited.size} categories.`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
