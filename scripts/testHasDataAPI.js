import 'dotenv/config';

const HASDATA_API_KEY = 'c7c6e86e-619d-4cb8-9c4b-9051bd3ad27d';

console.log('Testing HasData Zillow API...\n');
console.log('API Key:', HASDATA_API_KEY.substring(0, 10) + '...\n');

try {
  const response = await fetch('https://api.hasdata.com/scrape/zillow/listing?keyword=Alpharetta,%20GA&type=forSale', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': HASDATA_API_KEY
    }
  });

  if (!response.ok) {
    console.error('API Error:', response.status, response.statusText);
    const errorText = await response.text();
    console.error('Error details:', errorText);
    process.exit(1);
  }

  const result = await response.json();

  console.log('='.repeat(80));
  console.log('API RESPONSE STRUCTURE');
  console.log('='.repeat(80));
  console.log(JSON.stringify(result, null, 2).substring(0, 5000));
  console.log('\n...(truncated for readability)\n');

  // Check if we have properties
  if (result && result.properties && result.properties.length > 0) {
    const firstProperty = result.properties[0];

    console.log('='.repeat(80));
    console.log('FIRST PROPERTY STRUCTURE');
    console.log('='.repeat(80));
    console.log(JSON.stringify(firstProperty, null, 2));

    console.log('\n' + '='.repeat(80));
    console.log('KEY FIELDS FOR OUR USE CASE');
    console.log('='.repeat(80));

    console.log('\n1. BASIC INFO:');
    console.log('   Address:', firstProperty.address);
    console.log('   Price:', firstProperty.price);
    console.log('   Bedrooms:', firstProperty.bedrooms);
    console.log('   Bathrooms:', firstProperty.bathrooms);
    console.log('   Square Feet:', firstProperty.livingArea);

    console.log('\n2. PHOTOS:');
    console.log('   Photo count:', firstProperty.photos?.length || 0);
    if (firstProperty.photos && firstProperty.photos.length > 0) {
      console.log('   First 3 photos:', firstProperty.photos.slice(0, 3));
    }

    console.log('\n3. PROPERTY FEATURES:');
    console.log('   Home type:', firstProperty.homeType);
    console.log('   Stories:', firstProperty.resoFacts?.stories);
    console.log('   Has pool?:', firstProperty.hasPool);
    console.log('   Pool features:', firstProperty.poolFeatures);

    console.log('\n4. ALL AVAILABLE KEYS:');
    console.log('   ', Object.keys(firstProperty).join(', '));

    console.log('\n' + '='.repeat(80));
    console.log(`Total results: ${result.properties.length}`);
    console.log(`Total in Alpharetta: ${result.searchInformation.totalResults}`);
    console.log('='.repeat(80));
  } else {
    console.log('No results found in response');
    console.log('Response structure:', Object.keys(result));
  }

} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}
