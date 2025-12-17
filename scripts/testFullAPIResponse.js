import 'dotenv/config';

const HASDATA_API_KEY = process.env.VITE_HASDATA_API_KEY || 'c7c6e86e-619d-4cb8-9c4b-9051bd3ad27d';

console.log('Testing FULL HasData API response structure...\n');

try {
  // Test forSale
  console.log('='.repeat(80));
  console.log('TESTING FOR SALE PROPERTIES');
  console.log('='.repeat(80));
  const saleUrl = `https://api.hasdata.com/scrape/zillow/listing?keyword=${encodeURIComponent('Alpharetta, GA')}&type=forSale&singleStoryOnly=true`;

  const saleResponse = await fetch(saleUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': HASDATA_API_KEY
    }
  });

  if (!saleResponse.ok) {
    throw new Error(`API Error: ${saleResponse.status}`);
  }

  const saleResult = await saleResponse.json();
  const saleProperties = saleResult.properties || [];

  if (saleProperties.length > 0) {
    console.log('\nFIRST FOR-SALE PROPERTY (FULL JSON):');
    console.log(JSON.stringify(saleProperties[0], null, 2));
  }

  // Test forRent
  console.log('\n\n' + '='.repeat(80));
  console.log('TESTING FOR RENT PROPERTIES');
  console.log('='.repeat(80));
  const rentUrl = `https://api.hasdata.com/scrape/zillow/listing?keyword=${encodeURIComponent('Alpharetta, GA')}&type=forRent&singleStoryOnly=true`;

  const rentResponse = await fetch(rentUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': HASDATA_API_KEY
    }
  });

  if (!rentResponse.ok) {
    throw new Error(`API Error: ${rentResponse.status}`);
  }

  const rentResult = await rentResponse.json();
  const rentProperties = rentResult.properties || [];

  console.log(`\nFound ${rentProperties.length} rental properties`);

  if (rentProperties.length > 0) {
    console.log('\nFIRST FOR-RENT PROPERTY (FULL JSON):');
    console.log(JSON.stringify(rentProperties[0], null, 2));
  }

} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
}
