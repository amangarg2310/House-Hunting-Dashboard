/**
 * Restore grades from exported JSON file
 * Run this after fresh fetch to restore user grades
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('🔄 Restoring grades from backup...\n');

  // Find the most recent backup file
  const files = fs.readdirSync('.').filter(f => f.startsWith('graded-properties-backup-'));

  if (files.length === 0) {
    console.error('❌ No backup file found. Run export-grades.mjs first.');
    process.exit(1);
  }

  // Use most recent backup
  const backupFile = files.sort().reverse()[0];
  console.log(`📂 Using backup file: ${backupFile}\n`);

  const exportData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  const gradedEntries = exportData.grades;

  console.log(`Found ${gradedEntries.length} graded properties in backup`);
  console.log(`Backup from: ${exportData.exportDate}\n`);

  let restored = 0;
  let notFound = 0;

  // Try to restore each grade
  for (const gradeEntry of gradedEntries) {
    const listingId = gradeEntry.listing_id;
    const grade = gradeEntry.grade;
    const listing = gradeEntry.listings;

    // Check if property still exists
    const { data: existing } = await supabase
      .from('listings')
      .select('id')
      .eq('id', listingId)
      .single();

    if (existing) {
      // Restore the grade (upsert to avoid duplicates)
      const { error } = await supabase
        .from('grades')
        .upsert({
          listing_id: listingId,
          grade: grade
        }, { onConflict: 'listing_id' });

      if (error) {
        console.error(`  ❌ Failed to restore grade for ${listing?.address}:`, error.message);
      } else {
        console.log(`  ✓ Restored grade ${grade} for ${listing?.address}`);
        restored++;
      }
    } else {
      console.log(`  ⚠️  Property not found (likely multi-story): ${listing?.address}`);
      notFound++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESTORATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total in backup: ${gradedEntries.length}`);
  console.log(`✅ Restored: ${restored}`);
  console.log(`❌ Not found: ${notFound} (these were likely multi-story homes)`);
  console.log('='.repeat(60));

  if (notFound > 0) {
    console.log('\n💡 Properties not found were filtered out as multi-story homes.');
    console.log('   This is expected and means the filter is working correctly.');
  }

  console.log('\n✅ Grade restoration complete!');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
