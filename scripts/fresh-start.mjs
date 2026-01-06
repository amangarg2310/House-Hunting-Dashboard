#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🧹 FRESH START - Clearing all old data...\n');

// Step 1: Delete all grades first (foreign key constraint)
console.log('Step 1: Deleting all grades...');
const { data: allGrades } = await supabase.from('grades').select('listing_id');
if (allGrades && allGrades.length > 0) {
  console.log(`Found ${allGrades.length} grades to delete`);
  for (const grade of allGrades) {
    await supabase.from('grades').delete().eq('listing_id', grade.listing_id);
  }
}

const { count: gradeCount } = await supabase
  .from('grades')
  .select('*', { count: 'exact', head: true });
console.log(`Remaining grades: ${gradeCount}`);

// Step 2: Delete all listings
console.log('\nStep 2: Deleting all listings...');
const { data: allListings } = await supabase.from('listings').select('id');
console.log(`Found ${allListings?.length || 0} listings to delete`);

if (allListings && allListings.length > 0) {
  for (const listing of allListings) {
    await supabase.from('listings').delete().eq('id', listing.id);
  }
}

// Verify deletion
const { count } = await supabase
  .from('listings')
  .select('*', { count: 'exact', head: true });

console.log(`\n✅ Database cleared!`);
console.log(`   - Remaining listings: ${count}`);
console.log(`   - Remaining grades: ${gradeCount}`);
console.log('\nNow run: node scripts/fetchListings-enhanced.mjs');
