/**
 * Cleanup script: Remove properties that don't meet the 3+ bed AND 3+ bath criteria
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('🧹 Cleaning up invalid properties...\n');
  console.log('Deleting properties with < 3 bedrooms OR < 3 bathrooms');

  // Fetch invalid properties first
  const { data: invalid, error: fetchError } = await supabase
    .from('listings')
    .select('id, address, bedrooms, bathrooms')
    .or('bedrooms.lt.3,bathrooms.lt.3');

  if (fetchError) {
    console.error('❌ Error fetching invalid properties:', fetchError);
    process.exit(1);
  }

  console.log(`\nFound ${invalid.length} invalid properties`);
  console.log('\nExamples:');
  invalid.slice(0, 10).forEach(p => {
    console.log(`  - ${p.address} (${p.bedrooms} bed, ${p.bathrooms} bath)`);
  });

  // Delete them
  console.log(`\n🗑️  Deleting ${invalid.length} properties...`);
  const { data: deleted, error: deleteError } = await supabase
    .from('listings')
    .delete()
    .or('bedrooms.lt.3,bathrooms.lt.3')
    .select();

  if (deleteError) {
    console.error('❌ Delete error:', deleteError);
    process.exit(1);
  }

  console.log(`✅ Deleted ${deleted.length} invalid properties`);

  // Verify final state
  const { count: totalCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true });

  const { count: invalidCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .or('bedrooms.lt.3,bathrooms.lt.3');

  console.log('\n=== FINAL DATABASE STATUS ===');
  console.log('Total properties:', totalCount);
  console.log('Invalid properties remaining:', invalidCount);
  console.log('\n✅ Cleanup complete!');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
