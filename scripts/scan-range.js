'use strict';
/**
 * scan-range.js  —  flat scan of a numeric cat-ID range on Zeno.ru
 * Usage:  node scripts/scan-range.js <start> <end>
 *         node scripts/scan-range.js 6000 6300
 */

const [,, startStr, endStr] = process.argv;
const START = parseInt(startStr || '6000');
const END   = parseInt(endStr   || '6300');

const BASE_URL         = 'https://www.zeno.ru';
const RATE_LIMIT_MS    = 1500;
const FETCH_TIMEOUT_MS = 12000;

const KEYWORDS = [
  'mughal','moghul','mogul','delhi','sultanate',
  'india','indian','deccan','timurid','lodi','sayyid',
  'tughluq','tughlaq','khilji','khalji','slave',
  'ghuri','ghaznavid','sind','sindh','bengal',
  'bijapur','bahmani','golconda','kashmir','pakistan',
  'gujarat','malwa','jaunpur','sharqi',
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
    console.log('  Session ready.');
  }
  async fetch(url) {
    const e = Date.now() - this.lastReqTime;
    const w = Math.max(0, RATE_LIMIT_MS - e);
    if (w > 0) await this._sleep(w);
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
  async _raw(url, rd = 5) {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await globalThis.fetch(url, {
        signal: c.signal, redirect: 'manual',
        headers: { 'User-Agent': 'Mozilla/5.0', 'Cookie': this.cookie },
      });
      clearTimeout(t);
      const sc = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        this._mergeCookies(sc);
        const loc = new URL(res.headers.get('location'), url).href;
        return rd > 0 ? this._raw(loc, rd - 1) : { body: '', status: res.status, setCookie: [] };
      }
      return { body: await res.text(), status: res.status, setCookie: sc };
    } catch { clearTimeout(t); return { body: '', status: 0, setCookie: [] }; }
  }
  _mergeCookies(arr) {
    if (!arr || !arr.length) return;
    const jar = new Map(this.cookie.split('; ').filter(Boolean).map(p => { const eq = p.indexOf('='); return [p.slice(0, eq), p.slice(eq + 1)]; }));
    for (const l of arr) { const [p] = l.split(';'); const eq = p.indexOf('='); jar.set(p.slice(0, eq).trim(), p.slice(eq + 1).trim()); }
    this.cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }
  _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
}

function stripHtml(h) {
  return h.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ')
          .replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(parseInt(n))).trim();
}
function parseTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? stripHtml(m[1]).replace(/^ZENO\.RU\s*[-–]\s*/i,'').trim() : '';
}

async function main() {
  const s = new ZenoSession();
  await s.init();
  console.log(`\nScanning cat=${START} to cat=${END}...\n`);
  const hits = [];
  for (let id = START; id <= END; id++) {
    const html = await s.fetch(`${BASE_URL}/showgallery.php?cat=${id}`);
    if (!html || html.length < 300) continue;
    const title = parseTitle(html);
    if (!title) continue;
    const photos  = (html.match(/showphoto\.php\?photo=\d+/g)||[]).length;
    const folders = (html.match(/folder\.png/g)||[]).length;
    const hit     = KEYWORDS.some(k => title.toLowerCase().includes(k));
    if (hit) {
      console.log(`  *** cat=${id}: "${title}" — photos:${photos}, folders:${folders}  <-- MATCH`);
      hits.push({ id, title, photos, folders });
    } else if (photos > 8 || folders > 4) {
      console.log(`      cat=${id}: "${title}" — photos:${photos}, folders:${folders}`);
    }
  }
  console.log(`\n═══ Keyword matches ═══`);
  hits.forEach(h => console.log(`  cat=${h.id}: "${h.title}" — photos:${h.photos}, folders:${h.folders}`));
  console.log('Done.');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
