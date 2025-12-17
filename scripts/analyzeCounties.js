import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

console.log('🗺️  Analyzing Counties Coverage...\n');

// Fetch all listings
const { data: listings, error } = await supabase.from('listings').select('*');

if (error) {
  console.error('Error fetching listings:', error);
  process.exit(1);
}

// Get all unique counties
const counties = {};
listings.forEach(l => {
  const county = l.county || 'Unknown';
  counties[county] = (counties[county] || 0) + 1;
});

console.log('📊 All Counties in Database:');
const sortedCounties = Object.entries(counties).sort((a, b) => b[1] - a[1]);
sortedCounties.forEach(([county, count]) => {
  console.log(`  ${county}: ${count} properties`);
});

// Currently configured counties in FilterSidebar
const configuredCounties = [
  'Fulton',
  'DeKalb',
  'Gwinnett',
  'Cobb',
  'Cherokee',
  'Forsyth',
  'North Fulton',
  'East Cobb',
  'Johns Creek'
];

console.log('\n🎯 Currently Configured Counties:');
console.log('  ' + configuredCounties.join(', '));

// Find counties NOT in the configured list
const missingCounties = sortedCounties.filter(([county]) => !configuredCounties.includes(county));

if (missingCounties.length > 0) {
  console.log('\n❌ Counties NOT in Filter (Missing Properties):');
  missingCounties.forEach(([county, count]) => {
    console.log(`  ${county}: ${count} properties`);
  });

  const missingTotal = missingCounties.reduce((sum, [, count]) => sum + count, 0);
  console.log(`\n  Total missing: ${missingTotal} properties (${((missingTotal/listings.length)*100).toFixed(1)}%)`);
}

// Check cities for the missing properties
console.log('\n🏙️  Sample Cities/Addresses from Uncaptured Properties:');
const uncapturedListings = listings.filter(l => !configuredCounties.includes(l.county));
const citySample = uncapturedListings.slice(0, 15);
citySample.forEach(l => {
  console.log(`  - ${l.address} (${l.county} County)`);
});

console.log(`\n📈 Coverage Summary:`);
console.log(`  Configured counties: ${configuredCounties.length}`);
console.log(`  Total unique counties in DB: ${sortedCounties.length}`);
console.log(`  Properties captured: ${listings.length - missingCounties.reduce((sum, [, count]) => sum + count, 0)} (${(((listings.length - missingCounties.reduce((sum, [, count]) => sum + count, 0))/listings.length)*100).toFixed(1)}%)`);
console.log(`  Properties missed: ${missingCounties.reduce((sum, [, count]) => sum + count, 0)} (${((missingCounties.reduce((sum, [, count]) => sum + count, 0)/listings.length)*100).toFixed(1)}%)`);
