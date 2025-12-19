/**
 * Script to identify potentially multi-story properties in the database
 * These need to be manually reviewed and removed
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
  console.log('🔍 Finding potentially multi-story properties...\n');

  // Fetch all properties
  const { data: properties, error } = await supabase
    .from('listings')
    .select('id, address, url, bedrooms, bathrooms, property_type, is_single_floor')
    .order('address');

  if (error) {
    console.error('❌ Error fetching properties:', error);
    process.exit(1);
  }

  console.log(`Total properties in database: ${properties.length}\n`);

  // The three known multi-story properties
  const knownMultiStory = [
    'https://www.zillow.com/homedetails/79-Pheasant-Dr-SE-Marietta-GA-30067/14282332_zpid/',
    'https://www.zillow.com/homedetails/5488-Price-Rd-Gainesville-GA-30506/83376228_zpid/',
    'https://www.zillow.com/homedetails/4610-Evandale-Way-Cumming-GA-30040/98007389_zpid/'
  ];

  const multiStoryProperties = properties.filter(p => knownMultiStory.includes(p.url));

  console.log(`Found ${multiStoryProperties.length} known multi-story properties:\n`);

  multiStoryProperties.forEach(p => {
    console.log(`  - ${p.address}`);
    console.log(`    URL: ${p.url}`);
    console.log(`    Type: ${p.property_type}, Single Floor: ${p.is_single_floor}`);
    console.log(`    Beds/Baths: ${p.bedrooms}/${p.bathrooms}`);
    console.log('');
  });

  // Generate SQL to delete them
  if (multiStoryProperties.length > 0) {
    console.log('\n📋 SQL to delete these properties:\n');
    console.log('-- Copy and paste this into Supabase SQL Editor\n');

    const ids = multiStoryProperties.map(p => `'${p.id}'`).join(', ');
    console.log(`DELETE FROM listings WHERE id IN (${ids});\n`);

    console.log(`-- This will delete ${multiStoryProperties.length} multi-story properties\n`);
  }

  // Also show properties with high bedroom count (potential multi-story indicators)
  const highBedroomProps = properties.filter(p =>
    p.bedrooms >= 5 &&
    !knownMultiStory.includes(p.url)
  );

  if (highBedroomProps.length > 0) {
    console.log(`\n⚠️  Found ${highBedroomProps.length} properties with 5+ bedrooms (may be multi-story):\n`);
    console.log('These should be manually reviewed:\n');

    highBedroomProps.slice(0, 10).forEach(p => {
      console.log(`  - ${p.address} (${p.bedrooms} bed, ${p.bathrooms} bath)`);
      console.log(`    ${p.url}`);
    });

    if (highBedroomProps.length > 10) {
      console.log(`\n  ... and ${highBedroomProps.length - 10} more`);
    }
  }

  console.log('\n✅ Scan complete!');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
