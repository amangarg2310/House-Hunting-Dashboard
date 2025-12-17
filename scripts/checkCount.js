import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const { count, error } = await supabase
  .from('listings')
  .select('*', { count: 'exact', head: true });

if (error) {
  console.error('Error:', error);
} else {
  console.log('Actual DB count:', count);
}

// Also check recent listings
const { data: recent } = await supabase
  .from('listings')
  .select('id, listed_date')
  .order('listed_date', { ascending: false })
  .limit(5);

console.log('\nMost recent listings:');
recent?.forEach(l => console.log(`  ${l.id}: ${l.listed_date}`));
