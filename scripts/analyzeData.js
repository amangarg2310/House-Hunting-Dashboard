/**
 * Analyze fetched data to understand property type distribution
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function analyzeData() {
  console.log('📊 Analyzing property data distribution...\n');

  // Get all listings
  const { data: all, error } = await supabase
    .from('listings')
    .select('property_type, has_backyard, has_pool, lot_size');

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  // Count by property type
  const typeCounts = {};
  const backyardByType = {};
  const poolByType = {};
  const lotSizes = [];

  all.forEach(listing => {
    const type = listing.property_type;
    typeCounts[type] = (typeCounts[type] || 0) + 1;

    if (listing.has_backyard) {
      backyardByType[type] = (backyardByType[type] || 0) + 1;
    }

    if (listing.has_pool) {
      poolByType[type] = (poolByType[type] || 0) + 1;
    }

    if (listing.lot_size > 0) {
      lotSizes.push({ type, size: listing.lot_size });
    }
  });

  console.log('📋 Property Type Distribution:');
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  console.log('\n🏡 Backyard by Type:');
  Object.entries(backyardByType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  console.log('\n🏊 Pool by Type:');
  Object.entries(poolByType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  // Analyze lot sizes
  const nonCondoWithLots = lotSizes.filter(l => l.type !== 'condo' && l.size > 0);
  console.log(`\n📏 Non-condo properties with lot size data: ${nonCondoWithLots.length}`);
  if (nonCondoWithLots.length > 0) {
    console.log('   Sample lot sizes:');
    nonCondoWithLots.slice(0, 10).forEach(l => {
      console.log(`     ${l.type}: ${l.size} sq ft (${l.size > 3000 ? 'BACKYARD' : 'no backyard'})`);
    });
  }
}

analyzeData();
