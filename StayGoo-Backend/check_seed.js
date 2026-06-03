import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const { data: housings } = await supabase
  .from('housing')
  .select('id_housing, name')
  .eq('id_owner', 'ee078a31-612c-4b00-baba-ab609ff98fe3')
  .limit(3);

console.log('Alojamientos del host:');
housings?.forEach(h => console.log(`  ID: ${h.id_housing}  →  ${h.name}`));

const { data: reviews } = await supabase
  .from('review')
  .select('id_review, rating, comment, booking:id_booking(id_housing)')
  .limit(5);

console.log('\nÚltimas reseñas:');
reviews?.forEach(r => console.log(`  ID: ${r.id_review}  Rating: ${r.rating}  Housing: ${r.booking?.id_housing}`));
