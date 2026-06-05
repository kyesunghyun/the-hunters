function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(init.headers || {}),
    },
  });
}

async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function isAuthorized(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const [expiresAt, signature] = token.split(".");
  const expires = Number(expiresAt);
  if (!expires || !signature || Date.now() > expires) return false;
  return (await hmacHex(env.ADMIN_PASSWORD, String(expires))) === signature;
}

async function requireAuth(request, env) {
  if (!(await isAuthorized(request, env))) {
    return jsonResponse({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
  }
  return null;
}

export async function onRequestGet({ request, env }) {
  const authError = await requireAuth(request, env);
  if (authError) return authError;
  if (!env.THE_HUNTERS_CMS) {
    return jsonResponse({ ok: false, error: "THE_HUNTERS_CMS KV 바인딩이 없습니다." }, { status: 500 });
  }

  const items = (await env.THE_HUNTERS_CMS.get("qaItems", "json")) || [];
  return jsonResponse({
    ok: true,
    items: items.sort((a, b) => String(b.createdAt || b.date || "").localeCompare(String(a.createdAt || a.date || ""))),
  });
}

export function onRequest() {
  return jsonResponse({ ok: false, error: "Method not allowed" }, { status: 405 });
}
