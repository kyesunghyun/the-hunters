const CACHE_SECONDS = 300;

const DOMESTIC_INDEX_URL = "https://polling.finance.naver.com/api/realtime?query=SERVICE_INDEX:KOSPI,KOSDAQ";
const US_INDEX_ENDPOINTS = [
  { id: "SP500", name: "S&P 500", url: "https://api.stock.naver.com/index/.INX/basic" },
  { id: "NASDAQ", name: "NASDAQ", url: "https://api.stock.naver.com/index/.IXIC/basic" },
];
const EXCHANGE_URL = "https://open.er-api.com/v6/latest/USD";

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${CACHE_SECONDS}`,
      ...(init.headers || {}),
    },
  });
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json,text/plain,*/*",
      "User-Agent": "THE-HUNTERS-MarketSnapshot/1.0",
    },
    cf: {
      cacheTtl: CACHE_SECONDS,
      cacheEverything: true,
    },
  });

  if (!response.ok) {
    throw new Error(`Upstream failed: ${response.status} ${url}`);
  }

  return response.json();
}

function toNumber(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).replace(/,/g, "").trim();
  if (!normalized) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return null;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function toneFromChange(change) {
  if (!Number.isFinite(change) || change === 0) return "neutral";
  return change > 0 ? "up" : "down";
}

function formatSigned(value, suffix = "") {
  if (!Number.isFinite(value)) return null;
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value)}${suffix}`;
}

function parseDomesticItem(item) {
  const value = toNumber(item.nv) / 100;
  const change = toNumber(item.cv) / 100;
  const percent = toNumber(item.cr);

  if (!Number.isFinite(value) || !Number.isFinite(change) || !Number.isFinite(percent)) {
    return null;
  }

  return {
    id: item.cd,
    name: item.cd,
    value: formatNumber(value),
    change: formatSigned(change),
    changePercent: formatSigned(percent, "%"),
    tone: toneFromChange(change),
    meta: item.ms === "CLOSE" ? "장 마감 기준" : "장중 지연 데이터",
    source: "Naver Finance",
    trend: null,
  };
}

async function getDomesticIndices() {
  const data = await fetchJson(DOMESTIC_INDEX_URL);
  const list = data?.result?.areas?.find((area) => area.name === "SERVICE_INDEX")?.datas || [];
  const items = list.map(parseDomesticItem).filter(Boolean);

  const kospi = items.find((item) => item.id === "KOSPI");
  const kosdaq = items.find((item) => item.id === "KOSDAQ");

  if (!kospi || !kosdaq) {
    throw new Error("Domestic index data unavailable");
  }

  return [kospi, kosdaq];
}

function parseUsIndex(config, data) {
  const value = toNumber(data.closePrice);
  const change = toNumber(data.compareToPreviousClosePrice);
  const percent = toNumber(data.fluctuationsRatio);

  if (!Number.isFinite(value) || !Number.isFinite(change) || !Number.isFinite(percent)) {
    return null;
  }

  return {
    id: config.id,
    name: config.name,
    value: formatNumber(value),
    change: formatSigned(change),
    changePercent: formatSigned(percent, "%"),
    tone: toneFromChange(change),
    meta: data.delayTimeName ? `${data.delayTimeName} · ${data.stockExchangeType?.name || "US Market"}` : "해외 지수",
    source: "Naver Stock",
    tradedAt: data.localTradedAt || null,
    trend: null,
  };
}

async function getUsIndices() {
  const results = await Promise.all(
    US_INDEX_ENDPOINTS.map(async (config) => parseUsIndex(config, await fetchJson(config.url))),
  );

  if (results.some((item) => !item)) {
    throw new Error("US index data unavailable");
  }

  return results;
}

async function getUsdKrw() {
  const data = await fetchJson(EXCHANGE_URL);
  const value = toNumber(data?.rates?.KRW);

  if (data?.result !== "success" || !Number.isFinite(value)) {
    throw new Error("USD/KRW data unavailable");
  }

  return {
    id: "USDKRW",
    name: "USD/KRW",
    value: formatNumber(value),
    change: null,
    changePercent: null,
    tone: "neutral",
    meta: "일일 기준 환율 · 변동률 미제공",
    source: data.provider || "open.er-api.com",
    tradedAt: data.time_last_update_utc || null,
    trend: null,
  };
}

function buildInsight(items) {
  const positives = items.filter((item) => item.tone === "up").length;
  const negatives = items.filter((item) => item.tone === "down").length;
  const summary = positives > negatives
    ? "주요 지수는 전반적으로 우호적인 흐름을 보이고 있습니다."
    : negatives > positives
      ? "주요 지수는 일부 조정 압력이 우세합니다."
      : "시장 방향성은 혼조세입니다.";

  return {
    id: "INSIGHT",
    name: "Market Insight",
    value: positives > negatives ? "Constructive" : negatives > positives ? "Selective" : "Mixed",
    change: "Reference",
    changePercent: null,
    tone: "neutral",
    meta: `${summary} 지표는 지연될 수 있으므로 투자 판단 전 원자료를 함께 확인하세요.`,
    source: "Derived",
    trend: null,
    wide: true,
  };
}

export async function onRequestGet() {
  try {
    const [domestic, us, exchange] = await Promise.all([
      getDomesticIndices(),
      getUsIndices(),
      getUsdKrw(),
    ]);
    const items = [...domestic, ...us, exchange];

    return jsonResponse({
      ok: true,
      updatedAt: new Date().toISOString(),
      cacheSeconds: CACHE_SECONDS,
      items: [...items, buildInsight(items)],
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: "시장 정보를 불러오지 못했습니다.",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}

export function onRequest() {
  return jsonResponse({ ok: false, error: "Method not allowed" }, { status: 405 });
}
