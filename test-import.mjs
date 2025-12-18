/**
 * Test script for property import API
 */

const apiKey = process.env.VITE_HASDATA_API_KEY || 'c7c6e86e-619d-4cb8-9c4b-9051bd3ad27d';

// Try different queries
const queries = [
  '805 Creekside Trail, Alpharetta, GA 30004',
  '805 Creekside Trail Alpharetta',
  '30004',
  'https://www.zillow.com/homedetails/805-Creekside-Trl-Alpharetta-GA-30004/14593154_zpid/'
];

const query = queries[2]; // Start with ZIP
const url = `https://api.hasdata.com/scrape/zillow/listing?keyword=${encodeURIComponent(query)}&type=forSale&singleStoryOnly=true`;

console.log('Testing property import for: 805 Creekside Trail');
console.log('API URL:', url);
console.log('');

try {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`API error (${response.status})`);
  }

  const result = await response.json();

  console.log('=== API Response ===');
  console.log('Has property field:', !!result.property);
  console.log('Has properties array:', Array.isArray(result.properties));
  console.log('Properties array length:', result.properties?.length || 0);
  console.log('');

  if (result.property) {
    const prop = result.property;
    console.log('=== Property Details (singular field) ===');
    console.log('ID:', prop.id);
    console.log('Address:', `${prop.address?.street}, ${prop.address?.city}, ${prop.address?.state} ${prop.address?.zipcode}`);
    console.log('Price:', prop.price);
    console.log('Home Type:', prop.homeType);
    console.log('Status:', prop.status);
    console.log('Beds/Baths:', prop.beds, '/', prop.baths);
    console.log('Square Footage:', prop.area);
    console.log('Lot Size (acres):', prop.lotAreaValue);
    console.log('');
  }

  if (result.properties && result.properties.length > 0) {
    console.log('=== First Property in Array ===');
    const prop = result.properties[0];
    console.log('Address:', `${prop.address?.street}, ${prop.address?.city}`);
    console.log('Price:', prop.price);
    console.log('Home Type:', prop.homeType);
    console.log('');
  }

  // Test transformation logic
  if (result.property) {
    const prop = result.property;
    const homeType = (prop.homeType || '').toUpperCase();
    console.log('=== Transformation Check ===');
    console.log('Home Type:', homeType);
    console.log('Contains SINGLE_FAMILY:', homeType.includes('SINGLE_FAMILY'));
    console.log('Contains RANCH:', homeType.includes('RANCH'));
    console.log('');
    console.log('Would be classified as: ranch');
    console.log('Would be single floor: true');
  }

} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
