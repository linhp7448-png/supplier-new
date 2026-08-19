// Edge Function: quản lý tài khoản (chỉ admin). Dùng service_role phía server.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admins = (Deno.env.get("ADMIN_EMAILS") || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const admin = createClient(url, service);
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: u } = await admin.auth.getUser(jwt);
    const email = (u?.user?.email || "").toLowerCase();
    if (!email) return json({ error: "Chưa đăng nhập" }, 401);
    if (admins.length && !admins.includes(email)) return json({ error: "Bạn không có quyền quản lý người dùng (chỉ admin)." }, 403);

    const body = await req.json().catch(() => ({}));
    const a = body.action;
    if (a === "list") {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (error) throw error;
      return json({ users: (data.users || []).map((x) => ({ id: x.id, email: x.email, created_at: x.created_at, last_sign_in_at: x.last_sign_in_at })) });
    }
    if (a === "create") {
      if (!body.email || !body.password) return json({ error: "Thiếu email hoặc mật khẩu" }, 400);
      const { data, error } = await admin.auth.admin.createUser({ email: body.email, password: body.password, email_confirm: true });
      if (error) throw error;
      return json({ ok: true, id: data.user?.id });
    }
    if (a === "password") {
      if (!body.id || !body.password) return json({ error: "Thiếu thông tin" }, 400);
      const { error } = await admin.auth.admin.updateUserById(body.id, { password: body.password });
      if (error) throw error;
      return json({ ok: true });
    }
    if (a === "delete") {
      if (!body.id) return json({ error: "Thiếu id" }, 400);
      const { error } = await admin.auth.admin.deleteUser(body.id);
      if (error) throw error;
      return json({ ok: true });
    }
    return json({ error: "Hành động không hợp lệ" }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
