/*
  Winter Collection by Maazi
  Supabase client configuration
*/

const SUPABASE_URL = "https://extbxdbzyfpbnpnhswsu.supabase.co/";
const SUPABASE_ANON_KEY = "sb_publishable_imfAmf4GjqdTgzimy7T_iw_xSZLRCX2";

// Load Supabase JS library before this file.
// Never put a service_role key or secret key in browser code.

if (!window.supabase) {
  console.error("Supabase library has not loaded.");
}

if (
  window.supabase &&
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("PASTE_") &&
  !SUPABASE_ANON_KEY.includes("PASTE_")
) {
  window.maaziSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
} else {
  window.maaziSupabase = null;
  console.warn("Add your Supabase project URL and publishable key.");
}
