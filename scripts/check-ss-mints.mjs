import { createClient } from '@supabase/supabase-js';
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await db.from('coins')
  .select('mint')
  .eq('cc', 'SS')
  .neq('mint', '')
  .not('mint', 'is', null);

if (error) { console.error(error.message); process.exit(1); }

const counts = new Map();
for (const r of data) counts.set(r.mint, (counts.get(r.mint) ?? 0) + 1);
const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

console.log('mint'.padEnd(35) + 'total');
console.log('-'.repeat(45));
for (const [mint, n] of sorted.slice(0, 30))
  console.log(mint.padEnd(35) + n);
console.log('\nTotal distinct mints:', sorted.length);
