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

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function normalizeLookupCode(value) {
  return String(value || "").trim().toUpperCase();
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.THE_HUNTERS_CMS) throw new Error("THE_HUNTERS_CMS KV 바인딩이 없습니다.");

    const body = await request.json().catch(() => null);
    const lookupCode = normalizeLookupCode(body?.lookupCode);
    const password = String(body?.password || "");

    if (!lookupCode || !password) {
      return jsonResponse({ ok: false, error: "조회 코드와 비밀번호를 입력해 주세요." }, { status: 400 });
    }

    const items = (await env.THE_HUNTERS_CMS.get("qaItems", "json")) || [];
    const item = items.find((entry) => normalizeLookupCode(entry.lookupCode) === lookupCode && entry.visible !== false);

    if (!item) {
      return jsonResponse({ ok: false, error: "질문을 찾을 수 없습니다." }, { status: 404 });
    }

    const hash = await sha256Hex(`${item.passwordSalt}:${password}`);
    if (hash !== item.passwordHash) {
      return jsonResponse({ ok: false, error: "조회 코드 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
    }

    return jsonResponse({
      ok: true,
      item: {
        lookupCode: item.lookupCode,
        title: item.title,
        content: item.content,
        date: item.date,
        answered: Boolean(item.answered && item.answer),
        answer: item.answer || "",
        answeredAt: item.answeredAt || "",
        secret: true,
      },
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: "질문을 확인하지 못했습니다.",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export function onRequest() {
  return jsonResponse({ ok: false, error: "Method not allowed" }, { status: 405 });
}
