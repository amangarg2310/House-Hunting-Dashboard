/**
 * Test the new bidirectional keyword filtering logic
 * Specifically test property 456313296 that was getting through
 */

// Test property data from the Zillow property API
const testProperty = {
  id: '456313296',
  address: {
    street: '306 Vinings Walk',
    city: 'Gainesville',
    state: 'GA',
    zipcode: '30501'
  },
  price: 975000,
  beds: 5,
  baths: 4,
  homeType: 'SINGLE_FAMILY',
  description: "Back on the market at no fault of sellers!  Fall in love with this 4-side brick home on a full unfinished basement, tucked inside one of Gainesville's most desirable small executive neighborhoods - just minutes from downtown! From the moment you step into the vaulted two-story foyer, you'll be welcomed by rich hardwoods and timeless trim details. Just off the foyer, a beautiful home office makes working from home effortless, while a formal dining room sets the stage for gatherings and celebrations. The chef's kitchen with granite counters and custom cabinetry flows seamlessly into the living spaces. A main-level laundry room adds everyday convenience. Retreat to the oversized owner's suite on the main level, where you'll find a spa-inspired ensuite with a tile-surround shower, soaking tub, and dual vanities-your private escape at the end of the day. Upstairs, 4 generous secondary bedrooms with ensuite baths provide space for everyone. The full unfinished basement offers endless opportunities to expand-movie room, gym, or custom in law suite-the choice is yours. Outdoor living is unmatched with two screened-in porches! Enjoy Newer roof, unbeatable location, and true luxury living in the heart of Gainesville. Walk to the Downtown Square for dining, shopping, and community events, with easy access to Lake Lanier, Olympic Park, the University of North Georgia, I-985 and the hospital just 5 minutes away, this home blends luxury, lifestyle, and convenience like no other."
};

function testFiltering(prop) {
  console.log('\n📋 Testing Property:');
  console.log(`   ID: ${prop.id}`);
  console.log(`   Address: ${prop.address.street}, ${prop.address.city}, ${prop.address.state}`);
  console.log(`   Beds: ${prop.beds}, Baths: ${prop.baths}`);
  console.log(`   HomeType: ${prop.homeType}`);
  console.log(`   Price: $${prop.price.toLocaleString()}`);
  console.log('\n');

  // CRITICAL: Filter out properties with < 3 bedrooms or < 3 bathrooms
  const bedrooms = prop.beds || 0;
  const bathrooms = prop.baths || 0;

  console.log('Step 1: Bed/Bath Filter');
  if (bedrooms < 3 || bathrooms < 3) {
    console.log('   ❌ REJECTED: < 3 bed or < 3 bath\n');
    return false;
  }
  console.log(`   ✅ PASSED: ${bedrooms} bed, ${bathrooms} bath\n`);

  // CRITICAL: Bidirectional keyword filtering using description
  const description = (prop.description || '').toLowerCase();
  const homeType = (prop.homeType || '').toUpperCase();

  // Multi-story keywords that indicate the property is NOT single-story
  const multiStoryKeywords = [
    'two story', '2 story', 'two-story', '2-story',
    'three story', '3 story', 'multi story', 'multi-story',
    'upstairs', 'second floor', 'third floor',
    'upper level', 'lower level', 'split level'
  ];

  // Single-story keywords that indicate the property IS single-story
  const singleStoryKeywords = [
    'ranch', 'single-level', 'single level',
    'one-story', 'one story', 'single-story', 'single story',
    'one level', 'main floor living', 'no stairs',
    'main level living', 'all on one level', 'one-level'
  ];

  // Elevator keywords for townhouses
  const elevatorKeywords = ['elevator', 'lift'];

  console.log('Step 2: Description-Based Multi-Story Filter');

  if (description) {
    const hasMultiStoryKeyword = multiStoryKeywords.some(keyword => description.includes(keyword));
    const hasSingleStoryKeyword = singleStoryKeywords.some(keyword => description.includes(keyword));
    const hasElevatorKeyword = elevatorKeywords.some(keyword => description.includes(keyword));

    console.log(`   Description length: ${prop.description.length} characters`);
    console.log(`   Has multi-story keywords: ${hasMultiStoryKeyword}`);
    if (hasMultiStoryKeyword) {
      const found = multiStoryKeywords.filter(keyword => description.includes(keyword));
      console.log(`     Found: ${found.join(', ')}`);
    }
    console.log(`   Has single-story keywords: ${hasSingleStoryKeyword}`);
    if (hasSingleStoryKeyword) {
      const found = singleStoryKeywords.filter(keyword => description.includes(keyword));
      console.log(`     Found: ${found.join(', ')}`);
    }

    // Reject if multi-story keywords present WITHOUT single-story keywords
    if (hasMultiStoryKeyword && !hasSingleStoryKeyword) {
      console.log('\n   ❌ REJECTED: Multi-story keywords WITHOUT single-story keywords\n');
      return false;
    }

    // Special handling for townhouses: require elevator mention
    if (homeType.includes('TOWNHOUSE') || homeType.includes('TOWNHOME')) {
      if (!hasElevatorKeyword) {
        console.log('\n   ❌ REJECTED: Townhouse without elevator\n');
        return false;
      }
    }

    // Reject if no positive single-story indicators for non-condo/apartment types
    if (!homeType.includes('CONDO') && !homeType.includes('APARTMENT')) {
      if (!hasSingleStoryKeyword && !hasMultiStoryKeyword) {
        console.log('\n   ❌ REJECTED: No clear single-story or multi-story indicators (ambiguous)\n');
        return false;
      }
    }

    console.log('   ✅ PASSED description-based filtering\n');
  } else {
    console.log('   ⚠️  No description available - using conservative API-only filtering\n');
  }

  console.log('✅ PROPERTY WOULD BE ACCEPTED (should not happen for this property!)\n');
  return true;
}

// Run the test
const result = testFiltering(testProperty);
console.log('\n' + '='.repeat(60));
console.log(`Final Result: ${result ? '✅ ACCEPTED' : '❌ REJECTED'}`);
console.log('='.repeat(60));

if (!result) {
  console.log('\n✅ SUCCESS: The new filtering correctly rejects this multi-story property!');
} else {
  console.log('\n❌ FAILURE: The filtering is not working correctly!');
}
