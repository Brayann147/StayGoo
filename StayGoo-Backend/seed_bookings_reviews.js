/**
 * seed_bookings_reviews.js
 * Agrega reservas completadas + reseñas a los alojamientos del host Juan Esteban.
 * Usa los usuarios reales de la base de datos como huéspedes.
 * NO borra ningún alojamiento existente.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL o SUPABASE_ANON_KEY faltan en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Plantillas de reseñas variadas ──────────────────────────────────────────
const REVIEW_TEMPLATES = [
  {
    rating: 5, cleanliness: 5, communication: 5, check_in: 5,
    accuracy: 5, location: 5, value: 5,
    comment: 'Excelente alojamiento. Todo estuvo muy limpio, la vista es increíble y el anfitrión muy amable. Definitivamente volvería.'
  },
  {
    rating: 5, cleanliness: 5, communication: 5, check_in: 5,
    accuracy: 5, location: 4, value: 5,
    comment: 'Un lugar maravilloso para descansar. Muy cómodo y con todo lo necesario. Las camas son comodísimas y la decoración impecable.'
  },
  {
    rating: 4, cleanliness: 4, communication: 5, check_in: 5,
    accuracy: 4, location: 5, value: 4,
    comment: 'Muy buena ubicación, cerca de restaurantes y parques. Las fotos describen tal cual el lugar. Una gran experiencia.'
  },
  {
    rating: 5, cleanliness: 5, communication: 4, check_in: 5,
    accuracy: 5, location: 5, value: 5,
    comment: 'Estadía fenomenal. El espacio es amplio, luminoso y muy bien equipado. La comunicación con el anfitrión fue siempre rápida.'
  },
  {
    rating: 4, cleanliness: 4, communication: 4, check_in: 4,
    accuracy: 5, location: 4, value: 4,
    comment: 'Alojamiento muy agradable y bien equipado. Ideal para pasar unos días en tranquilidad. Repetiría sin dudar.'
  },
  {
    rating: 5, cleanliness: 5, communication: 5, check_in: 5,
    accuracy: 5, location: 5, value: 4,
    comment: 'El mejor lugar en el que me he quedado en mucho tiempo. Limpieza excepcional y trato de primera. Altamente recomendado.'
  },
  {
    rating: 4, cleanliness: 5, communication: 4, check_in: 5,
    accuracy: 4, location: 4, value: 5,
    comment: 'Muy buen precio para todo lo que ofrece. La zona es segura y tranquila. El anfitrión nos recibió con todo listo.'
  },
  {
    rating: 5, cleanliness: 4, communication: 5, check_in: 4,
    accuracy: 5, location: 5, value: 5,
    comment: 'Superó nuestras expectativas. El diseño interior es hermoso, moderno y funcional. Volveremos en la próxima vacación.'
  },
  {
    rating: 3, cleanliness: 3, communication: 4, check_in: 4,
    accuracy: 3, location: 4, value: 3,
    comment: 'Buen alojamiento en general, aunque algunos detalles podrían mejorar. La ubicación es lo mejor del lugar.'
  },
  {
    rating: 5, cleanliness: 5, communication: 5, check_in: 5,
    accuracy: 5, location: 5, value: 5,
    comment: 'Todo perfecto desde el primer momento. La atención del anfitrión es increíble. El apartamento es exactamente lo que se muestra.'
  }
];

// Fechas variadas para que las reservas sean más realistas
const DATE_RANGES = [
  { start: '2025-10-05', end: '2025-10-10', nights: 5 },
  { start: '2025-11-12', end: '2025-11-17', nights: 5 },
  { start: '2025-12-20', end: '2025-12-27', nights: 7 },
  { start: '2026-01-08', end: '2026-01-13', nights: 5 },
  { start: '2026-02-14', end: '2026-02-18', nights: 4 },
  { start: '2026-03-01', end: '2026-03-06', nights: 5 },
  { start: '2026-04-10', end: '2026-04-15', nights: 5 },
  { start: '2026-05-01', end: '2026-05-06', nights: 5 },
];

const REVIEW_DATES = [
  '2025-10-11', '2025-11-18', '2025-12-28',
  '2026-01-14', '2026-02-19', '2026-03-07',
  '2026-04-16', '2026-05-07'
];

// ─── Nombres de huéspedes ficticios para las reservas ────────────────────────
const GUEST_NAMES = [
  'Carlos Ramírez', 'María González', 'Andrés Peña',
  'Laura Martínez', 'Diego Vargas', 'Valentina Torres'
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedBookingsAndReviews() {
  console.log('\n🚀 Iniciando seed de reservas y reseñas para el host Juan Esteban...\n');

  // ─── 1. Obtener el usuario guest (Carlos Ramírez) ─────────────────────────
  console.log('📋 Buscando usuarios huéspedes disponibles...');
  const { data: guestUsers, error: guestErr } = await supabase
    .from('user')
    .select('id_user, name, email')
    .in('email', [
      'guest@staygo.com',
      'eduardo@staygo.com',
      'traveler@staygo.com',
    ]);

  // También buscar los travelers del seed original
  const { data: seedTravelers, error: travelerErr } = await supabase
    .from('user')
    .select('id_user, name, email')
    .neq('role', 2)
    .limit(8);

  let allGuests = [];
  if (guestUsers && guestUsers.length > 0) allGuests = [...allGuests, ...guestUsers];
  if (seedTravelers && seedTravelers.length > 0) allGuests = [...allGuests, ...seedTravelers];

  // Deduplicar por id_user
  const guestMap = {};
  allGuests.forEach(g => { guestMap[g.id_user] = g; });
  allGuests = Object.values(guestMap);

  if (allGuests.length === 0) {
    console.error('❌ No se encontraron usuarios huéspedes. Asegúrate de haber ejecutado create_guest_user.js primero.');
    process.exit(1);
  }

  console.log(`✅ Encontrados ${allGuests.length} usuario(s) huésped:`, allGuests.map(g => g.name || g.email));

  // ─── 2. Obtener los alojamientos del host Juan Esteban ────────────────────
  console.log('\n📋 Buscando alojamientos del host...');
  const { data: hostUser, error: hostErr } = await supabase
    .from('user')
    .select('id_user, name')
    .eq('email', 'juan.esteban@staygo.com')
    .single();

  if (hostErr || !hostUser) {
    console.error('❌ No se encontró el usuario host juan.esteban@staygo.com:', hostErr?.message);
    process.exit(1);
  }

  console.log(`✅ Host encontrado: ${hostUser.name} (ID: ${hostUser.id_user})`);

  const { data: housings, error: housingErr } = await supabase
    .from('housing')
    .select('id_housing, name, price_per_night')
    .eq('id_owner', hostUser.id_user);

  if (housingErr || !housings || housings.length === 0) {
    console.error('❌ No se encontraron alojamientos para el host:', housingErr?.message);
    process.exit(1);
  }

  console.log(`✅ Encontrados ${housings.length} alojamiento(s) del host.`);

  // ─── 3. Eliminar bookings/reviews anteriores de estos alojamientos ─────────
  console.log('\n🧹 Limpiando reservas y reseñas anteriores para evitar duplicados...');
  const housingIds = housings.map(h => h.id_housing);

  // Primero obtener los booking IDs de estos alojamientos
  const { data: existingBookings } = await supabase
    .from('booking')
    .select('id_booking')
    .in('id_housing', housingIds);

  if (existingBookings && existingBookings.length > 0) {
    const bookingIds = existingBookings.map(b => b.id_booking);
    const { error: delRevErr } = await supabase
      .from('review')
      .delete()
      .in('id_booking', bookingIds);
    if (delRevErr) console.log('  ⚠️  Nota al limpiar reseñas:', delRevErr.message);
    else console.log(`  ✅ ${bookingIds.length} reseñas antiguas eliminadas.`);

    const { error: delBkErr } = await supabase
      .from('booking')
      .delete()
      .in('id_booking', bookingIds);
    if (delBkErr) console.log('  ⚠️  Nota al limpiar reservas:', delBkErr.message);
    else console.log(`  ✅ ${bookingIds.length} reservas antiguas eliminadas.`);
  } else {
    console.log('  ✅ No había reservas previas para estos alojamientos.');
  }

  // ─── 4. Crear nuevas reservas ─────────────────────────────────────────────
  console.log('\n📅 Creando reservas variadas...');
  const bookingsToInsert = [];

  housings.forEach((housing, hIdx) => {
    // Cuántos guests asignar: entre 2 y 4 por alojamiento
    const guestCount = Math.min(allGuests.length, 2 + (hIdx % 3));
    const shuffledGuests = [...allGuests].sort(() => 0.5 - Math.random()).slice(0, guestCount);
    const shuffledDates = [...DATE_RANGES].sort(() => 0.5 - Math.random());

    shuffledGuests.forEach((guest, gIdx) => {
      const dateRange = shuffledDates[gIdx % shuffledDates.length];
      bookingsToInsert.push({
        id_user: guest.id_user,
        id_housing: housing.id_housing,
        start_date: dateRange.start,
        end_date: dateRange.end,
        total_price: housing.price_per_night * dateRange.nights,
        status: 'completed'
      });
    });
  });

  console.log(`  → Insertando ${bookingsToInsert.length} reservas...`);
  const { data: insertedBookings, error: bookInsErr } = await supabase
    .from('booking')
    .insert(bookingsToInsert)
    .select();

  if (bookInsErr) {
    console.error('❌ Error al insertar reservas:', bookInsErr.message);
    process.exit(1);
  }
  console.log(`✅ ${insertedBookings.length} reservas creadas exitosamente.`);

  // ─── 5. Crear reseñas vinculadas a las reservas ───────────────────────────
  console.log('\n⭐ Creando reseñas para las reservas...');
  const reviewsToInsert = [];

  insertedBookings.forEach((booking, idx) => {
    const template = REVIEW_TEMPLATES[idx % REVIEW_TEMPLATES.length];
    const reviewDate = REVIEW_DATES[idx % REVIEW_DATES.length];
    reviewsToInsert.push({
      id_booking: booking.id_booking,
      rating: template.rating,
      comment: template.comment,
      date: reviewDate,
      cleanliness_rating: template.cleanliness,
      communication_rating: template.communication,
      check_in_rating: template.check_in,
      accuracy_rating: template.accuracy,
      location_rating: template.location,
      value_rating: template.value
    });
  });

  console.log(`  → Insertando ${reviewsToInsert.length} reseñas...`);
  const { data: insertedReviews, error: revInsErr } = await supabase
    .from('review')
    .insert(reviewsToInsert)
    .select();

  if (revInsErr) {
    console.error('❌ Error al insertar reseñas:', revInsErr.message);
    process.exit(1);
  }
  console.log(`✅ ${insertedReviews.length} reseñas creadas exitosamente.`);

  // ─── 6. Resumen final ─────────────────────────────────────────────────────
  console.log('\n==================================================');
  console.log('🎉 ¡Seed completado exitosamente!');
  console.log(`📦 Alojamientos del host:  ${housings.length}`);
  console.log(`📅 Reservas creadas:       ${insertedBookings.length}`);
  console.log(`⭐ Reseñas creadas:        ${insertedReviews.length}`);
  console.log('\n🔑 Credenciales de prueba:');
  console.log('  HOST   → juan.esteban@staygo.com  / Password123*');
  console.log('  GUEST  → guest@staygo.com         / Guest123*');
  console.log('==================================================\n');
}

seedBookingsAndReviews();
