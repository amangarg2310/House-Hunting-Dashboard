import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const { data, count } = await supabase
  .from('listings')
  .select('listing_type', { count: 'exact' })
  .limit(10000);

if (!data) {
  console.log('No data returned from Supabase');
  process.exit(1);
}

const rentCount = data.filter(l => l.listing_type === 'rent').length;
const saleCount = data.filter(l => l.listing_type === 'sale').length;
const bothCount = data.filter(l => l.listing_type === 'both').length;

console.log(`Total listings: ${count}`);
console.log(`Listing type breakdown:`);
console.log(`  Rent: ${rentCount}`);
console.log(`  Sale: ${saleCount}`);
console.log(`  Both: ${bothCount}`);
