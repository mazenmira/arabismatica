'use strict';

/**
 * enrich-zeno-descriptions.js
 *
 * Fetches the "Photo Details" description block from Zeno.ru for each IS coin
 * and adds the following fields to coins.json (and Supabase):
 *
 *   zeno_description  — full text from the Photo Details section
 *   upload_date       — e.g. "28-March-2013"
 *   keywords          — space-separated keyword string
 *   obverse_legend    — extracted from description if "OBVERSE:" present
 *   reverse_legend    — extracted from description if "REVERSE:" present
 *   references        — extracted reference numbers (Walker, Album, Goodwin, etc.)
 *   condition         — grade string if "CONDITION:" present
 *   die_axis          — from Additional Info if present
 *
 * Usage:
 *   node scripts/enrich-zeno-descriptions.js --test        # run on 100 coins, print sample
 *   node scripts/enrich-zeno-descriptions.js --run         # full run (all IS coins with nid)
 *   node scripts/enrich-zeno-descriptions.js --resume      # resume from checkpoint
 *   node scripts/enrich-zeno-descriptions.js --push-only   # push cached enrichments to Supabase
 *
 * Output:
 *   scripts/zeno_descriptions_cache.json   — enriched data (checkpoint, never cleared between runs)
 *   src/data/coins.json                    — updated in-place
 */

const fs   = require('fs');
const path = require('path');

// ── Paths ─────────────────────────────────────────────────────────────────────

const SCRIPTS_DIR  = path.resolve(__dirname);
const COINS_FILE   = path.join(SCRIPTS_DIR, '..', 'src', 'data', 'coins.json');
const CACHE_FILE   = path.join(SCRIPTS_DIR, 'zeno_descriptions_cache.json');

// ── Config ────────────────────────────────────────────────────────────────────

const RATE_LIMIT_MS    = 2000;   // min ms between requests (respectful)
const JITTER_MS        = 500;    // extra random ms
const RETRY_WAIT_MS    = 90_000; // wait on 429/503
const FETCH_TIMEOUT_MS = 20_000;
const CHECKPOINT_EVERY = 500;    // save cache to disk every N coins
const TEST_LIMIT       = 100;    // coins to process in --test mode

// ── CLI args ──────────────────────────────────────────────────────────────────

const args     = process.argv.slice(2);
const TEST_MODE   = args.includes('--test');
const PUSH_ONLY   = args.includes('--push-only');
const RESUME_MODE = args.includes('--resume') || args.includes('--run');

if (!TEST_MODE && !PUSH_ONLY && !RESUME_MODE) {
  console.log('Usage:');
  console.log('  node scripts/enrich-zeno-descriptions.js --test       # 100 coin test');
  console.log('  node scripts/enrich-zeno-descriptions.js --run        # full run');
  console.log('  node scripts/enrich-zeno-descriptions.js --resume     # resume from cache');
  console.log('  node scripts/enrich-zeno-descriptions.js --push-only  # push cache to Supabase');
  process.exit(0);
}

// ── Supabase (service role for writes) ───────────────────────────────────────

// Load .env.local manually (Next.js style)
function loadEnv() {
  const envFile = path.join(SCRIPTS_DIR, '..', '.env.local');
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // write access

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠ Supabase env vars not found — will skip Supabase push.');
}

// ── HTTP session (same cookie-gate logic as scrape-zeno.js) ──────────────────

class ZenoSession {
  constructor() {
    this.cookie      = '';
    this.lastReqTime = 0;
  }

  async init() {
    const url = 'https://www.zeno.ru/showphoto.php';
    const r1 = await this._raw(url);
    this._mergeCookies(r1.setCookie);
    await this._sleep(1800);
    const r2 = await this._raw(url);
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

        if (r.body && r.body.includes('Forwarding to requested page')) {
          await this._sleep(1800);
          const r2 = await this._raw(url);
          this._mergeCookies(r2.setCookie);
          this.lastReqTime = Date.now();
          if (r2.body && r2.body.includes('Forwarding')) {
            await this._sleep(2500);
            const r3 = await this._raw(url);
            this._mergeCookies(r3.setCookie);
            this.lastReqTime = Date.now();
            return r3.body;
          }
          return r2.body;
        }

        if (r.status === 429 || r.status === 503) {
          console.log(`  ⚠ HTTP ${r.status} — waiting ${RETRY_WAIT_MS / 1000}s...`);
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

  async _raw(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await globalThis.fetch(url, {
        signal:   controller.signal,
        redirect: 'manual',
        headers: {
          'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
          'Accept':          'text/html,application/xhtml+xml,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
          'Cookie':          this.cookie,
        },
      });
      clearTimeout(timer);
      const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        this._mergeCookies(setCookie);
        const loc = new URL(res.headers.get('location'), url).href;
        return this._raw(loc);
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

// ── HTML parsing helpers ───────────────────────────────────────────────────────

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&#x([\da-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractBoldField(html, label) {
  // Matches: <b>LABEL...</b>VALUE (in same div)
  const re = new RegExp(`<b>${label}[^<]*<\/b>\\s*([^<]*)`, 'i');
  const m  = html.match(re);
  return m ? stripHtml(m[1]).trim() : '';
}

function extractKeywords(html) {
  // Keywords are linked: <a ...>WORD</a> <a ...>WORD</a>
  const section = html.match(/<b>Keywords:<\/b>([\s\S]*?)<\/div>/i);
  if (!section) return '';
  const words = [];
  const re = /<a[^>]*>([^<]+)<\/a>/g;
  let m;
  while ((m = re.exec(section[1])) !== null) {
    const w = m[1].trim();
    if (w) words.push(w);
  }
  return words.join(' ');
}

/**
 * Extract fields from a Zeno photo page.
 * Returns null if the page is invalid.
 */
function parseEnrichmentPage(html) {
  if (!html || html.includes('Forwarding to requested page')) return null;
  if (!html.includes('Photo Details')) return null;

  // ── Photo Details box ─────────────────────────────────────────────────────
  const pdStart = html.indexOf('Photo Details');
  const pdEnd   = html.indexOf('Additional Info', pdStart);
  const pdHtml  = pdStart >= 0 ? html.slice(pdStart, pdEnd > 0 ? pdEnd : pdStart + 8000) : '';

  // Description: the italic span inside the first padding div
  let description = '';
  const italicM = pdHtml.match(/<span[^>]*font-style\s*:\s*italic[^>]*>([\s\S]*?)<\/span>/i);
  if (italicM) {
    description = stripHtml(italicM[1]).trim();
  } else {
    // Fallback: entire first padding div content (no italic span)
    const firstDivM = pdHtml.match(/<div[^>]*padding[^>]*>([\s\S]*?)<\/div>/i);
    if (firstDivM) description = stripHtml(firstDivM[1]).trim();
  }

  // Upload date
  const upload_date = extractBoldField(pdHtml, 'Upload Date');
  // Views
  const views_raw   = extractBoldField(pdHtml, 'Views');
  const views       = views_raw ? parseInt(views_raw.replace(/[^0-9]/g, ''), 10) || null : null;

  // ── Additional Info box ───────────────────────────────────────────────────
  const aiStart = html.indexOf('Additional Info');
  const aiHtml  = aiStart >= 0 ? html.slice(aiStart, aiStart + 3000) : '';

  const keywords  = extractKeywords(aiHtml);
  const die_axis  = extractBoldField(aiHtml, 'Die Axis');
  // (Weight, Date, Metal, Mint, Denom already captured by original scraper — skip here)

  // ── Fields extracted from description text ────────────────────────────────
  let obverse_legend = '';
  let reverse_legend = '';
  let references     = '';
  let condition      = '';

  if (description) {
    // Obverse/Reverse legends (common in auction-catalogue entries)
    const obvM = description.match(/OBVERSE\s*:\s*([\s\S]*?)(?=REVERSE\s*:|WEIGHT\s*:|REFERENCE|CONDITION|$)/i);
    if (obvM) obverse_legend = obvM[1].replace(/\n/g, ' ').trim().slice(0, 800);

    const revM = description.match(/REVERSE\s*:\s*([\s\S]*?)(?=WEIGHT\s*:|REFERENCE|CONDITION|NOTE|$)/i);
    if (revM) reverse_legend = revM[1].replace(/\n/g, ' ').trim().slice(0, 800);

    // References (Walker, Album, Goodwin, Spengler, Broome, Miles, Bacharach, SICA, BMC, ANS, etc.)
    const refM = description.match(/REFERENCES?\s*:\s*([^\n]{0,400})/i);
    if (refM) references = refM[1].trim();

    // Condition/grade
    const condM = description.match(/CONDITION\s*:\s*([^\n]{0,300})/i);
    if (condM) condition = condM[1].trim();
  }

  return {
    description:    description  || null,
    upload_date:    upload_date  || null,
    views:          views        || null,
    keywords:       keywords     || null,
    die_axis:       die_axis     || null,
    obverse_legend: obverse_legend || null,
    reverse_legend: reverse_legend || null,
    references:     references   || null,
    condition:      condition    || null,
  };
}

// ── Supabase batch upsert ─────────────────────────────────────────────────────

async function pushToSupabase(updates) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('  ℹ Supabase not configured — skipping push');
    return;
  }
  // Use PATCH (partial update) — POST/upsert fails with NOT NULL constraint on missing cols.
  // Run up to CONCURRENCY patches in parallel.
  const CONCURRENCY = 8;
  let pushed = 0;
  let failed = 0;
  const headers = {
    'apikey':        SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type':  'application/json',
    'Prefer':        'return=minimal',
  };

  async function patchOne(update) {
    const { id, ...fields } = update;
    const res = await globalThis.fetch(
      `${SUPABASE_URL}/rest/v1/coins?id=eq.${encodeURIComponent(id)}`,
      { method: 'PATCH', headers, body: JSON.stringify(fields) }
    );
    if (!res.ok) {
      const txt = await res.text();
      console.error(`\n  ✗ PATCH failed for ${id}: ${res.status} ${txt.slice(0, 150)}`);
      failed++;
    } else {
      pushed++;
    }
    process.stdout.write(`\r  Supabase PATCH: ${pushed} ok, ${failed} err / ${updates.length} total`);
  }

  // Process with bounded concurrency
  for (let i = 0; i < updates.length; i += CONCURRENCY) {
    await Promise.all(updates.slice(i, i + CONCURRENCY).map(patchOne));
  }
  console.log(`\n  Done: ${pushed} patched, ${failed} failed.`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Load coins.json
  console.log('Loading coins.json...');
  const allCoins = JSON.parse(fs.readFileSync(COINS_FILE, 'utf8'));

  // Filter: IS coins with nid set
  const isCoins = allCoins.filter(c => c.cc === 'IS' && c.nid && !c.nid.startsWith('N#'));
  console.log(`Found ${isCoins.length} IS coins with Zeno nid`);

  // Load existing cache (checkpoint resume)
  let cache = {};
  if (fs.existsSync(CACHE_FILE)) {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    console.log(`Loaded ${Object.keys(cache).length} entries from cache`);
  }

  // --push-only: just push cached data to Supabase and update coins.json
  if (PUSH_ONLY) {
    console.log('\n── PUSH ONLY MODE ────────────────────────────────────────────');
    // Fields that exist in Supabase after migration
    const ENRICHED_COLS = [
      'zeno_description', 'upload_date', 'keywords',
      'obverse_legend', 'reverse_legend',
      'references', 'condition', 'die_axis',
    ];
    const updates = [];
    for (const coin of allCoins) {
      const enriched = cache[coin.nid];
      if (!enriched) continue;
      // Only include cols with actual values — never send null for existing NOT NULL cols
      // Cache stores 'description' but DB column is 'zeno_description' — handle both
      const update = { id: coin.id };
      for (const col of ENRICHED_COLS) {
        const cacheKey = col === 'zeno_description' ? (enriched.zeno_description !== undefined ? 'zeno_description' : 'description') : col;
        const v = enriched[cacheKey];
        if (v !== undefined && v !== null && v !== '') update[col] = v;
      }
      if (Object.keys(update).length === 1) continue; // nothing to patch
      Object.assign(coin, update);
      updates.push(update);
    }
    console.log(`Pushing ${updates.length} updates to Supabase...`);
    await pushToSupabase(updates);
    fs.writeFileSync(COINS_FILE, JSON.stringify(allCoins, null, 2));
    console.log('coins.json updated.');
    return;
  }

  // Determine which coins to process
  let toProcess = isCoins.filter(c => !cache[c.nid]);
  if (TEST_MODE) {
    toProcess = toProcess.slice(0, TEST_LIMIT);
    console.log(`\n── TEST MODE: processing ${toProcess.length} coins ──────────────────`);
  } else {
    console.log(`\n── FULL RUN: ${toProcess.length} coins to enrich ─────────────────`);
  }

  if (toProcess.length === 0) {
    console.log('Nothing to do — all coins already in cache. Use --push-only to sync.');
    return;
  }

  // Init Zeno session
  const session = new ZenoSession();
  await session.init();

  let done = 0;
  let failed = 0;
  const supabaseUpdates = [];

  for (const coin of toProcess) {
    const url = `https://www.zeno.ru/showphoto.php?photo=${coin.nid}`;

    try {
      const html = await session.fetch(url);
      if (!html) {
        console.log(`  [${done + 1}/${toProcess.length}] SKIP (null) nid=${coin.nid}`);
        failed++;
        done++;
        continue;
      }

      const enriched = parseEnrichmentPage(html);
      if (!enriched || !enriched.description) {
        // Still cache as empty to avoid re-fetching
        cache[coin.nid] = { description: null };
        done++;
        if (done % 10 === 0) process.stdout.write(`\r  ${done}/${toProcess.length} (${failed} failed)`);
        continue;
      }

      // Store in cache
      cache[coin.nid] = enriched;

      // Build update object for Supabase — map cache key 'description' → DB col 'zeno_description'
      const update = { id: coin.id };
      const DB_COL_MAP = { description: 'zeno_description' };
      for (const [k, v] of Object.entries(enriched)) {
        if (v !== null && k !== 'views') {
          const dbKey = DB_COL_MAP[k] || k;
          update[dbKey] = v;
        }
      }
      supabaseUpdates.push(update);

      // Update coin in allCoins array
      const coinInArray = allCoins.find(c => c.id === coin.id);
      if (coinInArray) Object.assign(coinInArray, update);

      done++;
      if (done % 10 === 0) process.stdout.write(`\r  ${done}/${toProcess.length} (${failed} failed)`);

      // Checkpoint
      if (done % CHECKPOINT_EVERY === 0) {
        console.log(`\n  💾 Checkpoint at ${done} — saving cache...`);
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
        fs.writeFileSync(COINS_FILE, JSON.stringify(allCoins, null, 2));
        if (!TEST_MODE && supabaseUpdates.length > 0) {
          await pushToSupabase(supabaseUpdates.splice(0));
        }
      }
    } catch (err) {
      console.warn(`\n  ✗ Error on nid=${coin.nid}: ${err.message}`);
      failed++;
      done++;
    }
  }

  console.log(`\n\nDone. Processed: ${done}, Failed/empty: ${failed}`);

  // Save cache and coins.json
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  fs.writeFileSync(COINS_FILE, JSON.stringify(allCoins, null, 2));
  console.log('Cache and coins.json saved.');

  // ── TEST MODE: print samples ────────────────────────────────────────────
  if (TEST_MODE) {
    const richEntries = Object.entries(cache)
      .filter(([, v]) => v.description)
      .slice(0, 5);

    console.log('\n\n══════════════════════════════════════════════════');
    console.log('SAMPLE RESULTS (5 coins with descriptions):');
    console.log('══════════════════════════════════════════════════\n');

    for (const [nid, data] of richEntries) {
      const coin = isCoins.find(c => c.nid === nid);
      console.log(`━━━ nid=${nid} id=${coin?.id}`);
      console.log(`    name:         ${coin?.name}`);
      console.log(`    upload_date:  ${data.upload_date}`);
      console.log(`    keywords:     ${data.keywords}`);
      console.log(`    die_axis:     ${data.die_axis}`);
      console.log(`    references:   ${data.references}`);
      console.log(`    condition:    ${data.condition}`);
      if (data.obverse_legend) console.log(`    obv_legend:   ${data.obverse_legend.slice(0, 120)}...`);
      if (data.reverse_legend) console.log(`    rev_legend:   ${data.reverse_legend.slice(0, 120)}...`);
      console.log(`    description:\n${data.description.slice(0, 400).replace(/^/gm, '      ')}...`);
      console.log('');
    }

    const withDesc = Object.values(cache).filter(v => v.description).length;
    const total    = Object.keys(cache).length;
    console.log(`\nSummary: ${withDesc}/${total} coins had description text (${Math.round(withDesc/total*100)}%)`);
    console.log('\n⚠ Test run complete — coins.json updated locally but NOT pushed to Supabase.');
    console.log('  Review the samples above, then run: node scripts/enrich-zeno-descriptions.js --run');
    console.log('  (or --push-only to push the cached test results first)\n');
    return;
  }

  // Full run: push remaining updates
  if (supabaseUpdates.length > 0) {
    console.log(`\nPushing ${supabaseUpdates.length} updates to Supabase...`);
    await pushToSupabase(supabaseUpdates);
  }

  console.log('\n✅ Enrichment complete!');
  console.log(`   Cache: ${Object.keys(cache).length} entries in ${CACHE_FILE}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
