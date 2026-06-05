const TOKEN_TTL_SECONDS = 60 * 60 * 12;

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

async function createToken(secret) {
  const expiresAt = Date.now() + TOKEN_TTL_SECONDS * 1000;
  const signature = await hmacHex(secret, String(expiresAt));
  return {
    token: `${expiresAt}.${signature}`,
    expiresAt: new Date(expiresAt).toISOString(),
  };
}

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD) {
    return jsonResponse({ ok: false, error: "ADMIN_PASSWORD가 설정되어 있지 않습니다." }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  if (body.password !== env.ADMIN_PASSWORD) {
    return jsonResponse({ ok: false, error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const token = await createToken(env.ADMIN_PASSWORD);
  return jsonResponse({ ok: true, ...token });
}

export function onRequest() {
  return jsonResponse({ ok: false, error: "Method not allowed" }, { status: 405 });
}
