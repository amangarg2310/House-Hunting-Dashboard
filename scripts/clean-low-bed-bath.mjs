/**
 * Clean up properties with < 3 bedrooms or < 3 bathrooms
 * These were added by the cron job before the bed/bath filter was added
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
  console.log('🧹 Cleaning up properties with < 3 bed or < 3 bath...\n');

  // Get properties with low bed/bath counts
  const { data: lowBedProperties, error: lowBedError } = await supabase
    .from('listings')
    .select('id, address, bedrooms, bathrooms')
    .lt('bedrooms', 3);

  if (lowBedError) {
    console.error('❌ Error fetching low bedroom properties:', lowBedError);
    process.exit(1);
  }

  const { data: lowBathProperties, error: lowBathError } = await supabase
    .from('listings')
    .select('id, address, bedrooms, bathrooms')
    .lt('bathrooms', 3);

  if (lowBathError) {
    console.error('❌ Error fetching low bathroom properties:', lowBathError);
    process.exit(1);
  }

  // Combine and deduplicate
  const allLowProperties = new Map();
  [...lowBedProperties, ...lowBathProperties].forEach(prop => {
    allLowProperties.set(prop.id, prop);
  });

  const propertiesToDelete = Array.from(allLowProperties.values());

  console.log(`Found ${propertiesToDelete.length} properties to delete:\n`);
  console.log(`  ${lowBedProperties.length} with < 3 bedrooms`);
  console.log(`  ${lowBathProperties.length} with < 3 bathrooms\n`);

  if (propertiesToDelete.length === 0) {
    console.log('✅ No properties to clean up!');
    return;
  }

  // Show first 10 as sample
  console.log('Sample of properties to be deleted:');
  propertiesToDelete.slice(0, 10).forEach(prop => {
    console.log(`  - ${prop.address} (${prop.bedrooms} bed, ${prop.bathrooms} bath)`);
  });

  if (propertiesToDelete.length > 10) {
    console.log(`  ... and ${propertiesToDelete.length - 10} more\n`);
  } else {
    console.log('');
  }

  // Delete the properties
  const idsToDelete = propertiesToDelete.map(p => p.id);

  const { error: deleteError } = await supabase
    .from('listings')
    .delete()
    .in('id', idsToDelete);

  if (deleteError) {
    console.error('❌ Error deleting properties:', deleteError);
    process.exit(1);
  }

  console.log(`✅ Successfully deleted ${propertiesToDelete.length} properties with < 3 bed or < 3 bath\n`);

  // Show new total
  const { count } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total properties remaining: ${count}`);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
