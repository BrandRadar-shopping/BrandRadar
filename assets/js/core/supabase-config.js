window.SUPABASE_CONFIG = {
  url: "https://eifrfwtkyrirrmaupfij.supabase.co",
  anonKey: "sb_publishable_4t_wIAT5FjDklllDJtYkaA_IlEkbxn2"
};

window.BRANDRADAR_SUPABASE_URL = window.SUPABASE_CONFIG.url;
window.BRANDRADAR_SUPABASE_ANON_KEY = window.SUPABASE_CONFIG.anonKey;

// ======================================================
// CREATE GLOBAL SUPABASE CLIENT
// ======================================================

if (window.supabase?.createClient) {
  window.BrandRadarSupabase = window.supabase.createClient(
    window.SUPABASE_CONFIG.url,
    window.SUPABASE_CONFIG.anonKey
  );

  console.log("✅ BrandRadar Supabase client ready");
} else {
  console.error("❌ Supabase library mangler");
}
