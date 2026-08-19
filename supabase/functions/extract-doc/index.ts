// Edge Function: trích xuất thông tin NCC bằng Claude — 2 chế độ:
//  1) { fileBase64, mimeType } — đọc ảnh/PDF Giấy phép KD (vision)
//  2) { url } — tải 1 trang tra cứu doanh nghiệp (vd DauThau.Net, MaSoThue.com…) và đọc text
// Yêu cầu: đã đăng nhập (JWT hợp lệ). Cần secret ANTHROPIC_API_KEY (đặt bằng:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxx
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

const MAX_BASE64_LEN = 12_000_000; // ~9MB tệp gốc, đủ dư cho GPKD scan
const MAX_PAGE_BYTES = 1_500_000; // giới hạn tải trang web
const FETCH_TIMEOUT_MS = 12_000;

const FIELDS_SPEC = `{
  "name": "Tên doanh nghiệp đầy đủ",
  "mst": "Mã số thuế / Mã số doanh nghiệp — CHỈ gồm chữ số, đúng 10 ký tự, bỏ khoảng trắng và gạch ngang",
  "business_reg_no": "Số Giấy chứng nhận ĐKDN nếu khác MST, ngược lại để rỗng",
  "addr": "Địa chỉ trụ sở chính, ghi đầy đủ",
  "legal_rep": "Họ tên người đại diện theo pháp luật",
  "designation": "Chức danh người đại diện, ví dụ: Giám đốc, Chủ tịch HĐQT"
}`;

// Chặn fetch tới địa chỉ nội bộ/private (chống SSRF) khi dùng chế độ "dán link".
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h === "0.0.0.0" || h === "::1") return true;
  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(br|tr|p|div|li|h[1-6])[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) return json({ error: "Server chưa cấu hình ANTHROPIC_API_KEY." }, 500);

    // Chỉ cho user đã đăng nhập gọi (tái dùng JWT của app, không cần quyền admin).
    const admin = createClient(supaUrl, service);
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: u } = await admin.auth.getUser(jwt);
    if (!u?.user?.email) return json({ error: "Chưa đăng nhập" }, 401);

    const body = await req.json().catch(() => ({}));
    const pageUrl = String(body.url || "").trim();
    const fileBase64 = String(body.fileBase64 || "");
    const mimeType = String(body.mimeType || "");

    let contentBlock: Record<string, unknown>;
    let promptIntro: string;

    if (pageUrl) {
      // ---- Chế độ dán link (vd dauthau.net, masothue.com…) ----
      let parsed: URL;
      try {
        parsed = new URL(pageUrl);
      } catch {
        return json({ error: "Link không hợp lệ." }, 400);
      }
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return json({ error: "Chỉ hỗ trợ link http/https." }, 400);
      if (isBlockedHost(parsed.hostname)) return json({ error: "Không được phép truy cập địa chỉ này." }, 400);

      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
      let pageRes: Response;
      try {
        pageRes = await fetch(parsed.toString(), {
          signal: ctrl.signal,
          redirect: "follow",
          headers: { "User-Agent": "Mozilla/5.0 (compatible; SupplierMgmtBot/1.0)" },
        });
      } catch {
        clearTimeout(t);
        return json({ error: "Không tải được trang (timeout hoặc bị chặn)." }, 502);
      }
      clearTimeout(t);
      if (!pageRes.ok) return json({ error: "Trang trả về lỗi HTTP " + pageRes.status }, 502);

      const buf = await pageRes.arrayBuffer();
      const bytes = buf.byteLength > MAX_PAGE_BYTES ? buf.slice(0, MAX_PAGE_BYTES) : buf;
      const html = new TextDecoder("utf-8").decode(bytes);
      const text = htmlToText(html).slice(0, 15000);
      if (!text) return json({ error: "Không đọc được nội dung trang." }, 502);

      contentBlock = { type: "text", text: "Nội dung trang web (đã bỏ thẻ HTML):\n" + text };
      promptIntro = `Đây là nội dung trích từ một trang tra cứu thông tin doanh nghiệp Việt Nam (vd DauThau.Net, MaSoThue.com…).`;
    } else {
      // ---- Chế độ upload ảnh/PDF Giấy phép KD ----
      if (!fileBase64) return json({ error: "Thiếu tệp hoặc link" }, 400);
      if (fileBase64.length > MAX_BASE64_LEN) return json({ error: "Tệp quá lớn." }, 400);
      const isImage = /^image\/(png|jpe?g|webp|gif)$/.test(mimeType);
      const isPdf = mimeType === "application/pdf";
      if (!isImage && !isPdf) return json({ error: "Chỉ hỗ trợ ảnh (PNG/JPG/WEBP) hoặc PDF." }, 400);
      contentBlock = isPdf
        ? { type: "document", source: { type: "base64", media_type: mimeType, data: fileBase64 } }
        : { type: "image", source: { type: "base64", media_type: mimeType, data: fileBase64 } };
      promptIntro = `Đây là ảnh/PDF Giấy chứng nhận đăng ký doanh nghiệp (Giấy phép kinh doanh) tại Việt Nam.`;
    }

    const prompt = `${promptIntro}
Đọc kỹ và trả về DUY NHẤT một JSON thuần (không markdown, không giải thích thêm) với các khoá sau:
${FIELDS_SPEC}
Nếu không đọc được một trường, để giá trị là chuỗi rỗng "". Không tự bịa thông tin không có trong tài liệu/trang web.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1024,
        messages: [{ role: "user", content: [contentBlock, { type: "text", text: prompt }] }],
      }),
    });
    const j = await res.json();
    if (!res.ok) return json({ error: j?.error?.message || "Lỗi gọi AI" }, 502);

    const text = (j.content || []).map((c: { text?: string }) => c.text || "").join("").trim();
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return json({ error: "AI không trả về JSON hợp lệ", raw: text }, 502);

    let data: Record<string, string>;
    try {
      data = JSON.parse(m[0]);
    } catch {
      return json({ error: "Không đọc được JSON từ AI", raw: text }, 502);
    }
    data.mst = String(data.mst || "").replace(/\D/g, "");
    return json({ ok: true, data });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
