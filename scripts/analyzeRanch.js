import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🏡 Analyzing Ranch Properties ($1.1M-$2M Range)...\n');

const { data: listings, error } = await supabase.from('listings').select('*');

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

const ranchProperties = listings.filter(l => 
  l.property_type === 'ranch' &&
  l.estimated_price >= 1100000 &&
  l.estimated_price <= 2000000
);

console.log('Total ranch properties in range:', ranchProperties.length);
console.log('\nDetailed breakdown:\n');

let counter = 1;
for (const prop of ranchProperties) {
  console.log(counter + '. ' + prop.address);
  console.log('   Price: $' + (prop.estimated_price / 1000000).toFixed(2) + 'M');
  console.log('   Days on Market: ' + (prop.days_on_market || 'N/A'));
  console.log('   County: ' + prop.county);
  console.log('   Single Floor: ' + (prop.is_single_floor ? 'Yes' : 'No'));
  console.log('   Contract Status: ' + (prop.contract_status || 'N/A'));
  console.log('   Has Backyard: ' + (prop.has_backyard ? 'Yes' : 'No'));
  console.log('   Has Pool: ' + (prop.has_pool ? 'Yes' : 'No'));
  console.log('');
  counter++;
}

const within60 = ranchProperties.filter(p => p.days_on_market !== null && p.days_on_market <= 60).length;
const over60 = ranchProperties.filter(p => p.days_on_market !== null && p.days_on_market > 60).length;
const unknown = ranchProperties.filter(p => p.days_on_market === null).length;

console.log('\nDays on Market Breakdown:');
console.log('   Within 60 days:', within60);
console.log('   Over 60 days:', over60);
console.log('   Unknown/Null:', unknown);

console.log('\n🔍 Filter Analysis:');

const notSingleFloor = ranchProperties.filter(p => !p.is_single_floor);
console.log('\n   Not single floor:', notSingleFloor.length);
for (const p of notSingleFloor) {
  console.log('      - ' + p.address);
}

const configuredCounties = ['Alpharetta', 'Roswell', 'Johns Creek', 'Sandy Springs', 'Cumming', 'Buckhead', 'Vinings', 'Dunwoody', 'Marietta'];
const notInCounties = ranchProperties.filter(p => !configuredCounties.includes(p.county));
console.log('\n   Not in configured counties:', notInCounties.length);
for (const p of notInCounties) {
  console.log('      - ' + p.address + ' (' + p.county + ')');
}

const singleFloorOnly = ranchProperties.filter(p => p.is_single_floor);
console.log('\n✅ Properties passing single-floor filter:', singleFloorOnly.length);
for (const p of singleFloorOnly) {
  console.log('   - ' + p.address + ' (' + p.county + ', $' + (p.estimated_price/1000000).toFixed(2) + 'M, ' + (p.days_on_market || 'N/A') + ' days)');
}
