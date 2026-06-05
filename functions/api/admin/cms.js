const DEFAULT_SITE_SETTINGS = {
  heroTitle: "THE HUNTERS",
  heroSubtitle: "전국 100여 개 대학교, 1,500명 이상의 회원이 함께하는<br>대한민국 최대 규모의 대학생 주식투자 연합동아리입니다.",
  applyButtonText: "지금 지원하기",
  legalNotice: `동아리 오티방 초대 전에
유의사항이 있어 전달해드립니다.

저희 동아리는 온라인 활동을 병행하고 있어
욕설, 비방, 명예훼손 등 타인을 침해하는 행위를
예방하기 위해 활동 시작 전에 준수사항을 안내드립니다.

제307조 (명예훼손)①공연히 사실을 적시하여 사람의 명예를 훼손한 자는 2년이하의 징역이나 금고 또는 500만원이하의 벌금에 처한다.<개정 1995. 12. 29.>

②공연히 허위의 사실을 적시하여 사람의 명예를 훼손한 자는 5년이하의 징역, 10년 이하의 자격정지 또는 1천만원 이하의 벌금에 처한다.<개정 1995. 12. 29.>

위 명예훼손 관련 사항을 충분히 인지했으며
저희 동아리는 관련 준수사항을 사전에 고지했음을 알립니다.

향후 타인의 권리를 침해하는 문제가 발생할 경우
관련 법령과 절차에 따라 필요한 조치가 진행될 수 있습니다.

위의 사항에 미동의 시 동아리 가입이 제한될 수 있습니다.
충분히 인지하셨으면 동의 눌러주시면 됩니다.`,
  contactMessage: "지원 및 활동 관련 문의는 아래 연락처로 부탁드립니다.",
  presidentPhone: "010-2654-8333",
  staffPhone: "010-9496-5411",
};

const DEFAULT_TICKER_ITEMS = [
  { id: "ticker-1", text: "KOSPI 시장 흐름 업데이트", visible: true, order: 1 },
  { id: "ticker-2", text: "NASDAQ 변동성 확대", visible: true, order: 2 },
  { id: "ticker-3", text: "USD/KRW 환율 체크", visible: true, order: 3 },
  { id: "ticker-4", text: "반도체·AI 섹터 관심", visible: true, order: 4 },
  { id: "ticker-5", text: "글로벌 증시 주요 이슈 모니터링", visible: true, order: 5 },
];

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

  const expected = await hmacHex(env.ADMIN_PASSWORD, String(expires));
  return expected === signature;
}

async function requireAuth(request, env) {
  if (!(await isAuthorized(request, env))) {
    return jsonResponse({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
  }
  return null;
}

async function readJson(env, key, fallback) {
  const value = await env.THE_HUNTERS_CMS.get(key, "json");
  return value ?? fallback;
}

function normalizeEntry(item, index) {
  item = item || {};
  return {
    id: String(item.id || crypto.randomUUID()),
    title: String(item.title || "").trim(),
    date: String(item.date || "").trim(),
    badge: String(item.badge || "").trim(),
    summary: String(item.summary || "").trim(),
    link: String(item.link || "").trim(),
    pinned: Boolean(item.pinned),
    visible: Boolean(item.visible),
    order: Number(item.order || index + 1),
  };
}

function normalizeTicker(item, index) {
  item = item || {};
  return {
    id: String(item.id || crypto.randomUUID()),
    text: String(item.text || "").trim(),
    visible: Boolean(item.visible),
    order: Number(item.order || index + 1),
  };
}

function normalizeSettings(settings) {
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...(settings || {}),
    heroTitle: String(settings?.heroTitle || DEFAULT_SITE_SETTINGS.heroTitle),
    heroSubtitle: String(settings?.heroSubtitle || DEFAULT_SITE_SETTINGS.heroSubtitle),
    applyButtonText: String(settings?.applyButtonText || DEFAULT_SITE_SETTINGS.applyButtonText),
    legalNotice: String(settings?.legalNotice || DEFAULT_SITE_SETTINGS.legalNotice),
    contactMessage: String(settings?.contactMessage || DEFAULT_SITE_SETTINGS.contactMessage),
    presidentPhone: String(settings?.presidentPhone || DEFAULT_SITE_SETTINGS.presidentPhone),
    staffPhone: String(settings?.staffPhone || DEFAULT_SITE_SETTINGS.staffPhone),
  };
}

export async function onRequestGet({ request, env }) {
  const authError = await requireAuth(request, env);
  if (authError) return authError;
  if (!env.THE_HUNTERS_CMS) {
    return jsonResponse({ ok: false, error: "THE_HUNTERS_CMS KV 바인딩이 없습니다." }, { status: 500 });
  }

  const [notices, activities, siteSettings, tickerItems] = await Promise.all([
    readJson(env, "notices", []),
    readJson(env, "activities", []),
    readJson(env, "siteSettings", DEFAULT_SITE_SETTINGS),
    readJson(env, "tickerItems", DEFAULT_TICKER_ITEMS),
  ]);

  return jsonResponse({
    ok: true,
    notices,
    activities,
    siteSettings: { ...DEFAULT_SITE_SETTINGS, ...(siteSettings || {}) },
    tickerItems: Array.isArray(tickerItems) ? tickerItems : DEFAULT_TICKER_ITEMS,
  });
}

export async function onRequestPut({ request, env }) {
  const authError = await requireAuth(request, env);
  if (authError) return authError;
  if (!env.THE_HUNTERS_CMS) {
    return jsonResponse({ ok: false, error: "THE_HUNTERS_CMS KV 바인딩이 없습니다." }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return jsonResponse({ ok: false, error: "저장할 데이터가 올바르지 않습니다." }, { status: 400 });
  }

  const notices = (Array.isArray(body.notices) ? body.notices : []).map(normalizeEntry);
  const activities = (Array.isArray(body.activities) ? body.activities : []).map(normalizeEntry);
  const tickerItems = (Array.isArray(body.tickerItems) ? body.tickerItems : []).map(normalizeTicker);
  const siteSettings = normalizeSettings(body.siteSettings);

  await Promise.all([
    env.THE_HUNTERS_CMS.put("notices", JSON.stringify(notices)),
    env.THE_HUNTERS_CMS.put("activities", JSON.stringify(activities)),
    env.THE_HUNTERS_CMS.put("siteSettings", JSON.stringify(siteSettings)),
    env.THE_HUNTERS_CMS.put("tickerItems", JSON.stringify(tickerItems)),
  ]);

  return jsonResponse({
    ok: true,
    notices,
    activities,
    siteSettings,
    tickerItems,
    savedAt: new Date().toISOString(),
  });
}

export function onRequest() {
  return jsonResponse({ ok: false, error: "Method not allowed" }, { status: 405 });
}
