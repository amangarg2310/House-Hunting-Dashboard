import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const { data: grades, error } = await supabase.from('grades').select('*');

if (error) {
  console.error('Error fetching grades:', error);
  process.exit(1);
}

console.log('Grades in DB:', JSON.stringify(grades, null, 2));
console.log('Total grades:', grades?.length || 0);
