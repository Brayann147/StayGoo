import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ SUPABASE_URL or SUPABASE_ANON_KEY are missing in env.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTestUser() {
  const email = "juan.esteban@staygo.com";
  const password = "Password123*";
  const name = "Juan Esteban";
  const phone = "3001234567";

  console.log(`🚀 Setting up test user: ${email} ...`);

  // 1. Sign up the user in Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        phone: phone,
        user_type: 2 // Host
      }
    }
  });

  let userId;

  if (error) {
    if (error.message.includes("already registered") || error.status === 400) {
      console.log("ℹ️ User already registered in Auth. Fetching profile from database...");
      // Fetch user ID from public.user table
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
    userId = data.user.id;
    console.log(`✅ User signed up successfully with ID: ${userId}`);
  }

  // 2. Wait a moment for trigger to run and then ensure profile is updated
  console.log("Ensuring user details in public.user are correct...");
  const { error: updErr } = await supabase
    .from('user')
    .update({ name, role: 2, status: 'active' })
    .eq('id_user', userId);

  if (updErr) {
    console.warn("⚠️ Warning updating public.user:", updErr.message);
  }

  // 3. Link all seeded housings to this user
  console.log("Linking all seeded housings to the new user ID...");
  const { data: updatedHousings, error: houseErr } = await supabase
    .from('housing')
    .update({ id_owner: userId })
    .neq('id_housing', 0)
    .select();

  if (houseErr) {
    console.error("❌ Error linking housings:", houseErr.message);
    process.exit(1);
  }

  console.log(`🎉 Successfully linked ${updatedHousings.length} housings to Host ${name} (${email})!`);
  console.log("\n==================================================");
  console.log("🔑 CREDENCIALES DE PRUEBA:");
  console.log(`📧 Usuario (Email): ${email}`);
  console.log(`🔒 Contraseña (Password): ${password}`);
  console.log("==================================================");
}

setupTestUser();
