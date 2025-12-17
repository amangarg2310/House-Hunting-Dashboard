import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Adding days_on_market column to listings table...');
console.log('');
console.log('Please run this SQL in Supabase SQL Editor:');
console.log('═'.repeat(80));
console.log('ALTER TABLE listings ADD COLUMN IF NOT EXISTS days_on_market INTEGER DEFAULT 0;');
console.log('═'.repeat(80));
console.log('');
console.log('After running the SQL, verifying column exists...');

// Try to select the column to verify it exists
const { data, error } = await supabase
  .from('listings')
  .select('days_on_market')
  .limit(1);

if (error) {
  if (error.message.includes('column "days_on_market" does not exist')) {
    console.log('❌ Column does not exist yet. Please run the SQL command above.');
    process.exit(1);
  } else {
    console.log('⚠️  Could not verify column:', error.message);
    console.log('   If you ran the SQL command, the column should exist.');
  }
} else {
  console.log('✅ Column days_on_market exists!');
}
