/**
 * Generate SQL to delete ALL properties from the database
 * Run this AFTER exporting grades
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
  console.log('🧹 Preparing to clean ALL properties from database...\n');

  // Get current count
  const { count, error } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Error querying database:', error);
    process.exit(1);
  }

  console.log(`Current property count: ${count}\n`);

  // Check for graded properties
  const { data: grades } = await supabase
    .from('grades')
    .select(`
      listing_id,
      grade,
      listings (address)
    `);

  if (grades && grades.length > 0) {
    console.log(`⚠️  WARNING: ${grades.length} properties have grades!\n`);
    console.log('Make sure you ran export-grades.mjs first to back them up.\n');
    console.log('Graded properties:');
    grades.forEach(g => {
      console.log(`  - ${g.listings?.address} (Grade: ${g.grade})`);
    });
    console.log('');
  }

  console.log('📋 SQL TO DELETE ALL PROPERTIES:\n');
  console.log('-- ⚠️  WARNING: This deletes EVERYTHING from the listings table');
  console.log('-- Make sure you exported grades first!');
  console.log('-- Copy and paste this into Supabase SQL Editor\n');
  console.log('TRUNCATE TABLE listings RESTART IDENTITY CASCADE;\n');
  console.log(`-- This will delete all ${count} properties\n`);

  console.log('💡 After running this SQL:');
  console.log('   1. Run: npm run fetch-enhanced');
  console.log('   2. Wait ~30-40 minutes for fetch to complete');
  console.log('   3. Run: node scripts/restore-grades.mjs');
  console.log('');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
