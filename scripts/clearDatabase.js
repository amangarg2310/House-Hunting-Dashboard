/**
 * Clear Database Script
 * Deletes all listings from Supabase
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

async function clearDatabase() {
  console.log('🗑️  Clearing all listings from database...');

  let deleted = 0;
  let hasMore = true;

  while (hasMore) {
    // Fetch a batch of IDs
    const { data: batch, error: fetchError } = await supabase
      .from('listings')
      .select('id')
      .limit(1000);

    if (fetchError) {
      console.error('❌ Error fetching listings:', fetchError);
      process.exit(1);
    }

    if (!batch || batch.length === 0) {
      hasMore = false;
      break;
    }

    // Delete the batch
    const ids = batch.map(r => r.id);
    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .in('id', ids);

    if (deleteError) {
      console.error('❌ Error deleting batch:', deleteError);
      process.exit(1);
    }

    deleted += ids.length;
    console.log(`  Deleted ${deleted} listings...`);
  }

  // Verify deletion
  const { count } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true });

  console.log(`✅ Database cleared. Remaining listings: ${count}`);
}

clearDatabase();
