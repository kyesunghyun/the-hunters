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

async function readQaItems(env) {
  if (!env.THE_HUNTERS_CMS) throw new Error("THE_HUNTERS_CMS KV 바인딩이 없습니다.");
  return (await env.THE_HUNTERS_CMS.get("qaItems", "json")) || [];
}

async function writeQaItems(env, items) {
  if (!env.THE_HUNTERS_CMS) throw new Error("THE_HUNTERS_CMS KV 바인딩이 없습니다.");
  await env.THE_HUNTERS_CMS.put("qaItems", JSON.stringify(items));
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function maskName(name) {
  const text = String(name || "익명").trim();
  if (!text || text === "익명") return "익명";
  if (text.length === 1) return `${text}*`;
  return `${text[0]}${"*".repeat(Math.min(2, text.length - 1))}`;
}

function publicQaItem(item) {
  return {
    id: item.id,
    title: item.title,
    date: item.date,
    maskedName: maskName(item.name),
    answered: Boolean(item.answered && item.answer),
    secret: true,
    visible: item.visible !== false,
  };
}

export async function onRequestGet({ env }) {
  try {
    const items = await readQaItems(env);
    const publicItems = items
      .filter((item) => item.visible !== false)
      .sort((a, b) => String(b.createdAt || b.date || "").localeCompare(String(a.createdAt || a.date || "")))
      .map(publicQaItem);

    return jsonResponse({ ok: true, items: publicItems });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: "Q&A 목록을 불러오지 못했습니다.",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => null);
    const name = String(body?.name || "").trim();
    const password = String(body?.password || "");
    const title = String(body?.title || "").trim();
    const content = String(body?.content || "").trim();
    const privacyConsent = Boolean(body?.privacyConsent);

    if (!name || !password || !title || !content || !privacyConsent) {
      return jsonResponse({ ok: false, error: "필수 항목을 모두 입력해 주세요." }, { status: 400 });
    }

    const items = await readQaItems(env);
    const salt = crypto.randomUUID();
    const now = new Date().toISOString();
    const item = {
      id: crypto.randomUUID(),
      name,
      title,
      content,
      date: now.slice(0, 10),
      createdAt: now,
      passwordSalt: salt,
      passwordHash: await sha256Hex(`${salt}:${password}`),
      privacyConsent: true,
      visible: true,
      secret: true,
      answered: false,
      answer: "",
      answeredAt: "",
    };

    items.unshift(item);
    await writeQaItems(env, items);

    return jsonResponse({ ok: true, item: publicQaItem(item) }, { status: 201 });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: "질문을 등록하지 못했습니다.",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export function onRequest() {
  return jsonResponse({ ok: false, error: "Method not allowed" }, { status: 405 });
}
