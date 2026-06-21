/**
 * Update Mughal coin data in Supabase:
 *   - Mint Arabic translations
 *   - Ruler Arabic translations
 *   - Metal value normalization
 * Usage: node scripts/update-mughal-data.js
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function run(label, fn) {
  try {
    const result = await fn();
    const count = result?.count ?? result?.data?.length ?? '?';
    console.log(`✅ ${label}: ${JSON.stringify(result?.error ?? `ok (${count})`).slice(0,120)}`);
    return result;
  } catch (e) {
    console.error(`❌ ${label}:`, e.message);
  }
}

async function update(mint_ar, mints) {
  const { data, error } = await supabase
    .from('coins')
    .update({ mint_ar })
    .eq('cc', 'MG')
    .in('mint', mints)
    .select('id');
  if (error) throw error;
  return { count: data?.length ?? 0 };
}

async function updateRuler(ruler_ar, pattern) {
  const { data, error } = await supabase
    .from('coins')
    .update({ ruler_ar })
    .eq('cc', 'MG')
    .ilike('ruler', `%${pattern}%`)
    .or('ruler_ar.is.null,ruler_ar.eq.')
    .select('id');
  if (error) throw error;
  return { count: data?.length ?? 0 };
}

async function updateMetal(metal, variants) {
  const { data, error } = await supabase
    .from('coins')
    .update({ metal })
    .eq('cc', 'MG')
    .in('metal', variants)
    .select('id');
  if (error) throw error;
  return { count: data?.length ?? 0 };
}

async function main() {
  // ── Task 1A: Count ──────────────────────────────────────────────────────
  const { count } = await supabase
    .from('coins')
    .select('*', { count: 'exact', head: true })
    .eq('cc', 'MG');
  console.log(`\n📊 Mughal coins in Supabase: ${count}\n`);

  // ── Task 1C: Mint translations ──────────────────────────────────────────
  console.log('── Mint translations ──');
  await run('آكرا (Agra/Akbarabad)',      () => update('آكرا',        ['Akbarabad','Agra','AKBARABAD']));
  await run('لاهور (Lahore)',             () => update('لاهور',       ['Lahore','LAHORE']));
  await run('دلهي (Delhi/Shahjahanabad)', () => update('دلهي',        ['Shahjahanabad','Delhi','SHAHJAHANABAD']));
  await run('أحمد آباد (Ahmadabad)',      () => update('أحمد آباد',   ['Ahmadabad','Ahmedabad','AHMADABAD']));
  await run('سورات (Surat)',              () => update('سورات',       ['Surat','SURAT']));
  await run('بتنة (Patna/Azimabad)',      () => update('بتنة',        ['Azimabad','Patna','AZIMABAD']));
  await run('إله آباد (Allahabad)',       () => update('إله آباد',    ['Ilahabad','Allahabad','ILAHABAD']));
  await run('بورهانبور (Burhanpur)',      () => update('بورهانبور',   ['Burhanpur','BURHANPUR']));
  await run('كابول (Kabul)',              () => update('كابول',       ['Kabul','KABUL']));
  await run('قندهار (Kandahar)',          () => update('قندهار',      ['Qandahar','Kandahar','QANDAHAR']));
  await run('مالوة (Malwa)',              () => update('مالوة',       ['Mandu','Malwa','MANDU']));
  await run('دكن (Deccan/Aurangabad)',    () => update('دكن',         ['Aurangabad','Khujista Bunyad','AURANGABAD']));
  await run('مرشد آباد (Murshidabad)',    () => update('مرشد آباد',   ['Murshidabad','MURSHIDABAD']));
  await run('بنجالة (Bengal/Satgaon)',    () => update('بنجالة',      ['Satgaon','Bengal','SATGAON']));
  await run('جونبور (Jaunpur)',           () => update('جونبور',      ['Jaunpur','JAUNPUR']));
  await run('مالده (Rajmahal/Akbarnagar)',() => update('مالده',       ['Akbarnagar','Rajmahal','AKBARNAGAR']));

  // ── Task 1D: Ruler translations ─────────────────────────────────────────
  console.log('\n── Ruler translations ──');
  await run('بابر',             () => updateRuler('بابر',              'Babur'));
  await run('همايون',           () => updateRuler('همايون',            'Humayun'));
  await run('أكبر',             () => updateRuler('أكبر',              'Akbar'));
  await run('جهانكير',          () => updateRuler('جهانكير',           'Jahangir'));
  await run('شاه جهان',         () => updateRuler('شاه جهان',          'Shah Jahan'));
  await run('أورنكزيب عالمكير', () => updateRuler('أورنكزيب عالمكير',  'Aurangzeb'));
  await run('بهادر شاه الأول',  () => updateRuler('بهادر شاه الأول',   'Bahadur Shah'));
  await run('فرخسير',           () => updateRuler('فرخسير',            'Farrukhsiyar'));
  await run('محمد شاه',         () => updateRuler('محمد شاه',          'Muhammad Shah'));
  await run('أحمد شاه بهادر',   () => updateRuler('أحمد شاه بهادر',    'Ahmad Shah'));
  await run('شاه عالم الثاني',  () => updateRuler('شاه عالم الثاني',   'Shah Alam II'));
  await run('أكبر الثاني',      () => updateRuler('أكبر الثاني',       'Akbar II'));
  await run('بهادر شاه الثاني', () => updateRuler('بهادر شاه الثاني',  'Bahadur Shah II'));

  // ── Task 1E: Metal normalization ────────────────────────────────────────
  console.log('\n── Metal normalization ──');
  await run('Gold',   () => updateMetal('Gold',   ['AV','AU','Au','gold']));
  await run('Silver', () => updateMetal('Silver', ['AR','AG','Ag','silver']));
  await run('Copper', () => updateMetal('Copper', ['AE','Cu','copper']));

  console.log('\n✅ Done.\n');
}

main().catch(e => { console.error(e); process.exit(1); });
