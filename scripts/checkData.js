/**
 * Check Data Script
 * Diagnose data values in Supabase
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

async function checkData() {
  console.log('🔍 Checking data in database...\n');

  // Get total count
  const { count: totalCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true });
  console.log(`📊 Total listings: ${totalCount}\n`);

  // Sample a few listings to see actual data
  const { data: samples, error } = await supabase
    .from('listings')
    .select('id, address, has_backyard, has_pool, property_type')
    .limit(10);

  if (error) {
    console.error('❌ Error fetching samples:', error);
    process.exit(1);
  }

  console.log('📋 Sample listings (first 10):');
  console.table(samples);

  // Count by has_backyard
  const { data: backyardTrue } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('has_backyard', true);

  const { data: backyardFalse } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('has_backyard', false);

  const { data: backyardNull } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .is('has_backyard', null);

  // Count by has_pool
  const { data: poolTrue } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('has_pool', true);

  const { data: poolFalse } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('has_pool', false);

  const { data: poolNull } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .is('has_pool', null);

  console.log('\n📊 Backyard distribution:');
  console.log(`  True: ${backyardTrue?.length || 0}`);
  console.log(`  False: ${backyardFalse?.length || 0}`);
  console.log(`  Null: ${backyardNull?.length || 0}`);

  console.log('\n📊 Pool distribution:');
  console.log(`  True: ${poolTrue?.length || 0}`);
  console.log(`  False: ${poolFalse?.length || 0}`);
  console.log(`  Null: ${poolNull?.length || 0}`);

  // Get actual counts using count
  const { count: backyardTrueCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('has_backyard', true);

  const { count: backyardFalseCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('has_backyard', false);

  const { count: poolTrueCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('has_pool', true);

  const { count: poolFalseCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('has_pool', false);

  console.log('\n📊 Backyard counts (using count):');
  console.log(`  True: ${backyardTrueCount || 0}`);
  console.log(`  False: ${backyardFalseCount || 0}`);

  console.log('\n📊 Pool counts (using count):');
  console.log(`  True: ${poolTrueCount || 0}`);
  console.log(`  False: ${poolFalseCount || 0}`);
}

checkData();
