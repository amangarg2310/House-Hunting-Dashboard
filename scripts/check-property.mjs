#!/usr/bin/env node

// Test both the Greenview property and the problematic 456313296 property
const testProperties = [
  {
    name: '650 Greenview Ter (Should ACCEPT)',
    url: 'https://www.zillow.com/homedetails/650-Greenview-Ter-Milton-GA-30004/65453256_zpid/'
  },
  {
    name: '306 Vinings Walk (Should REJECT)',
    url: 'https://www.zillow.com/homedetails/306-Vinings-Walk-Gainesville-GA-30501/456313296_zpid/'
  }
];

for (const test of testProperties) {
  console.log('\n'.repeat(2));
  console.log('='.repeat(80));
  console.log(`TESTING: ${test.name}`);
  console.log('='.repeat(80));

const url = `https://api.hasdata.com/scrape/zillow/property?url=${encodeURIComponent(test.url)}`;

const response = await fetch(url, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.HASDATA_API_KEY
  }
});

const result = await response.json();
const prop = result.property;

if (prop) {
  console.log('Property Details:');
  console.log('Address:', prop.address?.street, prop.address?.city, prop.address?.state, prop.address?.zipcode);
  console.log('Price:', prop.price);
  console.log('Bedrooms:', prop.bedrooms);
  console.log('Bathrooms:', prop.bathrooms);
  console.log('Property Type:', prop.propertyType);
  console.log('Living Area:', prop.livingArea, 'sqft');
  console.log('\nFull Description:');
  console.log(prop.description);

  // NEW COMBINED FILTERING LOGIC
  const desc = (prop.description || '').toLowerCase();

  // Option 1: Primary-on-Main indicators (ACCEPT these)
  const primaryOnMainKeywords = [
    'primary on main', 'primary on the main', 'main level primary',
    'master on main', 'master on the main', 'main level master',
    'owner suite on main', 'owner\'s suite on main', 'owner suite on the main',
    'primary-on-main', 'master-on-main',
    'primary bedroom on main', 'master bedroom on main',
    'primary suite on main', 'master suite on main'
  ];
  const hasPrimaryOnMain = primaryOnMainKeywords.some(kw => desc.includes(kw));

  // Option 2: Severe multi-story keywords (REJECT these - 3+ stories or primary upstairs)
  const severeMultiStoryKeywords = [
    'three story', '3 story', 'three-story', '3-story',
    'four story', '4 story', 'four-story', '4-story',
    'primary upstairs', 'primary bedroom upstairs', 'primary suite upstairs',
    'master upstairs', 'master bedroom upstairs', 'master suite upstairs',
    'owner suite upstairs', 'owner\'s suite upstairs',
    'stairs to primary', 'stairs to master'
  ];
  const hasSevereMultiStory = severeMultiStoryKeywords.some(kw => desc.includes(kw));

  // Option 3: Light multi-story keywords (secondary bedrooms upstairs - OK if primary on main)
  const lightMultiStoryKeywords = [
    'upstairs', 'second floor', 'upper level', 'lower level',
    'two story', '2 story', 'two-story', '2-story',
    'split level'
  ];
  const hasLightMultiStory = lightMultiStoryKeywords.some(kw => desc.includes(kw));

  // Single-story indicators
  const singleStoryKeywords = [
    'ranch', 'single-level', 'single level',
    'one-story', 'one story', 'single-story', 'single story',
    'main floor living', 'no stairs', 'one level', 'all on one level'
  ];
  const hasSingleStory = singleStoryKeywords.some(kw => desc.includes(kw));

  // DECISION LOGIC:
  // 1. If has primary-on-main, ACCEPT (even if has upstairs bedrooms)
  // 2. If has severe multi-story (3+ stories or primary upstairs), REJECT
  // 3. If has single-story indicators, ACCEPT
  // 4. If only has light multi-story (like upstairs bedrooms) without primary-on-main, REJECT

  let shouldAccept = false;
  let reason = '';

  if (hasPrimaryOnMain) {
    shouldAccept = true;
    reason = 'Has primary-on-main (can live entirely on main floor)';
  } else if (hasSevereMultiStory) {
    shouldAccept = false;
    reason = 'Has severe multi-story keywords (3+ stories or primary upstairs)';
  } else if (hasSingleStory) {
    shouldAccept = true;
    reason = 'Has single-story keywords';
  } else if (hasLightMultiStory) {
    shouldAccept = false;
    reason = 'Has multi-story keywords without primary-on-main confirmation';
  } else {
    shouldAccept = true;
    reason = 'No clear multi-story indicators (assuming single-story)';
  }

  console.log('\n--- NEW FILTERING ANALYSIS ---');
  console.log('Primary-on-Main:', hasPrimaryOnMain ? 'YES ✓' : 'NO');
  if (hasPrimaryOnMain) {
    const matched = primaryOnMainKeywords.filter(kw => desc.includes(kw));
    console.log('  Matched:', matched.join(', '));
  }

  console.log('Severe Multi-Story (3+ floors, primary upstairs):', hasSevereMultiStory ? 'YES ✗' : 'NO');
  if (hasSevereMultiStory) {
    const matched = severeMultiStoryKeywords.filter(kw => desc.includes(kw));
    console.log('  Matched:', matched.join(', '));
  }

  console.log('Light Multi-Story (upstairs bedrooms):', hasLightMultiStory ? 'YES' : 'NO');
  if (hasLightMultiStory) {
    const matched = lightMultiStoryKeywords.filter(kw => desc.includes(kw));
    console.log('  Matched:', matched.join(', '));
  }

  console.log('Single-Story Keywords:', hasSingleStory ? 'YES ✓' : 'NO');
  if (hasSingleStory) {
    const matched = singleStoryKeywords.filter(kw => desc.includes(kw));
    console.log('  Matched:', matched.join(', '));
  }

  console.log('\n>>> DECISION:', shouldAccept ? 'ACCEPT ✓' : 'REJECT ✗');
  console.log('>>> REASON:', reason);
} else {
  console.log('Property not found or error:', result);
}
}
