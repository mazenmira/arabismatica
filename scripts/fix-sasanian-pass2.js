'use strict';
const fs   = require('fs');
const path = require('path');

function loadEnv() {
  const f = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(f)) {
    for (const l of fs.readFileSync(f,'utf8').split('\n')) {
      const m = l.match(/^([^#=]+)=(.*)/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g,'');
    }
  }
}
loadEnv();

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H    = {
  'apikey': KEY,
  'Authorization': 'Bearer '+KEY,
  'Content-Type': 'application/json',
  'Prefer': 'count=exact,return=minimal',
};

async function patch(filter, body, label) {
  const url = `${BASE}/rest/v1/coins?${filter}`;
  const r = await fetch(url, { method:'PATCH', headers: H, body: JSON.stringify(body) });
  if (!r.ok) {
    const t = await r.text();
    const msg = JSON.parse(t);
    console.error(`  ✗ ${label}: ${msg.code} — ${msg.message}`);
    return 0;
  }
  const cr = r.headers.get('content-range') || '';
  const cnt = cr.split('/')[1] || '?';
  console.log(`  ✓ ${label}: ${cnt} rows`);
  return parseInt(cnt)||0;
}

// Fetch all SS rows for a column (handles pagination past 1000)
async function distinctSS(col) {
  const vals = {};
  let offset = 0;
  for (;;) {
    const r = await fetch(
      `${BASE}/rest/v1/coins?cc=eq.SS&select=${col}&limit=1000&offset=${offset}`,
      { headers: { 'apikey':KEY,'Authorization':'Bearer '+KEY } }
    );
    const d = await r.json();
    if (!d.length) break;
    for (const row of d) {
      const v = row[col] ?? '(null)';
      vals[v] = (vals[v]||0)+1;
    }
    if (d.length < 1000) break;
    offset += 1000;
  }
  return Object.entries(vals).sort((a,b)=>b[1]-a[1]);
}

async function main() {
  let total = 0;

  // ════════════════════════════════════════════════════════
  // PASS 2 METALS — Lead variants, Fouree, junk
  // ════════════════════════════════════════════════════════
  console.log('\n══ METALS pass 2 ════════════════════════════════════');

  // Lead variants
  total += await patch(
    'cc=eq.SS&metal=in.(PB,Pb,pb,PB (Lead),Pb (Lead),Pb (lead),PB (lead),lead,Lead,lead Pb,lead%2C Pb,Pb lead,Pb Lead)',
    { metal: 'Lead' },
    'Pb/PB/lead → Lead'
  );
  // Quoted "AR"
  total += await patch('cc=eq.SS&metal=eq.%22AR%22', { metal: 'Silver' }, '"AR" → Silver');
  // Base ag
  total += await patch('cc=eq.SS&metal=ilike.base ag*', { metal: 'Silver' }, 'Base ag → Silver');
  // ARz → Silver
  total += await patch('cc=eq.SS&metal=eq.ARz', { metal: 'Silver' }, 'ARz → Silver');
  // ARE → Bronze
  total += await patch('cc=eq.SS&metal=eq.ARE', { metal: 'Bronze' }, 'ARE → Bronze');
  // Cyrillic AE (АЕ) → Bronze
  total += await patch('cc=eq.SS&metal=eq.АЕ', { metal: 'Bronze' }, 'АЕ (Cyrillic) → Bronze');
  // Æ/2 → Bronze
  total += await patch('cc=eq.SS&metal=eq.%C3%86%2F2', { metal: 'Bronze' }, 'Æ/2 → Bronze');
  // Fourrée variants → Fourrée
  total += await patch('cc=eq.SS&metal=ilike.fouree*', { metal: 'Fourrée' }, 'fouree → Fourrée');
  total += await patch('cc=eq.SS&metal=ilike.fourrée*&metal=not.eq.Fourrée', { metal: 'Fourrée' }, 'Fourrée variants');
  total += await patch('cc=eq.SS&metal=eq.Fourrée AV', { metal: 'Fourrée' }, 'Fourrée AV → Fourrée');
  total += await patch('cc=eq.SS&metal=eq.Tin-zinc alloy', { metal: 'Billon' }, 'Tin-zinc → Billon');
  // "Drachm" is a denomination not a metal — clear it
  total += await patch('cc=eq.SS&metal=eq.Drachm', { metal: '' }, 'Drachm (denomination) → clear metal');
  // Junk singles
  total += await patch('cc=eq.SS&metal=eq.R', { metal: '' }, 'metal=R → clear');
  total += await patch('cc=eq.SS&metal=eq.%3F', { metal: '' }, 'metal=? → clear');

  // ════════════════════════════════════════════════════════
  // RULERS — Standardise real names, clear junk with ''
  // (ruler column is NOT NULL — cannot set to null)
  // ════════════════════════════════════════════════════════
  console.log('\n══ RULERS pass 2 ════════════════════════════════════');

  // Standardise real ruler names (remove AD dates and variant spellings)
  const rulerMap = [
    // Khosrow I (531-579) — many spellings
    ['ilike.*Khusru I*',   { ruler: 'Khosrow I',    ruler_ar: 'خسرو الأول'    }],
    ['ilike.*Khosrow I*&ruler=not.eq.Khosrow I', { ruler: 'Khosrow I', ruler_ar: 'خسرو الأول' }],
    ['ilike.*Chosroes I*', { ruler: 'Khosrow I',    ruler_ar: 'خسرو الأول'    }],
    // Kavad I
    ['ilike.*Kavadh I*',   { ruler: 'Kavad I',      ruler_ar: 'قباد الأول'    }],
    ['ilike.*Kavad I*&ruler=not.eq.Kavad I', { ruler: 'Kavad I', ruler_ar: 'قباد الأول' }],
    // Hormizd IV
    ['ilike.*Hormizd IV*', { ruler: 'Hormizd IV',   ruler_ar: 'هرمز الرابع'   }],
    ['ilike.*Hormizd 4*',  { ruler: 'Hormizd IV',   ruler_ar: 'هرمز الرابع'   }],
    // Yazdegerd I
    ['ilike.*Yazdegird I*&ruler=not.ilike.*II*', { ruler: 'Yazdegerd I',  ruler_ar: 'يزدجرد الأول'  }],
    ['ilike.*Yazdegerd I*&ruler=not.eq.Yazdegerd I', { ruler: 'Yazdegerd I', ruler_ar: 'يزدجرد الأول' }],
    // Bahram V (Varhran V, Varahran V)
    ['ilike.*Varhran*V*',  { ruler: 'Bahram V',     ruler_ar: 'بهرام الخامس'  }],
    ['ilike.*Varahran*V*', { ruler: 'Bahram V',     ruler_ar: 'بهرام الخامس'  }],
    ['ilike.*Bahram V*&ruler=not.eq.Bahram V', { ruler: 'Bahram V', ruler_ar: 'بهرام الخامس' }],
    // Bahram II
    ['ilike.*Varhran*II*', { ruler: 'Bahram II',    ruler_ar: 'بهرام الثاني'  }],
    ['ilike.*Bahram II*&ruler=not.eq.Bahram II', { ruler: 'Bahram II', ruler_ar: 'بهرام الثاني' }],
    // Bahram III
    ['ilike.*Varhran*III*',{ ruler: 'Bahram III',   ruler_ar: 'بهرام الثالث'  }],
    // Bahram IV
    ['ilike.*Varhran*IV*', { ruler: 'Bahram IV',    ruler_ar: 'بهرام الرابع'  }],
    ['ilike.*Bahram IV*&ruler=not.eq.Bahram IV', { ruler: 'Bahram IV', ruler_ar: 'بهرام الرابع' }],
    // Bahram I
    ['ilike.*Varhran*I*&ruler=not.ilike.*II*&ruler=not.ilike.*IV*&ruler=not.ilike.*V*', { ruler: 'Bahram I', ruler_ar: 'بهرام الأول' }],
    // Shapur II
    ['ilike.*Shapur II*&ruler=not.ilike.*III*', { ruler: 'Shapur II', ruler_ar: 'سابور الثاني' }],
    // Shapur III
    ['ilike.*Shapur III*', { ruler: 'Shapur III',   ruler_ar: 'سابور الثالث'  }],
    // Shapur I
    ['ilike.*Shapur I*&ruler=not.ilike.*II*&ruler=not.ilike.*III*', { ruler: 'Shapur I', ruler_ar: 'سابور الأول' }],
    // Ardashir I/II/III
    ['ilike.*Ardashir I*&ruler=not.ilike.*II*&ruler=not.ilike.*III*', { ruler: 'Ardashir I', ruler_ar: 'أردشير الأول' }],
    ['ilike.*Ardashir II*&ruler=not.ilike.*III*', { ruler: 'Ardashir II', ruler_ar: 'أردشير الثاني' }],
    ['ilike.*Ardashir III*', { ruler: 'Ardashir III', ruler_ar: 'أردشير الثالث' }],
    // Peroz I
    ['ilike.*Peroz I*',    { ruler: 'Peroz I',      ruler_ar: 'فيروز الأول'   }],
    ['ilike.*Peroze*',     { ruler: 'Peroz I',      ruler_ar: 'فيروز الأول'   }],
    // Yazdegerd II
    ['ilike.*Yazdegird II*', { ruler: 'Yazdegerd II', ruler_ar: 'يزدجرد الثاني' }],
    ['ilike.*Yazdegerd II*&ruler=not.eq.Yazdegerd II', { ruler: 'Yazdegerd II', ruler_ar: 'يزدجرد الثاني' }],
    // Yazdegerd III
    ['ilike.*Yazdegird III*', { ruler: 'Yazdegerd III', ruler_ar: 'يزدجرد الثالث' }],
    ['ilike.*Yazdegerd III*&ruler=not.eq.Yazdegerd III', { ruler: 'Yazdegerd III', ruler_ar: 'يزدجرد الثالث' }],
    // Hormizd I/II/III
    ['ilike.*Hormizd I*&ruler=not.ilike.*II*&ruler=not.ilike.*III*&ruler=not.ilike.*IV*', { ruler: 'Hormizd I', ruler_ar: 'هرمز الأول' }],
    ['ilike.*Hormizd II*&ruler=not.ilike.*III*&ruler=not.ilike.*IV*', { ruler: 'Hormizd II', ruler_ar: 'هرمز الثاني' }],
    ['ilike.*Hormizd III*&ruler=not.ilike.*IV*', { ruler: 'Hormizd III', ruler_ar: 'هرمز الثالث' }],
    // Narseh
    ['ilike.*Narseh*',     { ruler: 'Narseh',       ruler_ar: 'نرسي'          }],
    ['ilike.*Narses*',     { ruler: 'Narseh',       ruler_ar: 'نرسي'          }],
    // Balash
    ['ilike.*Balash*',     { ruler: 'Balash',       ruler_ar: 'بلاش'          }],
    ['ilike.*Walash*',     { ruler: 'Balash',       ruler_ar: 'بلاش'          }],
    // Jamasp
    ['ilike.*Jamasp*',     { ruler: 'Jamasp',       ruler_ar: 'جاماسب'        }],
    // Khosrow II (any remaining variants with dates)
    ['ilike.*Khusru II*',  { ruler: 'Khosrow II',   ruler_ar: 'خسرو الثاني'   }],
    // Kavad II
    ['ilike.*Kavad II*',   { ruler: 'Kavad II',     ruler_ar: 'قباد الثاني'   }],
    ['ilike.*Kavadh II*',  { ruler: 'Kavad II',     ruler_ar: 'قباد الثاني'   }],
    // Boran
    ['ilike.*Boran*',      { ruler: 'Boran',        ruler_ar: 'بوران'         }],
    // Shahrbaraz
    ['ilike.*Shahrbaraz*', { ruler: 'Shahrbaraz',   ruler_ar: 'شهربراز'       }],
  ];

  for (const [filter, body] of rulerMap) {
    total += await patch(`cc=eq.SS&ruler=${filter}`, body, `ruler ${filter.slice(0,40)}`);
  }

  // Clear junk ruler values — metals, coin types, mint abbreviations
  // Must use '' not null because ruler is NOT NULL
  const junkRulerValues = [
    // Metals appearing as rulers
    'Silver','Gold','Copper / base metal','Bronze','Billon','Lead',
    // Coin types / classifications
    'Contemporary imitations','Fake, fantasy and doubtful coins',
    '3rd crown, AD c. 474-484','2nd crown, AD c. 458-c. 474',
    '1st crown, AD c. 420-c. 457',
    'Uncertain rulers','Rare mints',
    // Mint abbreviations (ones the scraper wrongly put in ruler)
    'BYSh','WYHC','WYH','BBA','ART','NM','MY','YZ','AS','GW','BN',
    'AYLAN','AYL','LYW','NAL','ALM','APH','WLC','APL','AHM','ShY',
    'AT','PL','NY','AM','HL','SK','LD','ST','AW','GD','DA',
    // URLs (retry with '' since null failed)
  ];

  for (const junk of junkRulerValues) {
    total += await patch(
      `cc=eq.SS&ruler=eq.${encodeURIComponent(junk)}`,
      { ruler: '' },
      `ruler="${junk}" → ''`
    );
  }
  // URL rulers → ''
  total += await patch('cc=eq.SS&ruler=ilike.*http*', { ruler: '' }, 'URL rulers → empty');
  total += await patch('cc=eq.SS&ruler=ilike.*zeno.ru*', { ruler: '' }, 'zeno.ru rulers → empty');

  // ════════════════════════════════════════════════════════
  // MINTS pass 2 — additional abbreviations
  // ════════════════════════════════════════════════════════
  console.log('\n══ MINTS pass 2 ═════════════════════════════════════');

  const mintMap2 = [
    // WYHC = Veh-Andiyok-Shapur (Gundeshapur) — same city as WH
    [['WYHC'], 'Gundeshapur', 'جنديسابور'],
    // WYH = Veh-Ardashir (a suburb of Ctesiphon) or Gundeshapur variant
    [['WYH'],  'Veh-Ardashir', 'وه اردشير'],
    // BBA = unknown but possibly Bishapur-area variant
    [['BBA'],  'Bishapur (BBA)', 'بيشابور'],
    // ART = Ardashir-Khwarrah variant or Ardashir's mint
    [['ART'],  'Ardashir-Khwarrah', 'اردشير خوره'],
    // AS = Aspahan (Isfahan)
    [['AS'],   'Isfahan', 'أصفهان'],
    // MY = uncertain, possibly Mayshan
    [['MY'],   'Mayshan', 'ميسان'],
    // YZ = uncertain, possibly Yazd
    [['YZ'],   'Yazd', 'يزد'],
    // GW = Gur / Firuzabad
    [['GW'],   'Gur', 'گور'],
    // BN = Bun-Ardashir or similar
    [['BN'],   'Bun-Ardashir', 'بن اردشير'],
    // AT = Ardashir-Khwarrah or Atropatene
    [['AT'],   'Atropatene', 'أذربيجان'],
    // PL = Abarshahr area (alternate form of APL)
    [['PL'],   'Nishapur', 'نيسابور'],
    // HL = Hulwan
    [['HL'],   'Hulwan', 'حلوان'],
    // APH = uncertain mint
    [['APH'],  'APH', ''],
    // WLC = uncertain
    [['WLC'],  'WLC', ''],
    // LYW = Ray variant or Luristani mint
    [['LYW'],  'Ray', 'الري'],
  ];

  for (const [abbrevs, city, cityAr] of mintMap2) {
    const filter = abbrevs.length === 1
      ? `cc=eq.SS&mint=eq.${encodeURIComponent(abbrevs[0])}`
      : `cc=eq.SS&mint=in.(${abbrevs.map(a=>encodeURIComponent(a)).join(',')})`;
    total += await patch(filter, { mint: city, ...(cityAr ? { mint_ar: cityAr } : {}) }, `mint → ${city}`);
  }

  // Also clear mint='6' (clearly junk)
  total += await patch('cc=eq.SS&mint=eq.6', { mint: '' }, 'mint=6 → clear');

  // ════════════════════════════════════════════════════════
  // FINAL STATE
  // ════════════════════════════════════════════════════════
  console.log('\n══ FINAL: Metals ════════════════════════════════════');
  (await distinctSS('metal')).forEach(([k,v])=>console.log(`  ${v}\t${k}`));

  console.log('\n══ FINAL: Rulers (top 30) ═══════════════════════════');
  (await distinctSS('ruler')).slice(0,30).forEach(([k,v])=>console.log(`  ${v}\t${k}`));

  console.log('\n══ FINAL: Mints (top 25) ════════════════════════════');
  (await distinctSS('mint')).slice(0,25).forEach(([k,v])=>console.log(`  ${v}\t${k}`));

  console.log(`\n══ PASS 2 TOTAL ROWS UPDATED: ${total} ════════════════`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
