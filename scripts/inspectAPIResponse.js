import 'dotenv/config';

const RAPID_API_KEY = process.env.VITE_RAPIDAPI_KEY;
const RAPID_API_HOST = process.env.VITE_RAPIDAPI_HOST;

// Fetch a single property to inspect structure
console.log('Fetching one property from API...\n');

try {
  const response = await fetch(`https://${RAPID_API_HOST}/properties/v3/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': RAPID_API_KEY,
      'X-RapidAPI-Host': RAPID_API_HOST
    },
    body: JSON.stringify({
      limit: 1,
      offset: 0,
      city: 'Alpharetta',
      state_code: 'GA',
      status: ['for_sale', 'ready_to_build'],
      sort: { direction: 'desc', field: 'list_date' }
    })
  });
  const result = await response.json();

  if (result.data && result.data.home_search && result.data.home_search.results && result.data.home_search.results.length > 0) {
    const prop = result.data.home_search.results[0];

    console.log('='.repeat(80));
    console.log('FULL PROPERTY OBJECT STRUCTURE');
    console.log('='.repeat(80));
    console.log(JSON.stringify(prop, null, 2));
    console.log('\n' + '='.repeat(80));
    console.log('KEY FIELDS FOR DEBUGGING');
    console.log('='.repeat(80));

    // Photos
    console.log('\n1. PHOTOS:');
    console.log('   primary_photo:', prop.primary_photo);
    console.log('   photos array length:', prop.photos?.length || 0);
    if (prop.photos && prop.photos.length > 0) {
      console.log('   First 3 photos:', prop.photos.slice(0, 3));
    }

    // Pool info
    console.log('\n2. POOL DETECTION:');
    console.log('   description.pool:', prop.description?.pool);
    console.log('   tags:', prop.tags);
    console.log('   features:', prop.description?.features);

    // Description
    console.log('\n3. DESCRIPTION OBJECT:');
    console.log('   description keys:', Object.keys(prop.description || {}));
    console.log('   description:', JSON.stringify(prop.description, null, 2));

    console.log('\n' + '='.repeat(80));
  } else {
    console.log('No properties found in response');
    console.log('Response:', JSON.stringify(result, null, 2));
  }
} catch (error) {
  console.error('Error:', error);
}
