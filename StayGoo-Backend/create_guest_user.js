import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ SUPABASE_URL or SUPABASE_ANON_KEY are missing in env.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupGuestUser() {
  const email = "guest@staygo.com";
  const password = "Guest123*";
  const name = "Carlos Ramírez";
  const phone = "3009876543";

  console.log(`🚀 Setting up guest/client test user: ${email} ...`);

  // 1. Sign up the user in Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        phone: phone,
        user_type: 1 // Guest/Client
      }
    }
  });

  let userId;

  if (error) {
    if (error.message.includes("already registered") || error.status === 400) {
      console.log("ℹ️ User already registered in Auth. Fetching profile from database...");
      const { data: userProfile, error: profileErr } = await supabase
        .from('user')
        .select('id_user')
        .eq('email', email)
        .single();

      if (profileErr) {
        console.error("❌ Error fetching user profile:", profileErr.message);
        process.exit(1);
      }
      userId = userProfile.id_user;
    } else {
      console.error("❌ Error signing up:", error.message);
      process.exit(1);
    }
  } else {
    userId = data.user?.id;
    console.log(`✅ User signed up successfully with ID: ${userId}`);
  }

  // 2. Ensure public.user has correct role (1 = guest)
  if (userId) {
    console.log("Ensuring user details in public.user are correct...");
    const { error: updErr } = await supabase
      .from('user')
      .update({ name, role: 1, status: 'active' })
      .eq('id_user', userId);

    if (updErr) {
      console.warn("⚠️ Warning updating public.user:", updErr.message);
    } else {
      console.log("✅ User profile updated with role=1 (guest).");
    }
  }

  console.log("\n==================================================");
  console.log("🔑 CREDENCIALES DE PRUEBA (CLIENTE/HUÉSPED):");
  console.log(`📧 Usuario (Email): ${email}`);
  console.log(`🔒 Contraseña (Password): ${password}`);
  console.log("==================================================");
}

setupGuestUser();
