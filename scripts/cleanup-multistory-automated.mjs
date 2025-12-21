/**
 * Automated cleanup script: Fetch descriptions for existing properties
 * and delete multi-story homes using bidirectional keyword filtering
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const HASDATA_API_KEY = process.env.VITE_HASDATA_API_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !HASDATA_API_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fetch description from Zillow property API
async function fetchPropertyDescription(propertyUrl) {
  const url = `https://api.hasdata.com/scrape/zillow/property?url=${encodeURIComponent(propertyUrl)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': HASDATA_API_KEY
      }
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.property?.description || null;
  } catch (error) {
    return null;
  }
}

// Apply bidirectional keyword filtering
function shouldDeleteProperty(listing, description) {
  const homeType = (listing.property_type || '').toUpperCase();

  // Multi-story keywords
  const multiStoryKeywords = [
    'two story', '2 story', 'two-story', '2-story',
    'three story', '3 story', 'multi story', 'multi-story',
    'upstairs', 'second floor', 'third floor',
    'upper level', 'lower level', 'split level'
  ];

  // Single-story keywords
  const singleStoryKeywords = [
    'ranch', 'single-level', 'single level',
    'one-story', 'one story', 'single-story', 'single story',
    'one level', 'main floor living', 'no stairs',
    'main level living', 'all on one level', 'one-level'
  ];

  // Elevator keywords
  const elevatorKeywords = ['elevator', 'lift'];

  if (!description) {
    // No description - conservative filtering
    // Keep condos/apartments (typically single-floor)
    if (homeType.includes('CONDO') || homeType === 'CONDO') {
      return false; // Keep
    }
    // For others without description, we can't definitively say - keep for now
    return false;
  }

  const desc = description.toLowerCase();
  const hasMultiStoryKeyword = multiStoryKeywords.some(keyword => desc.includes(keyword));
  const hasSingleStoryKeyword = singleStoryKeywords.some(keyword => desc.includes(keyword));
  const hasElevatorKeyword = elevatorKeywords.some(keyword => desc.includes(keyword));

  // DELETE if multi-story keywords present WITHOUT single-story keywords
  if (hasMultiStoryKeyword && !hasSingleStoryKeyword) {
    return true; // Delete - definitely multi-story
  }

  // DELETE townhouses without elevator
  if (homeType.includes('TOWNHOUSE')) {
    if (!hasElevatorKeyword) {
      return true; // Delete - townhouse without elevator
    }
  }

  // DELETE if ambiguous (no clear indicators) for non-condo types
  if (homeType !== 'CONDO') {
    if (!hasSingleStoryKeyword && !hasMultiStoryKeyword) {
      // Ambiguous - be conservative and delete
      return true;
    }
  }

  return false; // Keep
}

async function main() {
  console.log('🧹 Automated Multi-Story Property Cleanup');
  console.log('='.repeat(60));

  // Get all properties
  const { data: allProperties, error: fetchError } = await supabase
    .from('listings')
    .select('id, address, url, property_type, description');

  if (fetchError) {
    console.error('❌ Error fetching properties:', fetchError);
    process.exit(1);
  }

  console.log(`\n📊 Total properties in database: ${allProperties.length}\n`);

  const propertiesToDelete = [];
  let processedCount = 0;
  let descriptionsFetched = 0;

  console.log('🔍 Analyzing properties...\n');

  for (const listing of allProperties) {
    processedCount++;

    // Show progress every 50 properties
    if (processedCount % 50 === 0) {
      console.log(`   Progress: ${processedCount}/${allProperties.length} properties analyzed...`);
    }

    let description = listing.description;

    // If no description, try to fetch it
    if (!description && listing.url) {
      description = await fetchPropertyDescription(listing.url);
      if (description) {
        descriptionsFetched++;
      }

      // Rate limit: 500ms between API calls
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Apply filtering logic
    if (shouldDeleteProperty(listing, description)) {
      propertiesToDelete.push({
        ...listing,
        description,
        reason: description ? 'Multi-story keywords in description' : 'Ambiguous without description'
      });
    }
  }

  console.log(`\n✅ Analysis complete!`);
  console.log(`   Descriptions fetched: ${descriptionsFetched}`);
  console.log(`   Properties to delete: ${propertiesToDelete.length}\n`);

  if (propertiesToDelete.length === 0) {
    console.log('✅ No multi-story properties to delete!');
    return;
  }

  // Show sample of properties to be deleted
  console.log('Sample of properties to be deleted:');
  propertiesToDelete.slice(0, 10).forEach(prop => {
    console.log(`  - ${prop.address}`);
    console.log(`    Type: ${prop.property_type}, Reason: ${prop.reason}`);
    if (prop.description) {
      const multiStoryKeywords = ['two story', '2 story', 'upstairs', 'second floor', 'upper level'];
      const found = multiStoryKeywords.filter(keyword => prop.description.toLowerCase().includes(keyword));
      if (found.length > 0) {
        console.log(`    Keywords found: ${found.join(', ')}`);
      }
    }
  });

  if (propertiesToDelete.length > 10) {
    console.log(`  ... and ${propertiesToDelete.length - 10} more\n`);
  } else {
    console.log('');
  }

  // Delete the properties
  const idsToDelete = propertiesToDelete.map(p => p.id);

  console.log(`🗑️  Deleting ${propertiesToDelete.length} multi-story properties...`);

  const { error: deleteError } = await supabase
    .from('listings')
    .delete()
    .in('id', idsToDelete);

  if (deleteError) {
    console.error('❌ Error deleting properties:', deleteError);
    process.exit(1);
  }

  console.log(`✅ Successfully deleted ${propertiesToDelete.length} multi-story properties!\n`);

  // Show new total
  const { count } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total properties remaining: ${count}`);
  console.log('='.repeat(60));
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
