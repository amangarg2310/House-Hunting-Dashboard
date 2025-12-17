import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('='.repeat(60));
console.log('COMPREHENSIVE DATABASE TEST');
console.log('='.repeat(60));

// 1. Total count
const { count } = await supabase
  .from('listings')
  .select('*', { count: 'exact', head: true });
console.log(`\n1. TOTAL LISTINGS: ${count}`);

// 2. Check "New Today" (last 24 hours)
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const { data: newToday } = await supabase
  .from('listings')
  .select('id, listed_date')
  .gte('listed_date', yesterday.toISOString());
console.log(`\n2. NEW TODAY (last 24h): ${newToday?.length || 0} listings`);

// 3. Property type distribution
const { data: all } = await supabase
  .from('listings')
  .select('property_type, has_backyard, has_pool, url, photo_urls');

const types = {};
let backyardCount = 0;
let poolCount = 0;
let hasUrl = 0;
let hasMultiplePhotos = 0;

all?.forEach(l => {
  types[l.property_type] = (types[l.property_type] || 0) + 1;
  if (l.has_backyard) backyardCount++;
  if (l.has_pool) poolCount++;
  if (l.url) hasUrl++;
  if (l.photo_urls && l.photo_urls.length > 1) hasMultiplePhotos++;
});

console.log(`\n3. PROPERTY TYPES:`);
Object.entries(types).forEach(([type, count]) => {
  console.log(`   ${type}: ${count}`);
});

console.log(`\n4. FILTER DATA:`);
console.log(`   With backyard: ${backyardCount}`);
console.log(`   With pool: ${poolCount}`);
console.log(`   With URL: ${hasUrl}`);
console.log(`   With multiple photos: ${hasMultiplePhotos}`);

// 5. Sample a listing with multiple photos
const { data: multiPhoto } = await supabase
  .from('listings')
  .select('id, address, url, photo_urls')
  .not('photo_urls', 'is', null)
  .limit(1)
  .single();

console.log(`\n5. SAMPLE LISTING WITH PHOTOS:`);
console.log(`   ID: ${multiPhoto?.id}`);
console.log(`   Address: ${multiPhoto?.address}`);
console.log(`   URL: ${multiPhoto?.url || 'MISSING'}`);
console.log(`   Photo count: ${multiPhoto?.photo_urls?.length || 0}`);

console.log('\n' + '='.repeat(60));
