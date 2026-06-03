/**
 * seed_guest_bookings.js
 * Agrega reservas (en distintos estados) al usuario guest@staygo.com
 * para que pueda verlas en su panel de cliente.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function seedGuestBookings() {
  console.log('\n🚀 Iniciando seed de reservas para el usuario guest...\n');

  // ─── 1. Obtener el usuario guest ─────────────────────────────────────────
  const { data: guest, error: guestErr } = await supabase
    .from('user')
    .select('id_user, name, email')
    .eq('email', 'guest@staygo.com')
    .single();

  if (guestErr || !guest) {
    console.error('❌ No se encontró guest@staygo.com:', guestErr?.message);
    process.exit(1);
  }
  console.log(`✅ Guest encontrado: ${guest.name} (${guest.email}) → ID: ${guest.id_user}`);

  // ─── 2. Obtener varios alojamientos disponibles ───────────────────────────
  const { data: housings, error: housingErr } = await supabase
    .from('housing')
    .select('id_housing, name, price_per_night, municipality, country')
    .eq('status', 'available')
    .limit(6);

  if (housingErr || !housings || housings.length === 0) {
    console.error('❌ No se encontraron alojamientos:', housingErr?.message);
    process.exit(1);
  }
  console.log(`✅ Usando ${housings.length} alojamientos para las reservas.`);

  // ─── 3. Eliminar reservas previas del guest (sin tocar reseñas de otros) ──
  console.log('\n🧹 Limpiando reservas anteriores del guest...');
  const { data: oldBookings } = await supabase
    .from('booking')
    .select('id_booking')
    .eq('id_user', guest.id_user);

  if (oldBookings && oldBookings.length > 0) {
    const oldIds = oldBookings.map(b => b.id_booking);
    await supabase.from('review').delete().in('id_booking', oldIds);
    await supabase.from('booking').delete().in('id_booking', oldIds);
    console.log(`  ✅ ${oldIds.length} reservas antiguas del guest eliminadas.`);
  } else {
    console.log('  ✅ No había reservas previas del guest.');
  }

  // ─── 4. Definir las reservas a crear ──────────────────────────────────────
  const bookingsData = [
    // FUTURAS (upcoming)
    {
      housing: housings[0],
      start: '2026-07-10', end: '2026-07-15', nights: 5,
      status: 'confirmed'
    },
    {
      housing: housings[1] || housings[0],
      start: '2026-08-01', end: '2026-08-08', nights: 7,
      status: 'confirmed'
    },
    // PENDIENTE (esperando confirmación)
    {
      housing: housings[2] || housings[0],
      start: '2026-09-20', end: '2026-09-25', nights: 5,
      status: 'pending'
    },
    // COMPLETADAS (para poder dejar reseña)
    {
      housing: housings[3] || housings[0],
      start: '2026-04-05', end: '2026-04-10', nights: 5,
      status: 'completed'
    },
    {
      housing: housings[4] || housings[1] || housings[0],
      start: '2026-05-15', end: '2026-05-20', nights: 5,
      status: 'completed'
    },
    // CANCELADA
    {
      housing: housings[5] || housings[2] || housings[0],
      start: '2026-03-10', end: '2026-03-15', nights: 5,
      status: 'cancelled'
    }
  ];

  const toInsert = bookingsData.map(b => ({
    id_user: guest.id_user,
    id_housing: b.housing.id_housing,
    start_date: b.start,
    end_date: b.end,
    total_price: b.housing.price_per_night * b.nights,
    status: b.status
  }));

  // ─── 5. Insertar reservas ─────────────────────────────────────────────────
  console.log(`\n📅 Creando ${toInsert.length} reservas para el guest...`);
  const { data: inserted, error: insErr } = await supabase
    .from('booking')
    .insert(toInsert)
    .select();

  if (insErr) {
    console.error('❌ Error al insertar reservas:', insErr.message);
    process.exit(1);
  }
  console.log(`✅ ${inserted.length} reservas creadas.`);

  // ─── 6. Agregar reseñas a las reservas completadas ───────────────────────
  const completedBookings = inserted.filter(b => b.status === 'completed');
  const REVIEWS = [
    {
      rating: 5, cleanliness: 5, communication: 5, check_in: 5,
      accuracy: 5, location: 5, value: 5,
      comment: '¡Una experiencia increíble! El lugar estaba impecable, exactamente como en las fotos. El anfitrión fue muy atento y rápido respondiendo. Volvería sin dudarlo.',
      date: '2026-04-11'
    },
    {
      rating: 4, cleanliness: 4, communication: 5, check_in: 4,
      accuracy: 4, location: 5, value: 4,
      comment: 'Muy buena estadía en general. La ubicación es excelente, cerca de todo. El espacio es cómodo y bien equipado. Lo recomendaría a amigos y familia.',
      date: '2026-05-21'
    }
  ];

  if (completedBookings.length > 0) {
    console.log('\n⭐ Creando reseñas para las reservas completadas...');
    const reviewsToInsert = completedBookings.map((bk, idx) => ({
      id_booking: bk.id_booking,
      rating: REVIEWS[idx % REVIEWS.length].rating,
      comment: REVIEWS[idx % REVIEWS.length].comment,
      date: REVIEWS[idx % REVIEWS.length].date,
      cleanliness_rating: REVIEWS[idx % REVIEWS.length].cleanliness,
      communication_rating: REVIEWS[idx % REVIEWS.length].communication,
      check_in_rating: REVIEWS[idx % REVIEWS.length].check_in,
      accuracy_rating: REVIEWS[idx % REVIEWS.length].accuracy,
      location_rating: REVIEWS[idx % REVIEWS.length].location,
      value_rating: REVIEWS[idx % REVIEWS.length].value
    }));

    const { data: insertedReviews, error: revErr } = await supabase
      .from('review')
      .insert(reviewsToInsert)
      .select();

    if (revErr) console.warn('⚠️  Nota en reseñas:', revErr.message);
    else console.log(`✅ ${insertedReviews.length} reseñas del guest creadas.`);
  }

  // ─── 7. Resumen ───────────────────────────────────────────────────────────
  console.log('\n==================================================');
  console.log('🎉 ¡Reservas del guest creadas exitosamente!');
  console.log('\n📋 Resumen de reservas creadas:');
  inserted.forEach((bk, idx) => {
    const h = bookingsData[idx];
    const emoji = bk.status === 'confirmed' ? '✅' :
                  bk.status === 'pending'   ? '⏳' :
                  bk.status === 'completed' ? '✔️' : '❌';
    console.log(`  ${emoji} [${bk.status.toUpperCase()}] ${h.housing.name?.substring(0,40)} | ${h.start} → ${h.end} | $${bk.total_price.toLocaleString()}`);
  });
  console.log('\n🔑 Credenciales:');
  console.log('  GUEST  → guest@staygo.com  /  Guest123*');
  console.log('==================================================\n');
}

seedGuestBookings();
