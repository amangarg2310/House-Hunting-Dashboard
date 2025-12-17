import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

console.log('🔍 Analyzing Listings Data...\n');

// Fetch all listings
const { data: listings, error } = await supabase.from('listings').select('*');

if (error) {
  console.error('Error fetching listings:', error);
  process.exit(1);
}

console.log(`📊 Total Listings in Database: ${listings.length}\n`);

// Analyze property types
const propertyTypes = {};
listings.forEach(l => {
  propertyTypes[l.property_type] = (propertyTypes[l.property_type] || 0) + 1;
});

console.log('🏠 Property Type Distribution:');
Object.entries(propertyTypes).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});
console.log();

// Analyze Ranch properties in $1.1M-$2M range
const ranchProperties = listings.filter(l =>
  l.property_type === 'ranch' &&
  l.estimated_price >= 1100000 &&
  l.estimated_price <= 2000000
);

console.log(`🎯 Ranch Properties ($1.1M-$2M): ${ranchProperties.length}`);

// Days on market distribution for ranch properties
const daysDistribution = {
  '0-30': 0,
  '31-60': 0,
  '61-90': 0,
  '91-180': 0,
  '181+': 0,
  'undefined': 0
};

ranchProperties.forEach(l => {
  const days = l.days_on_market;
  if (days === undefined || days === null) {
    daysDistribution['undefined']++;
  } else if (days <= 30) {
    daysDistribution['0-30']++;
  } else if (days <= 60) {
    daysDistribution['31-60']++;
  } else if (days <= 90) {
    daysDistribution['61-90']++;
  } else if (days <= 180) {
    daysDistribution['91-180']++;
  } else {
    daysDistribution['181+']++;
  }
});

console.log('\n📅 Days on Market Distribution (Ranch $1.1M-$2M):');
Object.entries(daysDistribution).forEach(([range, count]) => {
  console.log(`  ${range} days: ${count}`);
});

// HOA fee analysis
const hoaFees = {};
listings.forEach(l => {
  const fee = l.hoa_fee || 'none';
  hoaFees[fee] = (hoaFees[fee] || 0) + 1;
});

console.log('\n💰 HOA Fee Distribution (All Properties):');
const sortedHOA = Object.entries(hoaFees).sort((a, b) => b[1] - a[1]);
sortedHOA.slice(0, 10).forEach(([fee, count]) => {
  console.log(`  $${fee}/mo: ${count} properties`);
});

// Check if there are listings with days_on_market > 90
const over90Days = listings.filter(l => l.days_on_market > 90);
console.log(`\n⏰ Properties with 90+ Days on Market: ${over90Days.length}`);

// Ranch properties with 90+ days
const ranchOver90 = ranchProperties.filter(l => l.days_on_market > 90);
console.log(`   - Ranch ($1.1M-$2M) with 90+ days: ${ranchOver90.length}`);

// Sample of ranch properties for inspection
console.log('\n📋 Sample Ranch Properties ($1.1M-$2M):');
ranchProperties.slice(0, 5).forEach(l => {
  console.log(`  - ${l.address || 'Unknown'}`);
  console.log(`    Price: $${l.estimated_price?.toLocaleString()}`);
  console.log(`    Days on Market: ${l.days_on_market ?? 'N/A'}`);
  console.log(`    HOA: $${l.hoa_fee ?? 'N/A'}/mo`);
  console.log();
});
