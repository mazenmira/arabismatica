'use strict';
/**
 * pipeline-extra.js — Abbasid (full resume), Pre-Reform, Ilkhanid
 *
 * Log:  scripts/pipeline-extra.log
 * Err:  scripts/pipeline-extra-error.log
 */

const fs   = require('fs');
const path = require('path');

const SCRIPTS_DIR    = path.resolve(__dirname);
// Own progress + output files; seeded from main progress at startup
const PROGRESS_FILE  = path.join(SCRIPTS_DIR, 'zeno_progress_extra.json');
const OUTPUT_FILE    = path.join(SCRIPTS_DIR, 'zeno_raw_extra.json');
const COINS_FILE     = path.resolve(SCRIPTS_DIR, '../src/data/coins.json');
const LATEST_FILE    = path.resolve(SCRIPTS_DIR, '../src/data/latest_additions.json');
// Main pipeline progress to seed from (contains ~18k already-scraped IDs)
const MAIN_PROGRESS  = path.join(SCRIPTS_DIR, 'zeno_progress.json');
const P13_PROGRESS   = path.join(SCRIPTS_DIR, 'zeno_progress_13.json');

// ── Pipeline definition ────────────────────────────────────────────────────────
const PIPELINE = [
  {
    id:    543, name: 'Abbasid (full)',  limit: Infinity,
    cc: 'IS', co: 'Islamic', co_ar: 'إسلامي',
    dyn: 'الخلافة العباسية',
  },
  {
    id:   2333, name: 'Pre-Reform coinage', limit: Infinity,
    cc: 'IS', co: 'Islamic', co_ar: 'إسلامي',
    dyn: 'الإسلام المبكر',
  },
  {
    id:    653, name: 'Ilkhanid', limit: Infinity,
    cc: 'IS', co: 'Islamic', co_ar: 'إسلامي',
    dyn: 'الإيلخانيون',
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
const log   = msg => process.stdout.write(`[${new Date().toISOString().slice(11,19)}] ${msg}\n`);

const ahToCe = ah => { const n=parseFloat(ah); return isNaN(n)?'':String(Math.round(n*0.97+622)); };

const METAL_MAP = {
  'gold':'Gold','silver':'Silver','copper':'Copper','bronze':'Bronze',
  'billon':'Billon','billion':'Billon','brass':'Brass',
  'au':'Gold','ar':'Silver','ae':'Bronze','bi':'Billon','fe':'Iron',
};
const normMetal = raw => {
  if (!raw) return '';
  const low=raw.toLowerCase().replace(/[^a-z]/g,'');
  for (const [k,v] of Object.entries(METAL_MAP)) if (low===k||low.startsWith(k)) return v;
  return raw.trim();
};

// ── HTTP session ───────────────────────────────────────────────────────────────
class ZenoSession {
  constructor() { this.cookie=''; this.lastReq=0; }

  async init() {
    const r1=await this._raw(`${BASE_URL}/showphoto.php`); this._mc(r1.sc); await sleep(1500);
    const r2=await this._raw(`${BASE_URL}/showphoto.php`); this._mc(r2.sc); await sleep(600);
    log(`Session ready. ${this.cookie.slice(0,50)}...`);
  }

  async get(url, retries=3) {
    const wait=RATE_LIMIT_MS+Math.floor(Math.random()*JITTER_MS)-(Date.now()-this.lastReq);
    if (wait>0) await sleep(wait);
    for (let a=0; a<=retries; a++) {
      try {
        const r=await this._raw(url); this._mc(r.sc); this.lastReq=Date.now();
        if (r.body?.includes('Forwarding to requested page')) {
          await sleep(1500); const r2=await this._raw(url); this._mc(r2.sc); this.lastReq=Date.now();
          if (r2.body.includes('Forwarding')) {
            await sleep(2000); const r3=await this._raw(url); this._mc(r3.sc); this.lastReq=Date.now(); return r3.body;
          }
          return r2.body;
        }
        if (r.status===429||r.status===503) { log(`⚠ HTTP ${r.status} — 60s wait`); await sleep(RETRY_WAIT_MS); continue; }
        if (r.status===404) return null;
        if (r.status!==200) throw new Error(`HTTP ${r.status}: ${url}`);
        return r.body;
      } catch(e) {
        if (a<retries) { await sleep(3000*(a+1)); continue; }
        log(`✗ Giving up: ${url} — ${e.message}`); return null;
      }
    }
    return null;
  }

  async _raw(url, hops=5) {
    const ctrl=new AbortController(); const t=setTimeout(()=>ctrl.abort(),FETCH_TIMEOUT);
    try {
      const res=await globalThis.fetch(url,{signal:ctrl.signal,redirect:'manual',headers:{
        'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124',
        'Accept':'text/html,*/*','Accept-Language':'en-US,en;q=0.9,ar;q=0.8','Cookie':this.cookie
      }});
      clearTimeout(t);
      const sc=res.headers.getSetCookie?res.headers.getSetCookie():[];
      if (res.status>=300&&res.status<400&&res.headers.get('location')) {
        this._mc(sc);
        return hops>0?this._raw(new URL(res.headers.get('location'),url).href,hops-1):{body:'',status:0,sc:[]};
      }
      return {body:await res.text(),status:res.status,sc};
    } catch(e) { clearTimeout(t); if(e.name==='AbortError') throw new Error(`Timeout: ${url}`); throw e; }
  }

  _mc(sc) {
    if (!sc?.length) return;
    const jar=new Map(this.cookie.split('; ').filter(Boolean).map(p=>{const eq=p.indexOf('=');return[p.slice(0,eq),p.slice(eq+1)];}));
    for (const l of sc){const[p]=l.split(';');const eq=p.indexOf('=');jar.set(p.slice(0,eq).trim(),p.slice(eq+1).trim());}
    this.cookie=[...jar.entries()].map(([k,v])=>`${k}=${v}`).join('; ');
  }
}

// ── HTML / parse ───────────────────────────────────────────────────────────────
const strip = h => h.replace(/<br\s*\/?>/gi,' ').replace(/<[^>]+>/g,'')
  .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
  .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ')
  .replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(parseInt(n)))
  .replace(/&#x([\da-f]+);/gi,(_,h)=>String.fromCharCode(parseInt(h,16))).trim();

const ef  = (html,lbl) => { const m=html.match(new RegExp(`<b>${lbl}[^<]*</b>([^<]*)`, 'i')); return m?strip(m[1]).trim():''; };
const ar  = t => { const m=(t||'').match(/[؀-ۿݐ-ݿࢠ-ࣿ]+(?:\s+[؀-ۿݐ-ݿࢠ-ࣿ]+)*/g); return m?m.join(' ').trim():''; };
const num = s => { const m=(s||'').match(/([\d.]+)/); return m?parseFloat(m[1]):null; };
const ahV = s => { const m=(s||'').match(/(?:AH\s*)?(\d{2,4})(?:\s*AH|\s*\/\s*\d{3,4})?/i); return m?m[1]:''; };

function parseCoin(html, photoId, cat) {
  if (!html||html.includes('Forwarding')) return null;
  const tM=html.match(/<div>\s*#\d+:\s*([\s\S]*?)<\/div>/);
  const raw=tM?strip(tM[1]).trim():'';
  const ii=html.indexOf('Additional Info'); const info=ii>=0?html.slice(ii,ii+3000):'';
  const wt=ef(info,'Weight'),sz=ef(info,'Size'),mintRaw=ef(info,'Mint'),dt=ef(info,'Date'),
        denom=ef(info,'Denomination'),metal=ef(info,'Metal');
  const img=html.match(/<img\s+class="photo"[^>]*src="([^"]+)"/);
  const yah=ahV(dt), yce=yah?ahToCe(yah):'';
  const mintAr=ar(mintRaw);
  const mintEn=mintRaw.replace(mintAr,'').replace(/\(\s*\)/g,'').replace(/[,\-\s]+$/g,'').replace(/^[,\-\s]+/,'').trim();
  const coinName=raw||[denom,cat.name].filter(Boolean).join(' - ')||`Z#${photoId}`;

  const looksRuler=s=>{
    if(!s||s.length<4||s.length>60) return false;
    if(/^\d/.test(s)) return false;
    if(/^(AH|CE|year|from|mint|temp\.|NM\b)/i.test(s)) return false;
    if(/^(AR|AE|AV|AU|BI|Dirham|Dinar|Fals|Fils|Para|Qirsh|Drachm)/i.test(s)) return false;
    if(/^[A-Z][a-z]+$/.test(s)&&s.split(' ').length===1) return false;
    return s.split(/\s+/).length>=2||/[A-Z]/.test(s[0]);
  };
  let ruler='';
  const pts=raw.split(/,\s*/);
  for (let i=1;i<Math.min(pts.length,5);i++){
    const seg=pts[i].replace(/^(temp\.|ca\.|fl\.)\s*/i,'').replace(/\s*\([\d\-\s]+AH\)\s*/g,'').trim();
    if(looksRuler(seg)){ruler=seg;break;}
  }
  if(!ruler&&pts.length>=1){
    const seg=pts[0].replace(/\s+(AR|AE|AU|AV|BI)\s+.*$/i,'').replace(/\s+(Dirham|Dinar|Fals|Fils|Para).*/i,'').replace(/\s*\([\d\-\s]+AH\)\s*/g,'').trim();
    if(!/^(Umayyad|Abbasid|Fatimid|Mamluk|Ottoman|Ayyubid|Seljuq|Buyid|Ilkhan|Timurid|Safavid|Ghaznavid|Samanid|Artuqid|Zangid|Almoravid|Almohad|Pre-Reform|Arab)/i.test(seg)&&looksRuler(seg)) ruler=seg;
  }

  const id=String(photoId);
  return {
    id:`zeno-${id}`,cc:cat.cc,co:cat.co,co_ar:cat.co_ar,dyn:cat.dyn,
    name:coinName,nar:ar(raw),yce,yah,metal:normMetal(metal),
    wt:num(wt),dia:num(sz),km:'',nref:`Z#${id}`,nid:id,type:'Circulation',
    mint:mintEn,mint_ar:mintAr,ruler,ruler_ar:ar(ruler),
    obverse_legend:'',reverse_legend:'',
    o:img?img[1]:'',r:'',prices:null,mintageData:[],
  };
}

// ── Gallery traversal ──────────────────────────────────────────────────────────
const parseGallery=(html,catId,page)=>{
  const subcats=[],coinIds=new Set(),m_r=/showphoto\.php\?photo=(\d+)/g;
  let m;
  const fr=/href="[^"]*showgallery\.php\?cat=(\d+)"[^>]*>\s*<img[^>]+folder\.png/g;
  while((m=fr.exec(html))!==null){const id=parseInt(m[1]);if(id!==catId)subcats.push(id);}
  while((m=m_r.exec(html))!==null) coinIds.add(m[1]);
  const next=html.includes(`cat=${catId}&page=${page+1}`)?`${BASE_URL}/showgallery.php?cat=${catId}&page=${page+1}`:null;
  return {subcats,coinIds,next};
};

async function collectIds(session,catId,limit,ids,visited,depth=0){
  if(depth>MAX_DEPTH||visited.has(catId)||ids.size>=limit) return;
  visited.add(catId);
  let page=1;
  while(ids.size<limit){
    const url=`${BASE_URL}/showgallery.php?cat=${catId}${page>1?`&page=${page}`:''}`;
    const html=await session.get(url);
    if(!html) break;
    const {subcats,coinIds,next}=parseGallery(html,catId,page);
    for(const id of coinIds){ids.add(id);if(ids.size>=limit)break;}
    for(const sub of subcats){
      if(ids.size>=limit) break;
      try{await collectIds(session,sub,limit,ids,visited,depth+1);}
      catch(e){log(`  ✗ Sub ${sub}: ${e.message}`);}
    }
    if(!next) break;
    page++;
  }
}

// ── Progress / output ─────────────────────────────────────────────────────────
const loadP = ()=>{ try{return JSON.parse(fs.readFileSync(PROGRESS_FILE,'utf8'));}catch{return{scrapedIds:[]};} };
const saveP = p=>fs.writeFileSync(PROGRESS_FILE,JSON.stringify(p,null,2));
const loadO = ()=>{ try{return JSON.parse(fs.readFileSync(OUTPUT_FILE,'utf8'));}catch{return[];} };
const saveO = c=>fs.writeFileSync(OUTPUT_FILE,JSON.stringify(c,null,2));

// ── Merge ──────────────────────────────────────────────────────────────────────
function merge(label) {
  const zeno=JSON.parse(fs.readFileSync(OUTPUT_FILE,'utf8'));
  const all =JSON.parse(fs.readFileSync(COINS_FILE,'utf8'));
  const before=all.length;
  const nids=new Set(all.map(c=>c.nid)), nrefs=new Set(all.map(c=>c.nref).filter(Boolean));
  const toAdd=[]; const byCat={};
  for(const coin of zeno){
    if(nids.has(coin.nid)||nrefs.has(coin.nref)) continue;
    toAdd.push(coin); nids.add(coin.nid); nrefs.add(coin.nref);
    byCat[coin.dyn||'?']=(byCat[coin.dyn||'?']||0)+1;
  }
  const after=before+toAdd.length;
  log(`  Merge [${label}]: ${before.toLocaleString()} → ${after.toLocaleString()} (+${toAdd.length} new, ${zeno.length-toAdd.length} dupes)`);
  Object.entries(byCat).forEach(([k,n])=>log(`    ${n.toLocaleString()}  ${k}`));
  if(toAdd.length>0) fs.writeFileSync(COINS_FILE,JSON.stringify([...all,...toAdd],null,2));
  return toAdd.length;
}

// ── Update latest_additions.json ──────────────────────────────────────────────
function updateLatest() {
  const coins=JSON.parse(fs.readFileSync(COINS_FILE,'utf8'));
  const ids=coins.slice(-20).reverse().map(c=>c.id);
  fs.writeFileSync(LATEST_FILE,JSON.stringify({ids,generatedAt:new Date().toISOString()},null,2));
  log(`  latest_additions.json updated (${ids.length} entries).`);
}

// ── Scrape one dynasty ─────────────────────────────────────────────────────────
async function scrapeDynasty(session, cat) {
  log(`\n${'═'.repeat(60)}`);
  log(`Dynasty : ${cat.name}  (cat=${cat.id}, limit=${cat.limit===Infinity?'all':cat.limit})`);
  log(`dyn     : ${cat.dyn}   cc: ${cat.cc}`);
  log('═'.repeat(60));
  const progress=loadP(), output=loadO(), done=new Set(progress.scrapedIds);
  log(`  Progress: ${done.size.toLocaleString()} IDs already done`);
  log('  Collecting IDs...');
  const ids=new Set();
  try { await collectIds(session,cat.id,cat.limit,ids,new Set()); }
  catch(e) { log(`  ✗ Gallery walk error: ${e.message} — continuing with ${ids.size} IDs`); }
  const toFetch=[...ids].filter(id=>!done.has(id));
  log(`  Found ${ids.size.toLocaleString()} IDs, ${toFetch.length.toLocaleString()} to fetch (${(ids.size-toFetch.length).toLocaleString()} already done)`);
  let scraped=0, failed=0;
  for(const photoId of toFetch){
    const html=await session.get(`${BASE_URL}/showphoto.php?photo=${photoId}`);
    const coin=parseCoin(html,photoId,cat);
    if(coin){
      output.push(coin); progress.scrapedIds.push(photoId); scraped++;
      if(scraped%LOG_EVERY===0) log(`  ✓ ${scraped.toLocaleString()}/${toFetch.length.toLocaleString()} from ${cat.name}  (raw total: ${output.length.toLocaleString()})`);
      if(scraped%BATCH_SIZE===0){ saveP(progress); saveO(output); log(`  💾 Checkpoint at ${scraped.toLocaleString()}`); }
    } else {
      progress.scrapedIds.push(photoId); failed++;
    }
  }
  saveP(progress); saveO(output);
  log(`  ✓ ${cat.name}: ${scraped.toLocaleString()} scraped, ${failed} failed`);
  return scraped;
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  log('╔══════════════════════════════════════════════════════════╗');
  log('║   Extra Pipeline: Abbasid (full) + Pre-Reform + Ilkhanid ║');
  log('╚══════════════════════════════════════════════════════════╝');

  // Seed progress from all previous pipelines so we skip already-done IDs
  if (!fs.existsSync(PROGRESS_FILE)) {
    log('Seeding progress from previous pipelines...');
    const ids = new Set();
    for (const f of [MAIN_PROGRESS, P13_PROGRESS]) {
      if (fs.existsSync(f)) {
        const p=JSON.parse(fs.readFileSync(f,'utf8'));
        p.scrapedIds.forEach(id=>ids.add(id));
        log(`  Loaded ${p.scrapedIds.length.toLocaleString()} IDs from ${path.basename(f)}`);
      }
    }
    saveP({ scrapedIds: [...ids] });
    log(`  Progress seeded: ${ids.size.toLocaleString()} total known IDs`);
  } else {
    const p=loadP();
    log(`Existing progress file found: ${p.scrapedIds.length.toLocaleString()} IDs`);
  }

  const before=JSON.parse(fs.readFileSync(COINS_FILE,'utf8')).length;
  log(`\ncoins.json starting count: ${before.toLocaleString()}\n`);

  const session=new ZenoSession();
  await session.init();

  const summary=[];
  for(const cat of PIPELINE){
    const t0=Date.now();
    const scraped=await scrapeDynasty(session,cat);
    const merged=merge(cat.name);
    const mins=((Date.now()-t0)/60000).toFixed(1);
    summary.push({name:cat.name,scraped,merged,mins});
    log(`\n  ↳ ${cat.name}: ${scraped.toLocaleString()} scraped, ${merged.toLocaleString()} merged in ${mins} min\n`);
  }

  // Final stats
  const after=JSON.parse(fs.readFileSync(COINS_FILE,'utf8')).length;
  const totalMerged=after-before;

  log('\n╔══════════════════════════════════════════════════════════╗');
  log('║                   Extra Pipeline Complete                ║');
  log('╠══════════════════════════════════════════════════════════╣');
  for(const r of summary)
    log(`║  ${r.name.padEnd(26)}: ${String(r.scraped).padStart(6)} scraped, ${String(r.merged).padStart(5)} merged  ║`);
  log('╠══════════════════════════════════════════════════════════╣');
  log(`║  coins.json  ${String(before.toLocaleString()).padStart(6)} → ${String(after.toLocaleString()).padStart(6)}  (+${String(totalMerged.toLocaleString()).padStart(5)} new coins)   ║`);
  log('╚══════════════════════════════════════════════════════════╝');
  log(`\nFinal coins.json count: ${after.toLocaleString()}`);

  // Update latest_additions.json
  updateLatest();
}

main().catch(e=>{log(`FATAL: ${e.message}\n${e.stack}`);process.exit(1);});
