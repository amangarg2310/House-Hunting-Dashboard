/**
 * Identify likely multi-story properties using heuristics
 * Since we can't verify actual story count via API, we use indicators:
 * - High bedroom count (5+)
 * - Large square footage relative to lot size
 * - Property types that are commonly multi-story
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
  console.log('🔍 Identifying likely multi-story properties using heuristics...\n');

  // Fetch all properties
  const { data: properties, error } = await supabase
    .from('listings')
    .select('*')
    .order('bedrooms', { ascending: false });

  if (error) {
    console.error('❌ Error fetching properties:', error);
    process.exit(1);
  }

  console.log(`Total properties in database: ${properties.length}\n`);

  const likelyMultiStory = [];
  const suspicious = [];

  // Known multi-story properties from user's examples
  const knownMultiStory = [
    '14282332', // 79 Pheasant Dr SE Marietta
    '83376228', // 5488 Price Rd Gainesville
    '98007389'  // 4610 Evandale Way Cumming
  ];

  properties.forEach(prop => {
    // Extract ZPID from URL
    const zpidMatch = prop.url?.match(/\/(\d+)_zpid/);
    const zpid = zpidMatch ? zpidMatch[1] : null;

    // Check if it's a known multi-story property
    if (zpid && knownMultiStory.includes(zpid)) {
      likelyMultiStory.push({
        ...prop,
        reason: 'Known multi-story (user provided)'
      });
      return;
    }

    // Heuristic 1: Very high bedroom count (6+ bedrooms is almost always multi-story)
    if (prop.bedrooms >= 6) {
      likelyMultiStory.push({
        ...prop,
        reason: `${prop.bedrooms} bedrooms (6+ is typically multi-story)`
      });
      return;
    }

    // Heuristic 2: High bedroom count (5 bedrooms is often multi-story)
    if (prop.bedrooms === 5) {
      suspicious.push({
        ...prop,
        reason: '5 bedrooms (often multi-story, review manually)'
      });
      return;
    }

    // Heuristic 3: Very large square footage (4000+ sqft is often multi-story for single-family)
    if (prop.property_type === 'ranch' && prop.square_feet && prop.square_feet >= 4000) {
      suspicious.push({
        ...prop,
        reason: `${prop.square_feet} sqft (large homes often multi-story)`
      });
      return;
    }

    // Heuristic 4: High bed + bath combination (5+ total is suspicious)
    const totalRooms = (prop.bedrooms || 0) + (prop.bathrooms || 0);
    if (totalRooms >= 8 && prop.bedrooms >= 4) {
      suspicious.push({
        ...prop,
        reason: `${prop.bedrooms} bed + ${prop.bathrooms} bath (high room count)`
      });
    }
  });

  // Summary
  console.log('='.repeat(70));
  console.log('📊 ANALYSIS RESULTS');
  console.log('='.repeat(70));
  console.log(`Total properties: ${properties.length}`);
  console.log(`Likely multi-story (high confidence): ${likelyMultiStory.length}`);
  console.log(`Suspicious (medium confidence): ${suspicious.length}`);
  console.log('='.repeat(70) + '\n');

  // Show likely multi-story properties
  if (likelyMultiStory.length > 0) {
    console.log(`\n🔴 LIKELY MULTI-STORY PROPERTIES (${likelyMultiStory.length}):\n`);
    console.log('High confidence these are multi-story:\n');

    likelyMultiStory.forEach(p => {
      console.log(`  - ${p.address}`);
      console.log(`    ${p.bedrooms} bed, ${p.bathrooms} bath, ${p.square_feet || 'unknown'} sqft`);
      console.log(`    Reason: ${p.reason}`);
      console.log(`    URL: ${p.url}`);
      console.log('');
    });

    // Generate SQL for likely multi-story
    console.log('\n📋 SQL TO DELETE LIKELY MULTI-STORY PROPERTIES:\n');
    console.log('-- HIGH CONFIDENCE - These are very likely multi-story');
    console.log('-- Copy and paste this into Supabase SQL Editor\n');

    const ids = likelyMultiStory.map(p => `'${p.id}'`).join(',\n  ');
    console.log(`DELETE FROM listings WHERE id IN (\n  ${ids}\n);\n`);
    console.log(`-- This will delete ${likelyMultiStory.length} properties\n`);
  }

  // Show suspicious properties
  if (suspicious.length > 0) {
    console.log(`\n🟡 SUSPICIOUS PROPERTIES (${suspicious.length}):\n`);
    console.log('Medium confidence - recommend manual review:\n');

    // Show first 20
    suspicious.slice(0, 20).forEach(p => {
      console.log(`  - ${p.address}`);
      console.log(`    ${p.bedrooms} bed, ${p.bathrooms} bath, ${p.square_feet || 'unknown'} sqft`);
      console.log(`    Reason: ${p.reason}`);
      console.log(`    URL: ${p.url}`);
      console.log('');
    });

    if (suspicious.length > 20) {
      console.log(`\n  ... and ${suspicious.length - 20} more suspicious properties`);
    }

    // Generate SQL for suspicious properties (commented out)
    console.log('\n📋 SQL TO DELETE SUSPICIOUS PROPERTIES (review first!):\n');
    console.log('-- MEDIUM CONFIDENCE - Review these URLs before deleting');
    console.log('-- Uncomment the line below if you want to delete all suspicious properties\n');

    const suspiciousIds = suspicious.map(p => `'${p.id}'`).join(',\n  ');
    console.log(`-- DELETE FROM listings WHERE id IN (\n--   ${suspiciousIds}\n-- );\n`);
    console.log(`-- This would delete ${suspicious.length} additional properties\n`);
  }

  // Conservative recommendation
  console.log('\n💡 RECOMMENDATION:\n');
  console.log('1. First, run the SQL for "likely multi-story" properties (high confidence)');
  console.log('2. For suspicious properties, manually check a few URLs to verify');
  console.log('3. If most suspicious properties are indeed multi-story, run that SQL too');
  console.log('4. Alternatively, wait for the next automated fetch (runs daily) which will');
  console.log('   gradually replace old data with properly filtered properties\n');

  console.log('✅ Analysis complete!');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
