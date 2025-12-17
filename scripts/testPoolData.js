import 'dotenv/config';

const HASDATA_API_KEY = process.env.VITE_HASDATA_API_KEY || 'c7c6e86e-619d-4cb8-9c4b-9051bd3ad27d';

console.log('Testing if HasData API returns pool information in property data...\n');

try {
  // Fetch without pool filter to see if pool data comes back
  const url = `https://api.hasdata.com/scrape/zillow/listing?keyword=${encodeURIComponent('Alpharetta, GA')}&type=forSale&singleStoryOnly=true`;

  console.log('Fetching properties WITHOUT pool filter...');
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': HASDATA_API_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const result = await response.json();
  const properties = result.properties || [];

  console.log(`Found ${properties.length} properties\n`);

  // Check first 5 properties for pool-related fields
  console.log('Checking for pool-related fields in first 5 properties:\n');

  for (let i = 0; i < Math.min(5, properties.length); i++) {
    const prop = properties[i];
    console.log(`Property ${i + 1}: ${prop.address?.street}`);
    console.log('  All keys:', Object.keys(prop).join(', '));
    console.log('  Has "pool" key?:', 'pool' in prop);
    console.log('  Has "hasPool" key?:', 'hasPool' in prop);
    console.log('  Has "amenities" key?:', 'amenities' in prop);
    console.log('  Has "otherAmenities" key?:', 'otherAmenities' in prop);
    console.log('  Has "poolFeatures" key?:', 'poolFeatures' in prop);

    if (prop.pool !== undefined) console.log('  pool:', prop.pool);
    if (prop.hasPool !== undefined) console.log('  hasPool:', prop.hasPool);
    if (prop.amenities !== undefined) console.log('  amenities:', prop.amenities);
    if (prop.otherAmenities !== undefined) console.log('  otherAmenities:', prop.otherAmenities);
    if (prop.poolFeatures !== undefined) console.log('  poolFeatures:', prop.poolFeatures);

    console.log('');
  }

  // Now test WITH pool filter to see what we get
  console.log('\n' + '='.repeat(80));
  console.log('Now testing WITH pool filter...\n');

  const urlWithPool = `https://api.hasdata.com/scrape/zillow/listing?keyword=${encodeURIComponent('Alpharetta, GA')}&type=forSale&singleStoryOnly=true&otherAmenities=pool`;

  const response2 = await fetch(urlWithPool, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': HASDATA_API_KEY
    }
  });

  if (!response2.ok) {
    throw new Error(`API Error: ${response2.status}`);
  }

  const result2 = await response2.json();
  const propertiesWithPool = result2.properties || [];

  console.log(`Found ${propertiesWithPool.length} properties WITH pool filter`);
  console.log(`Without pool filter: ${properties.length} properties`);
  console.log(`Difference: ${properties.length - propertiesWithPool.length} properties filtered out`);

} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
}
