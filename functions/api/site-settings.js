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
      "Cache-Control": "public, max-age=120",
      ...(init.headers || {}),
    },
  });
}

async function readJson(env, key, fallback) {
  if (!env.THE_HUNTERS_CMS) return fallback;
  const value = await env.THE_HUNTERS_CMS.get(key, "json");
  return value ?? fallback;
}

function normalizeTickerItems(items) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => item && item.visible !== false && String(item.text || "").trim())
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .map((item) => ({
      id: String(item.id || crypto.randomUUID()),
      text: String(item.text || "").trim(),
      visible: item.visible !== false,
      order: Number(item.order || 0),
    }));
}

export async function onRequestGet({ env }) {
  try {
    const [siteSettings, tickerItems] = await Promise.all([
      readJson(env, "siteSettings", DEFAULT_SITE_SETTINGS),
      readJson(env, "tickerItems", DEFAULT_TICKER_ITEMS),
    ]);

    return jsonResponse({
      ok: true,
      siteSettings: { ...DEFAULT_SITE_SETTINGS, ...(siteSettings || {}) },
      tickerItems: normalizeTickerItems(tickerItems),
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: "사이트 설정을 불러오지 못했습니다.",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export function onRequest() {
  return jsonResponse({ ok: false, error: "Method not allowed" }, { status: 405 });
}
