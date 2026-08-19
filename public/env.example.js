// Sao chép file này thành public/env.js rồi điền giá trị từ Supabase.
// Supabase Dashboard → Project Settings → API:
//   Project URL  → SUPABASE_URL
//   anon public  → SUPABASE_ANON_KEY  (KHÔNG dùng service_role ở front-end)
window.__ENV__ = {
  SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR-ANON-PUBLIC-KEY"
};
