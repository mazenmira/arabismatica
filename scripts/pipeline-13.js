'use strict';
/**
 * pipeline-13.js — scrape + merge the 13 additional Arab dynasties.
 * Each dynasty has its own cc, co, co_ar, dyn overrides.
 *
 * Usage:  node scripts/pipeline-13.js
 * Log:    scripts/pipeline-13.log
 */

const fs   = require('fs');
const path = require('path');

const SCRIPTS_DIR   = path.resolve(__dirname);
const PROGRESS_FILE = path.join(SCRIPTS_DIR, 'zeno_progress_13.json');
const OUTPUT_FILE   = path.join(SCRIPTS_DIR, 'zeno_raw_13.json');
const COINS_FILE    = path.resolve(SCRIPTS_DIR, '../src/data/coins.json');

// ── Pipeline definition ────────────────────────────────────────────────────────
const PIPELINE = [
  {
    id: 1024, name: 'Umayyad of al-Andalus', limit: Infinity,
    cc: 'IS', co: 'Islamic', co_ar: 'إسلامي',
    dyn: 'الأمويون في الأندلس',
  },
  {
    id: 1531, name: 'Tulunid', limit: Infinity,
    cc: 'EG', co: 'Egypt', co_ar: 'مصر',
    dyn: 'الدولة الطولونية',
  },
  {
    id: 3960, name: 'Ikhshidid', limit: Infinity,
    cc: 'EG', co: 'Egypt', co_ar: 'مصر',
    dyn: 'الإخشيديون',
  },
  {
    id: 1292, name: 'Hamdanid', limit: Infinity,
    cc: 'IS', co: 'Islamic', co_ar: 'إسلامي',
    dyn: 'الحمدانيون',
  },
  {
    id: 1030, name: 'Aghlabid', limit: Infinity,
    cc: 'TN', co: 'Tunisia', co_ar: 'تونس',
    dyn: 'الأغالبة',
  },
  {
    id: 5074, name: 'Idrisid', limit: Infinity,
    cc: 'MA', co: 'Morocco', co_ar: 'المغرب',
    dyn: 'الأدارسة',
  },
  {
    id: 6311, name: 'Hafsid', limit: Infinity,
    cc: 'TN', co: 'Tunisia', co_ar: 'تونس',
    dyn: 'الحفصيون',
  },
  {
    id: 4783, name: 'Merinid', limit: Infinity,
    cc: 'MA', co: 'Morocco', co_ar: 'المغرب',
    dyn: 'المرينيون',
  },
  {
    id: 927, name: 'Almoravid', limit: Infinity,
    cc: 'IS', co: 'Islamic', co_ar: 'إسلامي',
    dyn: 'المرابطون',
  },
  {
    id: 1029, name: 'Almohad', limit: Infinity,
    cc: 'IS', co: 'Islamic', co_ar: 'إسلامي',
    dyn: 'الموحدون',
  },
  {
    id: 1102, name: 'Zangid', limit: Infinity,
    cc: 'IS', co: 'Islamic', co_ar: 'إسلامي',
    dyn: 'الزنكيون',
  },
  {
    id: 1478, name: 'Artuqid', limit: Infinity,
    cc: 'IS', co: 'Islamic', co_ar: 'إسلامي',
    dyn: 'الأرتقيون',
  },
  {
    id: 2576, name: 'East Africa sultanates', limit: Infinity,
    cc: 'IS', co: 'Islamic', co_ar: 'إسلامي',
    dyn: 'سلطنات شرق أفريقيا',
  },
];

// ── Config ─────────────────────────────────────────────────────────────────────
const BASE_URL      = 'https://www.zeno.ru';
const RATE_LIMIT_MS = 1100;
const JITTER_MS     = 400;
const RETRY_WAIT_MS = 60_000;
const BATCH_SIZE    = 100;
const LOG_EVERY     = 50;
const MAX_DEPTH     = 8;
const FETCH_TIMEOUT = 15_000;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function log(msg) {
  process.stdout.write(`[${new Date().toISOString().slice(11, 19)}] ${msg}\n`);
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
  const low = raw.toLowerCase().replace(/[^a-z]/g,'');
  for (const [k,v] of Object.entries(METAL_MAP)) if (low===k||low.startsWith(k)) return v;
  return raw.trim();
}

// ── HTTP session ───────────────────────────────────────────────────────────────
class ZenoSession {
  constructor() { this.cookie=''; this.lastReq=0; }

  async init() {
    const r1 = await this._raw(`${BASE_URL}/showphoto.php`);
    this._mc(r1.sc);
    await sleep(1500);
    const r2 = await this._raw(`${BASE_URL}/showphoto.php`);
    this._mc(r2.sc);
    await sleep(600);
    log(`Session ready. ${this.cookie.slice(0,45)}...`);
  }

  async get(url, retries=3) {
    const wait = RATE_LIMIT_MS + Math.floor(Math.random()*JITTER_MS) - (Date.now()-this.lastReq);
    if (wait>0) await sleep(wait);
    for (let a=0; a<=retries; a++) {
      try {
        const r = await this._raw(url);
        this._mc(r.sc);
        this.lastReq = Date.now();
        if (r.body && r.body.includes('Forwarding to requested page')) {
          await sleep(1500);
          const r2 = await this._raw(url);
          this._mc(r2.sc); this.lastReq=Date.now();
          if (r2.body.includes('Forwarding')) {
            await sleep(2000);
            const r3 = await this._raw(url);
            this._mc(r3.sc); this.lastReq=Date.now();
            return r3.body;
          }
          return r2.body;
        }
        if (r.status===429||r.status===503) { log(`⚠ HTTP ${r.status} — waiting 60s`); await sleep(RETRY_WAIT_MS); continue; }
        if (r.status===404) return null;
        if (r.status!==200) throw new Error(`HTTP ${r.status}: ${url}`);
        return r.body;
      } catch(e) {
        if (a<retries) { await sleep(3000*(a+1)); continue; }
        log(`✗ Giving up: ${url} — ${e.message}`);
        return null;
      }
    }
    return null;
  }

  async _raw(url, redirects=5) {
    const ctrl=new AbortController();
    const timer=setTimeout(()=>ctrl.abort(), FETCH_TIMEOUT);
    try {
      const res = await globalThis.fetch(url, {
        signal:ctrl.signal, redirect:'manual',
        headers:{ 'User-Agent':'Mozilla/5.0 Chrome/124','Accept':'text/html,*/*','Accept-Language':'en-US,en;q=0.9,ar;q=0.8','Cookie':this.cookie },
      });
      clearTimeout(timer);
      const sc = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
      if (res.status>=300&&res.status<400&&res.headers.get('location')) {
        this._mc(sc);
        const loc=new URL(res.headers.get('location'),url).href;
        return redirects>0 ? this._raw(loc,redirects-1) : {body:'',status:0,sc:[]};
      }
      return {body:await res.text(), status:res.status, sc};
    } catch(e) {
      clearTimeout(timer);
      if (e.name==='AbortError') throw new Error(`Timeout: ${url}`);
      throw e;
    }
  }

  _mc(sc) {
    if (!sc||!sc.length) return;
    const jar=new Map(this.cookie.split('; ').filter(Boolean).map(p=>{const eq=p.indexOf('=');return[p.slice(0,eq),p.slice(eq+1)];}));
    for (const line of sc) { const [pair]=line.split(';'); const eq=pair.indexOf('='); jar.set(pair.slice(0,eq).trim(),pair.slice(eq+1).trim()); }
    this.cookie=[...jar.entries()].map(([k,v])=>`${k}=${v}`).join('; ');
  }
}

// ── HTML parsing ───────────────────────────────────────────────────────────────
function stripHtml(h) {
  return h.replace(/<br\s*\/?>/gi,' ').replace(/<[^>]+>/g,'')
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ')
    .replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(parseInt(n)))
    .replace(/&#x([\da-f]+);/gi,(_,h)=>String.fromCharCode(parseInt(h,16))).trim();
}
function ef(html,label) {
  const m=html.match(new RegExp(`<b>${label}[^<]*</b>([^<]*)`, 'i'));
  return m ? stripHtml(m[1]).trim() : '';
}
function ar(t) { const m=(t||'').match(/[؀-ۿݐ-ݿࢠ-ࣿ]+(?:\s+[؀-ۿݐ-ݿࢠ-ࣿ]+)*/g); return m?m.join(' ').trim():''; }
function num(s) { const m=(s||'').match(/([\d.]+)/); return m?parseFloat(m[1]):null; }
function ah(s) { const m=(s||'').match(/(?:AH\s*)?(\d{2,4})(?:\s*AH|\s*\/\s*\d{3,4})?/i); return m?m[1]:''; }

function parseCoin(html, photoId, cat) {
  if (!html||html.includes('Forwarding')) return null;
  const titleM=html.match(/<div>\s*#\d+:\s*([\s\S]*?)<\/div>/);
  const raw=titleM?stripHtml(titleM[1]).trim():'';
  const infoI=html.indexOf('Additional Info');
  const info=infoI>=0?html.slice(infoI,infoI+3000):'';
  const wt=ef(info,'Weight'), sz=ef(info,'Size'), mintRaw=ef(info,'Mint');
  const dt=ef(info,'Date'), denom=ef(info,'Denomination'), metal=ef(info,'Metal');
  const img=html.match(/<img\s+class="photo"[^>]*src="([^"]+)"/);
  const yah=ah(dt), yce=yah?ahToCe(yah):'';
  const mintAr=ar(mintRaw);
  const mintEn=mintRaw.replace(mintAr,'').replace(/\(\s*\)/g,'').replace(/[,\-\s]+$/g,'').replace(/^[,\-\s]+/,'').trim();
  const coinName=raw||[denom,cat.name].filter(Boolean).join(' - ')||`Z#${photoId}`;

  function looksRuler(s) {
    if (!s||s.length<4||s.length>60) return false;
    if (/^\d/.test(s)) return false;
    if (/^(AH|CE|year|from|mint|temp\.|NM\b)/i.test(s)) return false;
    if (/^(AR|AE|AV|AU|BI|Dirham|Dinar|Fals|Fils|Para|Qirsh|Drachm)/i.test(s)) return false;
    if (/^[A-Z][a-z]+$/.test(s)&&s.split(' ').length===1) return false;
    return s.split(/\s+/).length>=2||/[A-Z]/.test(s[0]);
  }
  let ruler='';
  const parts=raw.split(/,\s*/);
  for (let i=1; i<Math.min(parts.length,5); i++) {
    const seg=parts[i].replace(/^(temp\.|ca\.|fl\.)\s*/i,'').replace(/\s*\([\d\-\s]+AH\)\s*/g,'').trim();
    if (looksRuler(seg)) { ruler=seg; break; }
  }
  if (!ruler&&parts.length>=1) {
    const seg=parts[0].replace(/\s+(AR|AE|AU|AV|BI)\s+.*$/i,'').replace(/\s+(Dirham|Dinar|Fals|Fils|Para).*/i,'').replace(/\s*\([\d\-\s]+AH\)\s*/g,'').trim();
    const dyPfx=/^(Umayyad|Abbasid|Fatimid|Mamluk|Ottoman|Ayyubid|Seljuq|Buyid|Ilkhan|Timurid|Safavid|Ghaznavid|Samanid|Artuqid|Zangid|Almoravid|Almohad|Aghlabid|Hamdanid|Hafsid|Merinid|Tulunid|Ikhshidid|Idrisid)/i;
    if (!dyPfx.test(seg)&&looksRuler(seg)) ruler=seg;
  }

  const id=String(photoId);
  return {
    id:`zeno-${id}`, cc:cat.cc, co:cat.co, co_ar:cat.co_ar,
    dyn:cat.dyn, name:coinName, nar:ar(raw),
    yce, yah, metal:normaliseMetal(metal),
    wt:num(wt), dia:num(sz), km:'', nref:`Z#${id}`, nid:id, type:'Circulation',
    mint:mintEn, mint_ar:mintAr, ruler, ruler_ar:ar(ruler),
    obverse_legend:'', reverse_legend:'',
    o:img?img[1]:'', r:'', prices:null, mintageData:[],
  };
}

// ── Gallery traversal ──────────────────────────────────────────────────────────
function parseGallery(html, catId, page) {
  const subcats=[], coinIds=new Set();
  const fr=/href="[^"]*showgallery\.php\?cat=(\d+)"[^>]*>\s*<img[^>]+folder\.png/g;
  let m;
  while ((m=fr.exec(html))!==null) { const id=parseInt(m[1]); if(id!==catId) subcats.push(id); }
  const pr=/showphoto\.php\?photo=(\d+)/g;
  while ((m=pr.exec(html))!==null) coinIds.add(m[1]);
  const next=html.includes(`cat=${catId}&page=${page+1}`)?`${BASE_URL}/showgallery.php?cat=${catId}&page=${page+1}`:null;
  return {subcats,coinIds,next};
}

async function collectIds(session, catId, limit, ids, visited, depth=0) {
  if (depth>MAX_DEPTH||visited.has(catId)||ids.size>=limit) return;
  visited.add(catId);
  let page=1;
  while (ids.size<limit) {
    const url=`${BASE_URL}/showgallery.php?cat=${catId}${page>1?`&page=${page}`:''}`;
    const html=await session.get(url);
    if (!html) break;
    const {subcats,coinIds,next}=parseGallery(html,catId,page);
    for (const id of coinIds) { ids.add(id); if(ids.size>=limit) break; }
    for (const sub of subcats) {
      if (ids.size>=limit) break;
      try { await collectIds(session,sub,limit,ids,visited,depth+1); }
      catch(e) { log(`  ✗ Subcategory ${sub}: ${e.message}`); }
    }
    if (!next) break;
    page++;
  }
}

// ── Progress / output ─────────────────────────────────────────────────────────
const loadP = () => { try{return JSON.parse(fs.readFileSync(PROGRESS_FILE,'utf8'));}catch{return{scrapedIds:[]};} };
const saveP = p  => fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p,null,2));
const loadO = () => { try{return JSON.parse(fs.readFileSync(OUTPUT_FILE,'utf8'));}catch{return[];} };
const saveO = c  => fs.writeFileSync(OUTPUT_FILE, JSON.stringify(c,null,2));

// ── Merge ──────────────────────────────────────────────────────────────────────
function merge(label) {
  const zeno=JSON.parse(fs.readFileSync(OUTPUT_FILE,'utf8'));
  const all =JSON.parse(fs.readFileSync(COINS_FILE,'utf8'));
  const before=all.length;
  const nids =new Set(all.map(c=>c.nid));
  const nrefs=new Set(all.map(c=>c.nref).filter(Boolean));
  const toAdd=[]; const byCat={};
  for (const coin of zeno) {
    if (nids.has(coin.nid)||nrefs.has(coin.nref)) continue;
    toAdd.push(coin); nids.add(coin.nid); nrefs.add(coin.nref);
    const k=coin.dyn||'?'; byCat[k]=(byCat[k]||0)+1;
  }
  const after=before+toAdd.length;
  log(`  Merge [${label}]: ${before} → ${after} (+${toAdd.length} new, ${zeno.length-toAdd.length} dupes)`);
  Object.entries(byCat).forEach(([k,n])=>log(`    ${n}  ${k}`));
  if (toAdd.length>0) fs.writeFileSync(COINS_FILE, JSON.stringify([...all,...toAdd],null,2));
  return toAdd.length;
}

// ── Scrape one dynasty ─────────────────────────────────────────────────────────
async function scrapeDynasty(session, cat) {
  log(`\n${'═'.repeat(58)}`);
  log(`Dynasty: ${cat.name}  (cat=${cat.id}, limit=${cat.limit===Infinity?'all':cat.limit})`);
  log('═'.repeat(58));
  const progress=loadP(), output=loadO(), done=new Set(progress.scrapedIds);
  log('  Collecting IDs...');
  const ids=new Set();
  try { await collectIds(session,cat.id,cat.limit,ids,new Set()); }
  catch(e) { log(`  ✗ Gallery walk error: ${e.message}`); }
  const toFetch=[...ids].filter(id=>!done.has(id));
  log(`  Found ${ids.size} IDs, ${toFetch.length} to fetch (${ids.size-toFetch.length} already done)`);
  let scraped=0, failed=0;
  for (const photoId of toFetch) {
    const html=await session.get(`${BASE_URL}/showphoto.php?photo=${photoId}`);
    const coin=parseCoin(html,photoId,cat);
    if (coin) {
      output.push(coin); progress.scrapedIds.push(photoId); scraped++;
      if (scraped%LOG_EVERY===0) log(`  ✓ ${scraped}/${toFetch.length} from ${cat.name} (raw: ${output.length})`);
      if (scraped%BATCH_SIZE===0) { saveP(progress); saveO(output); log(`  💾 Checkpoint at ${scraped}`); }
    } else { progress.scrapedIds.push(photoId); failed++; }
  }
  saveP(progress); saveO(output);
  log(`  ✓ ${cat.name}: ${scraped} scraped, ${failed} failed`);
  return scraped;
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  log('╔══════════════════════════════════════════════════════╗');
  log('║     13-Dynasty Pipeline — Arab Islamic Coinage       ║');
  log('╚══════════════════════════════════════════════════════╝');
  log(`Dynasties: ${PIPELINE.map(p=>p.name).join(' → ')}\n`);

  const session=new ZenoSession();
  await session.init();

  const summary=[];
  for (const cat of PIPELINE) {
    const t0=Date.now();
    const scraped=await scrapeDynasty(session,cat);
    const merged=merge(cat.name);
    const mins=((Date.now()-t0)/60000).toFixed(1);
    summary.push({name:cat.name,scraped,merged,mins});
    log(`\n  ↳ ${cat.name}: ${scraped} scraped, ${merged} merged in ${mins} min\n`);
  }

  log('\n╔══════════════════════════════════════════════════════╗');
  log('║              13-Dynasty Pipeline Complete            ║');
  log('╠══════════════════════════════════════════════════════╣');
  const total={scraped:0,merged:0};
  for (const r of summary) {
    log(`║  ${r.name.padEnd(24)}: ${String(r.scraped).padStart(5)} scraped, ${String(r.merged).padStart(5)} merged  ║`);
    total.scraped+=r.scraped; total.merged+=r.merged;
  }
  log('╠══════════════════════════════════════════════════════╣');
  log(`║  TOTAL                   : ${String(total.scraped).padStart(5)} scraped, ${String(total.merged).padStart(5)} merged  ║`);
  log('╚══════════════════════════════════════════════════════╝');

  const coins=JSON.parse(fs.readFileSync(COINS_FILE,'utf8'));
  log(`\ncoins.json before: ${(coins.length-total.merged).toLocaleString()}`);
  log(`coins.json after : ${coins.length.toLocaleString()} (+${total.merged.toLocaleString()})`);
  log('\nPer-dynasty breakdown:');
  summary.forEach(r=>log(`  ${r.name.padEnd(26)}: +${r.merged}`));
}

main().catch(e=>{ log(`FATAL: ${e.message}\n${e.stack}`); process.exit(1); });
