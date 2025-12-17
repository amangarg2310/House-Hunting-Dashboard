import 'dotenv/config';

const HASDATA_API_KEY = process.env.VITE_HASDATA_API_KEY || 'c7c6e86e-619d-4cb8-9c4b-9051bd3ad27d';

console.log('Testing HasData API fetch for Alpharetta, GA (forSale)...\n');

try {
  const url = `https://api.hasdata.com/scrape/zillow/listing?keyword=${encodeURIComponent('Alpharetta, GA')}&type=forSale&singleStoryOnly=true`;

  console.log('URL:', url);
  console.log('API Key:', HASDATA_API_KEY.substring(0, 10) + '...\n');

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': HASDATA_API_KEY
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ API Error:', response.status, response.statusText);
    console.error('Error details:', errorText);
    process.exit(1);
  }

  const result = await response.json();
  const properties = result.properties || [];

  console.log('✅ Success!');
  console.log(`Found ${properties.length} single-story properties in Alpharetta`);
  console.log(`Total single-story properties in Alpharetta: ${result.searchInformation?.totalResults || 0}`);

  if (properties.length > 0) {
    const first = properties[0];
    console.log('\n📋 First property sample:');
    console.log('  ID:', first.id);
    console.log('  Address:', first.address?.street);
    console.log('  City:', first.address?.city);
    console.log('  Price:', first.price);
    console.log('  Type:', first.homeType);
    console.log('  Beds:', first.beds);
    console.log('  Baths:', first.baths);
    console.log('  Square Feet:', first.area);
    console.log('  Days on Zillow:', first.daysOnZillow);
    console.log('  Photos:', first.photos?.length || 0);
    console.log('  URL:', first.url);
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
