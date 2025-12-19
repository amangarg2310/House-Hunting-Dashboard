/**
 * Export all graded properties to a JSON file
 * This preserves user grades before cleaning the database
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
  console.log('📦 Exporting graded properties...\n');

  // Fetch all grades with their associated listing info
  const { data: grades, error } = await supabase
    .from('grades')
    .select(`
      listing_id,
      grade,
      graded_at,
      listings (*)
    `);

  if (error) {
    console.error('❌ Error fetching grades:', error);
    process.exit(1);
  }

  if (!grades || grades.length === 0) {
    console.log('ℹ️  No graded properties found. Nothing to export.');
    return;
  }

  console.log(`Found ${grades.length} graded properties\n`);

  // Show summary
  const gradeBreakdown = {};
  grades.forEach(g => {
    gradeBreakdown[g.grade] = (gradeBreakdown[g.grade] || 0) + 1;
  });

  console.log('Grade breakdown:');
  Object.entries(gradeBreakdown).forEach(([grade, count]) => {
    console.log(`  ${grade}: ${count} properties`);
  });

  // Export to JSON
  const exportData = {
    exportDate: new Date().toISOString(),
    totalGraded: grades.length,
    gradeBreakdown,
    grades: grades
  };

  const filename = `graded-properties-backup-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));

  console.log(`\n✅ Exported to ${filename}`);
  console.log(`\n💡 This file will be used to restore grades after the fresh fetch`);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
