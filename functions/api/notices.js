function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=120",
      ...(init.headers || {}),
    },
  });
}

async function readJson(env, key) {
  if (!env.THE_HUNTERS_CMS) return [];
  return (await env.THE_HUNTERS_CMS.get(key, "json")) || [];
}

function publicItems(items) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => item && item.visible === true)
    .sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      return String(b.date || "").localeCompare(String(a.date || ""));
    })
    .map((item) => ({
      id: String(item.id || ""),
      title: String(item.title || ""),
      date: String(item.date || ""),
      badge: String(item.badge || ""),
      summary: String(item.summary || ""),
      link: String(item.link || ""),
      pinned: Boolean(item.pinned),
      visible: true,
    }));
}

export async function onRequestGet({ env }) {
  try {
    const [notices, activities] = await Promise.all([
      readJson(env, "notices"),
      readJson(env, "activities"),
    ]);

    return jsonResponse({
      ok: true,
      notices: publicItems(notices),
      activities: publicItems(activities),
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: "공지사항을 불러오지 못했습니다.",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export function onRequest() {
  return jsonResponse({ ok: false, error: "Method not allowed" }, { status: 405 });
}
