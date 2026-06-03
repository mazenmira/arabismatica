'use strict';
/**
 * pipeline-p4.js
 * Priority 4: Buyid (Buwayhid) + Samanid
 * Then: tsc check, latest_additions update, handoff.zip
 *
 * Designed to run AFTER pipeline-extra.js has finished.
 *
 * Log: scripts/pipeline-p4.log
 */

const fs            = require('fs');
const path          = require('path');
const { execSync }  = require('child_process');

const SCRIPTS_DIR   = path.resolve(__dirname);
const PROGRESS_FILE = path.join(SCRIPTS_DIR, 'zeno_progress_p4.json');
const OUTPUT_FILE   = path.join(SCRIPTS_DIR, 'zeno_raw_p4.json');
const COINS_FILE    = path.resolve(SCRIPTS_DIR, '../src/data/coins.json');
const LATEST_FILE   = path.resolve(SCRIPTS_DIR, '../src/data/latest_additions.json');
const ROOT          = path.resolve(SCRIPTS_DIR, '..');

// All previously generated progress files to seed "already done" IDs
const SEED_FILES = [
  'zeno_progress.json',
  'zeno_progress_13.json',
  'zeno_progress_extra.json',
].map(f => path.join(SCRIPTS_DIR, f));

// ── Pipeline ───────────────────────────────────────────────────────────────────
const PIPELINE = [
  {
    id: 1025, name: 'Buyid (Buwayhid)', limit: Infinity,
    cc: 'IS', co: 'Islamic', co_ar: 'إسلامي', dyn: 'البويهيون',
  },
  {
    id: 1100, name: 'Samanid', limit: Infinity,
    cc: 'IS', co: 'Islamic', co_ar: 'إسلامي', dyn: 'السامانيون',
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
const METAL_MAP = {'gold':'Gold','silver':'Silver','copper':'Copper','bronze':'Bronze','billon':'Billon','billion':'Billon','brass':'Brass','au':'Gold','ar':'Silver','ae':'Bronze','bi':'Billon','fe':'Iron'};
const normMetal = r => { if(!r) return ''; const l=r.toLowerCase().replace(/[^a-z]/g,''); for(const[k,v] of Object.entries(METAL_MAP)) if(l===k||l.startsWith(k)) return v; return r.trim(); };

// ── HTTP session ───────────────────────────────────────────────────────────────
class ZenoSession {
  constructor(){this.cookie='';this.lastReq=0;}
  async init(){
    const r1=await this._raw(`${BASE_URL}/showphoto.php`);this._mc(r1.sc);await sleep(1500);
    const r2=await this._raw(`${BASE_URL}/showphoto.php`);this._mc(r2.sc);await sleep(600);
    log(`Session ready. ${this.cookie.slice(0,50)}...`);
  }
  async get(url,retries=3){
    const wait=RATE_LIMIT_MS+Math.floor(Math.random()*JITTER_MS)-(Date.now()-this.lastReq);
    if(wait>0) await sleep(wait);
    for(let a=0;a<=retries;a++){
      try{
        const r=await this._raw(url);this._mc(r.sc);this.lastReq=Date.now();
        if(r.body?.includes('Forwarding to requested page')){
          await sleep(1500);const r2=await this._raw(url);this._mc(r2.sc);this.lastReq=Date.now();
          if(r2.body.includes('Forwarding')){await sleep(2000);const r3=await this._raw(url);this._mc(r3.sc);this.lastReq=Date.now();return r3.body;}
          return r2.body;
        }
        if(r.status===429||r.status===503){log(`⚠ HTTP ${r.status} — 60s`);await sleep(RETRY_WAIT_MS);continue;}
        if(r.status===404) return null;
        if(r.status!==200) throw new Error(`HTTP ${r.status}: ${url}`);
        return r.body;
      }catch(e){if(a<retries){await sleep(3000*(a+1));continue;}log(`✗ ${url}: ${e.message}`);return null;}
    }
    return null;
  }
  async _raw(url,hops=5){
    const ctrl=new AbortController(),t=setTimeout(()=>ctrl.abort(),FETCH_TIMEOUT);
    try{
      const res=await globalThis.fetch(url,{signal:ctrl.signal,redirect:'manual',headers:{'User-Agent':'Mozilla/5.0 Chrome/124','Accept':'text/html,*/*','Accept-Language':'en-US,en;q=0.9,ar;q=0.8','Cookie':this.cookie}});
      clearTimeout(t);
      const sc=res.headers.getSetCookie?res.headers.getSetCookie():[];
      if(res.status>=300&&res.status<400&&res.headers.get('location')){this._mc(sc);return hops>0?this._raw(new URL(res.headers.get('location'),url).href,hops-1):{body:'',status:0,sc:[]};}
      return{body:await res.text(),status:res.status,sc};
    }catch(e){clearTimeout(t);if(e.name==='AbortError')throw new Error(`Timeout: ${url}`);throw e;}
  }
  _mc(sc){
    if(!sc?.length) return;
    const jar=new Map(this.cookie.split('; ').filter(Boolean).map(p=>{const eq=p.indexOf('=');return[p.slice(0,eq),p.slice(eq+1)];}));
    for(const l of sc){const[p]=l.split(';');const eq=p.indexOf('=');jar.set(p.slice(0,eq).trim(),p.slice(eq+1).trim());}
    this.cookie=[...jar.entries()].map(([k,v])=>`${k}=${v}`).join('; ');
  }
}

// ── Parse ──────────────────────────────────────────────────────────────────────
const strip=h=>h.replace(/<br\s*\/?>/gi,' ').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(parseInt(n))).replace(/&#x([\da-f]+);/gi,(_,h)=>String.fromCharCode(parseInt(h,16))).trim();
const ef=(html,lbl)=>{const m=html.match(new RegExp(`<b>${lbl}[^<]*</b>([^<]*)`, 'i'));return m?strip(m[1]).trim():'';};
const ar=t=>{const m=(t||'').match(/[؀-ۿݐ-ݿࢠ-ࣿ]+(?:\s+[؀-ۿݐ-ݿࢠ-ࣿ]+)*/g);return m?m.join(' ').trim():'';};
const num=s=>{const m=(s||'').match(/([\d.]+)/);return m?parseFloat(m[1]):null;};
const ahV=s=>{const m=(s||'').match(/(?:AH\s*)?(\d{2,4})(?:\s*AH|\s*\/\s*\d{3,4})?/i);return m?m[1]:'';};

function parseCoin(html,photoId,cat){
  if(!html||html.includes('Forwarding')) return null;
  const tM=html.match(/<div>\s*#\d+:\s*([\s\S]*?)<\/div>/);
  const raw=tM?strip(tM[1]).trim():'';
  const ii=html.indexOf('Additional Info');const info=ii>=0?html.slice(ii,ii+3000):'';
  const wt=ef(info,'Weight'),sz=ef(info,'Size'),mintRaw=ef(info,'Mint'),dt=ef(info,'Date'),denom=ef(info,'Denomination'),metal=ef(info,'Metal');
  const img=html.match(/<img\s+class="photo"[^>]*src="([^"]+)"/);
  const yah=ahV(dt),yce=yah?ahToCe(yah):'';
  const mintAr=ar(mintRaw);
  const mintEn=mintRaw.replace(mintAr,'').replace(/\(\s*\)/g,'').replace(/[,\-\s]+$/g,'').replace(/^[,\-\s]+/,'').trim();
  const coinName=raw||[denom,cat.name].filter(Boolean).join(' - ')||`Z#${photoId}`;
  const looksRuler=s=>{if(!s||s.length<4||s.length>60)return false;if(/^\d/.test(s))return false;if(/^(AH|CE|year|from|mint|temp\.|NM\b)/i.test(s))return false;if(/^(AR|AE|AV|AU|BI|Dirham|Dinar|Fals|Fils|Para|Qirsh)/i.test(s))return false;if(/^[A-Z][a-z]+$/.test(s)&&s.split(' ').length===1)return false;return s.split(/\s+/).length>=2||/[A-Z]/.test(s[0]);};
  let ruler='';
  const pts=raw.split(/,\s*/);
  for(let i=1;i<Math.min(pts.length,5);i++){const seg=pts[i].replace(/^(temp\.|ca\.|fl\.)\s*/i,'').replace(/\s*\([\d\-\s]+AH\)\s*/g,'').trim();if(looksRuler(seg)){ruler=seg;break;}}
  if(!ruler&&pts.length>=1){const seg=pts[0].replace(/\s+(AR|AE|AU|AV|BI)\s+.*$/i,'').replace(/\s+(Dirham|Dinar|Fals|Fils|Para).*/i,'').replace(/\s*\([\d\-\s]+AH\)\s*/g,'').trim();if(!/^(Umayyad|Abbasid|Fatimid|Mamluk|Ottoman|Ayyubid|Seljuq|Buyid|Buwayhid|Samanid|Ilkhan|Timurid|Safavid|Ghaznavid|Artuqid|Zangid|Almoravid|Almohad|Pre-Reform|Arab)/i.test(seg)&&looksRuler(seg)) ruler=seg;}
  const id=String(photoId);
  return{id:`zeno-${id}`,cc:cat.cc,co:cat.co,co_ar:cat.co_ar,dyn:cat.dyn,name:coinName,nar:ar(raw),yce,yah,metal:normMetal(metal),wt:num(wt),dia:num(sz),km:'',nref:`Z#${id}`,nid:id,type:'Circulation',mint:mintEn,mint_ar:mintAr,ruler,ruler_ar:ar(ruler),obverse_legend:'',reverse_legend:'',o:img?img[1]:'',r:'',prices:null,mintageData:[]};
}

// ── Gallery ────────────────────────────────────────────────────────────────────
const parseGallery=(html,catId,page)=>{
  const subcats=[],coinIds=new Set();let m;
  const fr=/href="[^"]*showgallery\.php\?cat=(\d+)"[^>]*>\s*<img[^>]+folder\.png/g;
  while((m=fr.exec(html))!==null){const id=parseInt(m[1]);if(id!==catId)subcats.push(id);}
  const pr=/showphoto\.php\?photo=(\d+)/g;while((m=pr.exec(html))!==null)coinIds.add(m[1]);
  const next=html.includes(`cat=${catId}&page=${page+1}`)?`${BASE_URL}/showgallery.php?cat=${catId}&page=${page+1}`:null;
  return{subcats,coinIds,next};
};
async function collectIds(session,catId,limit,ids,visited,depth=0){
  if(depth>MAX_DEPTH||visited.has(catId)||ids.size>=limit)return;
  visited.add(catId);let page=1;
  while(ids.size<limit){
    const html=await session.get(`${BASE_URL}/showgallery.php?cat=${catId}${page>1?`&page=${page}`:''}`);
    if(!html)break;
    const{subcats,coinIds,next}=parseGallery(html,catId,page);
    for(const id of coinIds){ids.add(id);if(ids.size>=limit)break;}
    for(const sub of subcats){if(ids.size>=limit)break;try{await collectIds(session,sub,limit,ids,visited,depth+1);}catch(e){log(`  ✗ Sub ${sub}: ${e.message}`);}}
    if(!next)break;page++;
  }
}

// ── Progress / output ─────────────────────────────────────────────────────────
const loadP=()=>{try{return JSON.parse(fs.readFileSync(PROGRESS_FILE,'utf8'));}catch{return{scrapedIds:[]};}};
const saveP=p=>fs.writeFileSync(PROGRESS_FILE,JSON.stringify(p,null,2));
const loadO=()=>{try{return JSON.parse(fs.readFileSync(OUTPUT_FILE,'utf8'));}catch{return[];}};
const saveO=c=>fs.writeFileSync(OUTPUT_FILE,JSON.stringify(c,null,2));

// ── Merge ──────────────────────────────────────────────────────────────────────
function merge(label){
  const zeno=JSON.parse(fs.readFileSync(OUTPUT_FILE,'utf8'));
  const all=JSON.parse(fs.readFileSync(COINS_FILE,'utf8'));
  const before=all.length,nids=new Set(all.map(c=>c.nid)),nrefs=new Set(all.map(c=>c.nref).filter(Boolean));
  const toAdd=[],byCat={};
  for(const coin of zeno){if(nids.has(coin.nid)||nrefs.has(coin.nref))continue;toAdd.push(coin);nids.add(coin.nid);nrefs.add(coin.nref);byCat[coin.dyn||'?']=(byCat[coin.dyn||'?']||0)+1;}
  const after=before+toAdd.length;
  log(`  Merge [${label}]: ${before.toLocaleString()} → ${after.toLocaleString()} (+${toAdd.length} new, ${zeno.length-toAdd.length} dupes)`);
  Object.entries(byCat).forEach(([k,n])=>log(`    ${n}  ${k}`));
  if(toAdd.length>0)fs.writeFileSync(COINS_FILE,JSON.stringify([...all,...toAdd],null,2));
  return toAdd.length;
}

// ── Scrape one dynasty ─────────────────────────────────────────────────────────
async function scrapeDynasty(session,cat){
  log(`\n${'═'.repeat(60)}`);
  log(`Dynasty: ${cat.name}  (cat=${cat.id})  dyn: ${cat.dyn}`);
  log('═'.repeat(60));
  const progress=loadP(),output=loadO(),done=new Set(progress.scrapedIds);
  log(`  ${done.size.toLocaleString()} IDs already in progress`);
  log('  Collecting IDs...');
  const ids=new Set();
  try{await collectIds(session,cat.id,cat.limit,ids,new Set());}
  catch(e){log(`  ✗ Gallery walk: ${e.message}`);}
  const toFetch=[...ids].filter(id=>!done.has(id));
  log(`  Found ${ids.size.toLocaleString()} IDs, ${toFetch.length.toLocaleString()} to fetch (${(ids.size-toFetch.length).toLocaleString()} done)`);
  let scraped=0,failed=0;
  for(const photoId of toFetch){
    const html=await session.get(`${BASE_URL}/showphoto.php?photo=${photoId}`);
    const coin=parseCoin(html,photoId,cat);
    if(coin){output.push(coin);progress.scrapedIds.push(photoId);scraped++;
      if(scraped%LOG_EVERY===0)log(`  ✓ ${scraped}/${toFetch.length} from ${cat.name} (raw: ${output.length})`);
      if(scraped%BATCH_SIZE===0){saveP(progress);saveO(output);log(`  💾 Checkpoint at ${scraped}`);}
    }else{progress.scrapedIds.push(photoId);failed++;}
  }
  saveP(progress);saveO(output);
  log(`  ✓ ${cat.name}: ${scraped.toLocaleString()} scraped, ${failed} failed`);
  return scraped;
}

// ── Finishing tasks ────────────────────────────────────────────────────────────
function runTsc(){
  log('\n── TypeScript check (npx tsc --noEmit) ────────────────────────');
  try{
    execSync('npx tsc --noEmit',{cwd:ROOT,stdio:'pipe',timeout:120_000});
    log('  ✅ tsc: no errors');
    return true;
  }catch(e){
    const out=(e.stdout?.toString()||'')+(e.stderr?.toString()||'');
    log(`  ⚠ tsc errors:\n${out.slice(0,2000)}`);
    return false;
  }
}

function updateLatest(){
  const coins=JSON.parse(fs.readFileSync(COINS_FILE,'utf8'));
  const ids=coins.slice(-20).reverse().map(c=>c.id);
  fs.writeFileSync(LATEST_FILE,JSON.stringify({ids,generatedAt:new Date().toISOString()},null,2));
  log(`  latest_additions.json updated — last 20: ${ids.slice(0,3).join(', ')} ...`);
}

function createHandoffZip(){
  log('\n── Creating scripts/handoff.zip ────────────────────────────────');
  const zipPath=path.join(SCRIPTS_DIR,'handoff.zip');
  const files=[
    'src/data/coins.json',
    'src/data/latest_additions.json',
  ];
  const tmpDir=path.join(SCRIPTS_DIR,'_handoff_tmp2');
  if(fs.existsSync(tmpDir))fs.rmSync(tmpDir,{recursive:true});
  for(const f of files){
    const src=path.join(ROOT,f),dest=path.join(tmpDir,f);
    fs.mkdirSync(path.dirname(dest),{recursive:true});
    fs.copyFileSync(src,dest);
    const kb=Math.round(fs.statSync(src).size/1024);
    log(`  ${f}  (${kb.toLocaleString()} KB)`);
  }
  if(fs.existsSync(zipPath))fs.unlinkSync(zipPath);
  const cmd=`powershell -Command "Compress-Archive -Path '${tmpDir.replace(/\\/g,'/')}/*' -DestinationPath '${zipPath.replace(/\\/g,'/').replace(/'/g,"''")}' -Force"`;
  execSync(cmd,{stdio:'inherit'});
  fs.rmSync(tmpDir,{recursive:true});
  const zipKB=Math.round(fs.statSync(zipPath).size/1024);
  log(`  ✅ handoff.zip created: ${zipKB.toLocaleString()} KB`);
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main(){
  log('╔══════════════════════════════════════════════════════════╗');
  log('║   Priority 4 Pipeline: Buyid + Samanid + Finish Tasks   ║');
  log('╚══════════════════════════════════════════════════════════╝');

  // Seed progress from ALL previous pipelines
  if(!fs.existsSync(PROGRESS_FILE)){
    log('Seeding progress from all previous pipelines...');
    const ids=new Set();
    for(const f of SEED_FILES){
      if(fs.existsSync(f)){
        const p=JSON.parse(fs.readFileSync(f,'utf8'));
        p.scrapedIds.forEach(id=>ids.add(id));
        log(`  +${p.scrapedIds.length.toLocaleString()} from ${path.basename(f)}`);
      }
    }
    saveP({scrapedIds:[...ids]});
    log(`  Total seeded: ${ids.size.toLocaleString()} IDs`);
  }

  const before=JSON.parse(fs.readFileSync(COINS_FILE,'utf8')).length;
  log(`\ncoins.json start: ${before.toLocaleString()}\n`);

  const session=new ZenoSession();
  await session.init();

  const summary=[];
  for(const cat of PIPELINE){
    const t0=Date.now();
    const scraped=await scrapeDynasty(session,cat);
    const merged=merge(cat.name);
    summary.push({name:cat.name,scraped,merged,mins:((Date.now()-t0)/60000).toFixed(1)});
    log(`\n  ↳ ${cat.name}: ${scraped.toLocaleString()} scraped, ${merged.toLocaleString()} merged\n`);
  }

  // Finishing tasks
  runTsc();
  updateLatest();
  createHandoffZip();

  // Final summary
  const after=JSON.parse(fs.readFileSync(COINS_FILE,'utf8')).length;
  const totalMerged=after-before;

  log('\n╔══════════════════════════════════════════════════════════╗');
  log('║                   P4 Pipeline Complete                  ║');
  log('╠══════════════════════════════════════════════════════════╣');
  for(const r of summary)
    log(`║  ${r.name.padEnd(22)}: ${String(r.scraped).padStart(6)} scraped, ${String(r.merged).padStart(5)} merged  ║`);
  log('╠══════════════════════════════════════════════════════════╣');
  log(`║  coins.json: ${before.toLocaleString()} → ${after.toLocaleString()} (+${totalMerged.toLocaleString()} new)`.padEnd(61)+'║');
  log('╚══════════════════════════════════════════════════════════╝');
  log(`\nFinal coins.json count: ${after.toLocaleString()}`);
}

main().catch(e=>{log(`FATAL: ${e.message}\n${e.stack}`);process.exit(1);});
