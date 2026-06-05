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

async function readItems(env) {
  if (!env.THE_HUNTERS_CMS) throw new Error("THE_HUNTERS_CMS KV 바인딩이 없습니다.");
  return (await env.THE_HUNTERS_CMS.get("qaItems", "json")) || [];
}

async function writeItems(env, items) {
  await env.THE_HUNTERS_CMS.put("qaItems", JSON.stringify(items));
}

export async function onRequestPut({ request, env, params }) {
  const authError = await requireAuth(request, env);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => null);
    const items = await readItems(env);
    const index = items.findIndex((item) => item.id === params.id);
    if (index === -1) {
      return jsonResponse({ ok: false, error: "질문을 찾을 수 없습니다." }, { status: 404 });
    }

    items[index] = {
      ...items[index],
      answer: String(body?.answer || ""),
      answered: Boolean(body?.answered),
      visible: Boolean(body?.visible),
      answeredAt: body?.answered ? (items[index].answeredAt || new Date().toISOString()) : "",
      updatedAt: new Date().toISOString(),
    };

    await writeItems(env, items);
    return jsonResponse({ ok: true, item: items[index] });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: "질문을 수정하지 못했습니다.",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function onRequestDelete({ request, env, params }) {
  const authError = await requireAuth(request, env);
  if (authError) return authError;

  try {
    const items = await readItems(env);
    const nextItems = items.filter((item) => item.id !== params.id);
    if (nextItems.length === items.length) {
      return jsonResponse({ ok: false, error: "질문을 찾을 수 없습니다." }, { status: 404 });
    }
    await writeItems(env, nextItems);
    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: "질문을 삭제하지 못했습니다.",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export function onRequest() {
  return jsonResponse({ ok: false, error: "Method not allowed" }, { status: 405 });
}
