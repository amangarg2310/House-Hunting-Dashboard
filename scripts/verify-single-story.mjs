/**
 * Smart cleanup: Verify existing properties against HasData API
 * Check actual story count and identify multi-story homes for removal
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const HASDATA_API_KEY = process.env.VITE_HASDATA_API_KEY || 'c7c6e86e-619d-4cb8-9c4b-9051bd3ad27d';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Extract ZPID from Zillow URL
 */
function extractZpid(url) {
  const match = url.match(/\/(\d+)_zpid/);
  return match ? match[1] : null;
}

/**
 * Fetch property details from HasData API
 */
async function getPropertyStories(zpid) {
  try {
    // Use the listing endpoint with the URL
    const url = `https://api.hasdata.com/scrape/zillow/listing?zpid=${zpid}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': HASDATA_API_KEY
      }
    });

    if (!response.ok) {
      return { error: `API error (${response.status})` };
    }

    const result = await response.json();

    // Get property from response
    const prop = result.property || (result.properties && result.properties[0]);

    if (!prop) {
      return { error: 'Property not found' };
    }

    return {
      stories: prop.resoFacts?.stories || null,
      homeType: prop.homeType,
      beds: prop.beds,
      baths: prop.baths
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function main() {
  console.log('🔍 Verifying properties against HasData API...\n');
  console.log('This will check the actual story count for each property.\n');

  // Fetch all properties from database
  const { data: properties, error } = await supabase
    .from('listings')
    .select('id, address, url, bedrooms, bathrooms, property_type')
    .order('bedrooms', { ascending: false }); // Start with highest bedroom count (most likely multi-story)

  if (error) {
    console.error('❌ Error fetching properties:', error);
    process.exit(1);
  }

  console.log(`Total properties to verify: ${properties.length}\n`);
  console.log('⚠️  This will make API calls - will process in batches with rate limiting\n');

  const multiStoryProperties = [];
  const singleStoryProperties = [];
  const unknownProperties = [];
  let processed = 0;

  // Process in batches of 10 with rate limiting
  const batchSize = 10;
  const delayBetweenBatches = 2000; // 2 seconds between batches

  for (let i = 0; i < properties.length; i += batchSize) {
    const batch = properties.slice(i, i + batchSize);

    console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(properties.length / batchSize)} (properties ${i + 1}-${Math.min(i + batchSize, properties.length)})...`);

    await Promise.all(batch.map(async (property) => {
      const zpid = extractZpid(property.url);

      if (!zpid) {
        unknownProperties.push({ ...property, reason: 'No ZPID in URL' });
        return;
      }

      const result = await getPropertyStories(zpid);

      if (result.error) {
        unknownProperties.push({ ...property, reason: result.error });
        return;
      }

      if (result.stories === null) {
        unknownProperties.push({ ...property, reason: 'No story data available' });
        return;
      }

      if (result.stories > 1) {
        multiStoryProperties.push({
          ...property,
          stories: result.stories,
          homeType: result.homeType
        });
        console.log(`  ❌ ${property.address} - ${result.stories} stories`);
      } else {
        singleStoryProperties.push({
          ...property,
          stories: result.stories
        });
        console.log(`  ✓ ${property.address} - ${result.stories} story`);
      }

      processed++;
    }));

    // Rate limiting between batches
    if (i + batchSize < properties.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total properties checked: ${properties.length}`);
  console.log(`✓ Single-story properties: ${singleStoryProperties.length}`);
  console.log(`❌ Multi-story properties: ${multiStoryProperties.length}`);
  console.log(`❓ Unknown (no story data): ${unknownProperties.length}`);
  console.log('='.repeat(60) + '\n');

  // Show multi-story properties
  if (multiStoryProperties.length > 0) {
    console.log(`\n🗑️  MULTI-STORY PROPERTIES TO DELETE (${multiStoryProperties.length}):\n`);

    multiStoryProperties.forEach(p => {
      console.log(`  - ${p.address} (${p.stories} stories, ${p.bedrooms} bed, ${p.bathrooms} bath)`);
    });

    // Generate SQL
    console.log('\n📋 SQL TO DELETE MULTI-STORY PROPERTIES:\n');
    console.log('-- Copy and paste this into Supabase SQL Editor\n');

    const ids = multiStoryProperties.map(p => `'${p.id}'`).join(',\n  ');
    console.log(`DELETE FROM listings WHERE id IN (\n  ${ids}\n);\n`);
    console.log(`-- This will delete ${multiStoryProperties.length} multi-story properties\n`);
  }

  // Show properties with unknown story count
  if (unknownProperties.length > 0) {
    console.log(`\n❓ PROPERTIES WITH UNKNOWN STORY COUNT (${unknownProperties.length}):\n`);
    console.log('These might be multi-story but we can\'t verify. Review manually:\n');

    unknownProperties.slice(0, 20).forEach(p => {
      console.log(`  - ${p.address} (${p.bedrooms} bed) - ${p.reason}`);
    });

    if (unknownProperties.length > 20) {
      console.log(`\n  ... and ${unknownProperties.length - 20} more`);
    }

    console.log('\nRecommendation: Properties with 5+ bedrooms and unknown story count');
    console.log('are likely multi-story and should be reviewed manually.\n');
  }

  console.log('\n✅ Verification complete!');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
