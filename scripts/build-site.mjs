import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const siteUrl = "https://thehunters.co.kr";
const contactEmail = "contact@thehunters.co.kr";
const updatedDate = "2026-06-07";
const rawClientId = process.env.ADSENSE_CLIENT_ID || "";
const adsenseClient = rawClientId
  ? rawClientId.startsWith("ca-pub-")
    ? rawClientId
    : `ca-pub-${rawClientId}`
  : "";

const categories = [
  { id: "beginner", name: "투자 입문", intro: "투자 계좌를 처음 열기 전 알아야 할 기준과 습관을 정리합니다." },
  { id: "competition", name: "모의투자 대회 가이드", intro: "모의투자 대회를 학습 경험으로 활용하는 방법을 다룹니다." },
  { id: "analysis", name: "기업 분석 기초", intro: "사업, 재무제표, 산업 구조를 읽는 기본 틀을 제공합니다." },
  { id: "news", name: "경제 뉴스 해설", intro: "뉴스를 투자 판단 자료로 읽기 위한 맥락과 용어를 풀이합니다." },
  { id: "glossary", name: "투자 용어 사전", intro: "초보자가 자주 만나는 금융 용어를 쉬운 말로 설명합니다." },
];

const posts = [
  ["beginner", "first-portfolio-checklist", "첫 포트폴리오를 만들기 전 확인할 7가지", "2026-06-07", "목표 기간, 현금 비중, 분산 기준, 손실 허용 범위를 먼저 정하는 방법", ["투자 기간을 단기, 중기, 장기로 나누어 돈의 용도를 분리합니다.", "생활비와 비상금은 투자금과 섞지 않고 현금성 자산으로 남깁니다.", "한 종목이나 한 산업에 과도하게 의존하지 않는 분산 기준을 세웁니다."]],
  ["beginner", "risk-and-return-basics", "수익률보다 먼저 이해해야 할 위험의 의미", "2026-06-06", "변동성, 최대 낙폭, 유동성 위험을 초보자 관점에서 설명합니다.", ["위험은 손실 가능성뿐 아니라 계획을 흔드는 불확실성입니다.", "높은 기대수익은 대체로 큰 가격 변동을 동반합니다.", "투자 전에는 언제 팔아야 하는지가 아니라 왜 보유할 수 있는지를 점검합니다."]],
  ["beginner", "monthly-investing-routine", "초보자를 위한 월간 투자 점검 루틴", "2026-06-05", "월 1회 시장과 보유 자산을 점검하는 실전형 학습 루틴", ["매일 가격을 보는 대신 정해진 날짜에 기록을 남깁니다.", "뉴스보다 기업의 실적과 현금흐름 변화를 먼저 확인합니다.", "매수와 매도 이유를 한 문장으로 남겨 다음 판단의 근거로 활용합니다."]],
  ["competition", "mock-investing-rules", "모의투자 대회 규칙을 읽을 때 봐야 할 항목", "2026-06-04", "대회 기간, 거래 가능 상품, 수수료 반영 방식이 결과에 주는 영향", ["수익률 산정 기간과 기준가가 결과를 크게 바꿀 수 있습니다.", "거래 제한, 미수 사용 가능 여부, 수수료 반영 방식을 먼저 읽습니다.", "순위 경쟁보다 매매 기록과 복기 자료를 남기는 것이 학습에 유리합니다."]],
  ["competition", "mock-investing-journal", "모의투자 매매일지를 쓰는 간단한 양식", "2026-06-03", "진입 이유, 예상 시나리오, 복기 질문으로 구성하는 기록법", ["매수 전 가설과 확인할 지표를 적어 즉흥 매매를 줄입니다.", "거래 후에는 결과보다 판단 과정이 일관됐는지 검토합니다.", "실패 사례를 유형별로 묶으면 다음 대회 전략이 선명해집니다."]],
  ["competition", "team-study-method", "팀 단위 모의투자 스터디 운영법", "2026-06-02", "역할 분담과 발표 자료 구성으로 대회 경험을 콘텐츠화하는 법", ["산업 조사, 재무 확인, 뉴스 정리를 역할별로 나누면 누락이 줄어듭니다.", "찬성 의견과 반대 의견을 함께 발표해 편향을 낮춥니다.", "대회 종료 후에는 성과보다 학습 산출물을 정리합니다."]],
  ["analysis", "business-model-reading", "기업의 비즈니스 모델을 읽는 첫 단계", "2026-06-01", "무엇을 팔고, 누구에게 팔며, 어떻게 이익을 남기는지 확인하는 법", ["매출이 어디에서 발생하는지 사업 부문별로 나누어 봅니다.", "고객, 가격 결정력, 반복 매출 여부는 안정성을 판단하는 단서입니다.", "좋은 제품과 좋은 투자가 항상 같은 뜻은 아니라는 점을 구분합니다."]],
  ["analysis", "financial-statements-basics", "손익계산서와 현금흐름표를 함께 봐야 하는 이유", "2026-05-31", "이익과 현금의 차이를 이해하고 재무제표를 입체적으로 읽는 기초", ["회계상 이익이 늘어도 현금 유입이 약하면 점검이 필요합니다.", "영업활동 현금흐름은 본업의 현금 창출력을 살피는 출발점입니다.", "일회성 이익과 반복 가능한 이익을 구분해야 합니다."]],
  ["analysis", "industry-competition-map", "산업 경쟁 구도를 그리는 방법", "2026-05-30", "경쟁사, 공급자, 고객, 대체재를 표로 정리하는 초보자용 프레임", ["기업은 혼자 성장하지 않고 산업의 규칙 안에서 움직입니다.", "원재료 가격, 고객 집중도, 신규 진입 가능성은 수익성에 영향을 줍니다.", "산업 지도를 만들면 기업 뉴스의 중요도를 판단하기 쉬워집니다."]],
  ["news", "interest-rate-news", "금리 뉴스가 주식시장에 영향을 주는 과정", "2026-05-29", "할인율, 자금 조달 비용, 투자 심리가 연결되는 흐름", ["금리가 변하면 기업의 자금 조달 비용과 투자자 기대수익률이 달라집니다.", "성장주의 가치평가는 먼 미래 이익에 민감해 금리 변화에 크게 반응할 수 있습니다.", "뉴스 제목보다 시장이 이미 예상했는지를 함께 봐야 합니다."]],
  ["news", "exchange-rate-basics", "환율 상승과 하락을 뉴스에서 읽는 법", "2026-05-28", "수출기업, 수입물가, 해외투자 성과에 미치는 기본 영향", ["환율은 한 나라 돈의 가격이며 무역과 투자 흐름을 반영합니다.", "수출기업과 수입기업은 같은 환율 변화에도 다른 영향을 받을 수 있습니다.", "해외자산 투자자는 원화 기준 수익률과 현지 통화 수익률을 구분해야 합니다."]],
  ["news", "earnings-season-guide", "실적 시즌 기사에서 확인할 핵심 문장", "2026-05-27", "매출, 영업이익, 가이던스, 컨센서스라는 키워드 해설", ["실적 발표는 과거 성과와 미래 전망이 함께 제시되는 시기입니다.", "시장 예상치와 실제 발표치의 차이가 단기 가격 변동을 만들 수 있습니다.", "일회성 비용이나 환율 효과를 제외한 본업 흐름을 확인합니다."]],
  ["glossary", "per-pbr-roe", "PER, PBR, ROE를 한 번에 이해하기", "2026-05-26", "대표 가치평가 지표의 의미와 한계를 초보자 관점에서 정리", ["PER은 이익 대비 주가 수준을, PBR은 순자산 대비 주가 수준을 봅니다.", "ROE는 자기자본으로 얼마나 효율적으로 이익을 냈는지 보여줍니다.", "지표는 업종과 성장 단계에 따라 해석 기준이 달라집니다."]],
  ["glossary", "dividend-yield", "배당수익률을 볼 때 주의할 점", "2026-05-25", "높은 배당률만 보고 판단하면 안 되는 이유", ["배당수익률은 주가 대비 배당금의 비율입니다.", "주가가 급락하면 배당수익률이 일시적으로 높아 보일 수 있습니다.", "배당의 지속 가능성은 이익, 현금흐름, 배당 정책을 함께 봐야 합니다."]],
  ["glossary", "etf-index-fund", "ETF와 인덱스 펀드의 차이", "2026-05-24", "분산투자 상품을 이해하기 위한 기본 개념", ["ETF는 거래소에서 주식처럼 매매되는 펀드입니다.", "인덱스 펀드는 특정 지수를 따라가도록 설계된 상품을 넓게 부르는 말입니다.", "보수, 추적오차, 거래량, 구성종목을 확인하는 습관이 필요합니다."]],
].map(([category, slug, title, date, summary, points]) => ({ category, slug, title, date, summary, points }));

const categoryById = Object.fromEntries(categories.map((category) => [category.id, category]));
const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

function bodyFor(post) {
  const category = categoryById[post.category].name;
  return [
    `${post.title}는 ${category} 단계의 학습자가 투자 판단을 더 차분하게 정리하도록 돕기 위한 글입니다. 투자를 처음 시작하면 가격 변동과 뉴스 속도에 쉽게 끌려가지만, 실제로 오래 도움이 되는 것은 자신이 이해한 범위 안에서 기준을 만들고 기록을 남기는 습관입니다. 이 글은 특정 종목이나 상품을 고르기 위한 답안지가 아니라, 스스로 질문을 만들고 자료를 확인하는 순서를 제안합니다.`,
    `${post.points[0]} ${post.points[1]} ${post.points[2]} 이 세 가지를 표로 적어 보면 막연한 감정과 확인 가능한 사실을 분리할 수 있습니다. 예를 들어 같은 가격 하락이라도 실적 전망이 훼손된 경우와 시장 전체의 변동성이 커진 경우는 다르게 해석해야 합니다. 초보자에게 중요한 것은 빠르게 결론을 내리는 능력보다 결론을 미루고 근거를 확인하는 태도입니다.`,
    `실전에서는 먼저 투자 목적을 적고, 그 목적에 맞는 기간과 감내 가능한 손실 폭을 정합니다. 다음으로 기업 공시, 재무제표, 거래소 자료, 신뢰할 수 있는 경제 통계처럼 출처가 확인되는 자료를 우선 읽습니다. 커뮤니티의 의견이나 짧은 영상은 아이디어를 얻는 데 도움이 될 수 있지만, 최종 판단의 근거로 사용하려면 반드시 원자료와 대조해야 합니다. 특히 성과를 확정적으로 말하거나 특정 행동을 재촉하는 표현은 교육 자료로 보기 어렵습니다.`,
    `마지막으로 복기 과정을 남겨야 합니다. 매수 또는 관찰을 시작한 이유, 예상과 달라졌을 때 확인할 조건, 다음 점검일을 기록하면 결과가 좋지 않았을 때도 배울 수 있는 정보가 생깁니다. THE HUNTERS의 콘텐츠는 투자 입문자가 금융 문해력을 높이고 토론의 질을 개선하도록 돕는 데 목적이 있습니다. 본 콘텐츠는 투자 권유가 아닌 교육 목적의 정보입니다.`,
  ];
}

function meta(title, description, robots = "index,follow", canonicalPath = "/") {
  const adsScript = adsenseClient
    ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${escapeHtml(adsenseClient)}" crossorigin="anonymous"></script>`
    : "";
  return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="robots" content="${robots}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:type" content="website">
    <meta property="og:image" content="/logo3.png">
    <meta property="og:site_name" content="THE HUNTERS">
    <link rel="canonical" href="${siteUrl}${canonicalPath}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Grandiflora+One&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/styles.css">
    ${adsScript}`;
}

function nav() {
  return `<nav><div class="nav-inner"><a class="brand" href="/">THE HUNTERS</a><div class="nav-links"><a href="/">HOME</a><a href="/about">ABOUT</a><a href="/contents">CONTENTS</a><a href="/market.html">MARKET</a><a href="/qa.html">Q&A</a><a href="/contact">CONTACT</a></div></div></nav>`;
}

function footer() {
  return `<footer class="site-footer"><div><strong>THE HUNTERS</strong><p>투자 입문자를 위한 교육형 금융 콘텐츠 플랫폼입니다. 모든 콘텐츠는 정보 제공 및 교육 목적이며 투자 권유가 아닙니다.</p></div><div class="footer-links"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/disclaimer">Disclaimer</a><a href="/contact">Contact</a></div></footer><script src="/header-scroll.js"></script>`;
}

function adSlot(name) {
  if (!adsenseClient) return `<aside class="ad-slot" aria-label="${name} 광고 영역"><span>광고</span></aside>`;
  return `<aside class="ad-slot" aria-label="${name} 광고 영역"><span>Sponsored</span><ins class="adsbygoogle" style="display:block" data-ad-client="${escapeHtml(adsenseClient)}" data-ad-slot="" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></aside>`;
}

function thumb(title, category) {
  return `<div class="thumb" role="img" aria-label="${escapeHtml(category)} 썸네일"><span>${escapeHtml(title)}</span></div>`;
}

function page(title, description, main, robots = "index,follow", canonicalPath = "/") {
  return `<!DOCTYPE html><html lang="ko"><head>${meta(title, description, robots, canonicalPath)}</head><body>${nav()}${main}${footer()}</body></html>`;
}

function homePage() {
  const latest = posts.slice(0, 4);
  return page(
    "THE HUNTERS | 투자 입문자를 위한 금융 콘텐츠 플랫폼",
    "THE HUNTERS는 투자 입문자를 위한 교육형 금융 콘텐츠, 시장 해설, 모의투자 학습 자료를 제공하는 대학생 투자 커뮤니티입니다.",
    `<main class="site-main"><section class="home-hero"><div class="hero-copy"><p class="kicker">Financial Education Platform</p><h1>THE HUNTERS</h1><p class="lead">투자 입문자가 시장을 더 안전하고 비판적으로 이해하도록 돕는 교육형 금융 콘텐츠 플랫폼입니다.</p><div class="actions"><a class="btn" href="/contents">콘텐츠 읽기</a><a class="btn" href="/about">운영 목적 보기</a></div></div><img class="hero-emblem" src="/logo3.png" alt="THE HUNTERS 로고" loading="eager"></section><section class="content-band"><div class="section-head"><p class="kicker">Latest Contents</p><h2>최근 교육 콘텐츠</h2></div><div class="post-grid">${latest.map(card).join("")}</div></section><section class="content-band two-col"><article><h2>운영 원칙</h2><p>THE HUNTERS는 특정 종목 매매 지시, 투자 리딩, 성과 보장성 표현을 제공하지 않습니다. 콘텐츠는 금융 문해력 향상과 토론 자료 제공에 목적이 있습니다.</p></article><article><h2>시장 정보</h2><p>시장 페이지는 주요 지표를 확인하는 참고 화면이며, 투자 결정을 대신하지 않습니다. 수치와 뉴스는 원자료 확인과 함께 해석해야 합니다.</p></article></section></main>`,
    "index,follow",
    "/",
  );
}

function card(post) {
  const category = categoryById[post.category].name;
  return `<article class="post-card">${thumb(post.title, category)}<div class="post-card-body"><p class="meta">${escapeHtml(category)} · ${post.date}</p><h3><a href="/contents/${post.slug}/">${escapeHtml(post.title)}</a></h3><p>${escapeHtml(post.summary)}</p></div></article>`;
}

function contentsPage() {
  return page(
    "CONTENTS | THE HUNTERS",
    "투자 입문, 모의투자 대회, 기업 분석, 경제 뉴스, 투자 용어 콘텐츠를 확인하세요.",
    `<main class="site-main"><section class="page-hero"><p class="kicker">Contents</p><h1>금융 학습 콘텐츠</h1><p class="lead">투자 입문자가 스스로 판단 기준을 세우도록 돕는 교육 목적의 글을 카테고리별로 제공합니다.</p></section>${categories.map((category) => `<section class="content-band" id="${category.id}"><div class="section-head"><p class="kicker">${escapeHtml(category.name)}</p><h2>${escapeHtml(category.name)}</h2><p>${escapeHtml(category.intro)}</p></div><div class="post-grid">${posts.filter((post) => post.category === category.id).map(card).join("")}</div></section>`).join("")}</main>`,
    "index,follow",
    "/contents/",
  );
}

function articlePage(post) {
  const category = categoryById[post.category].name;
  const paragraphs = bodyFor(post);
  const related = posts.filter((item) => item.category === post.category && item.slug !== post.slug).slice(0, 3);
  return page(
    `${post.title} | THE HUNTERS`,
    post.summary,
    `<main class="site-main article-layout"><article class="article-main"><header class="article-header"><p class="kicker">${escapeHtml(category)}</p><h1>${escapeHtml(post.title)}</h1><p class="article-meta">${post.date} · ${escapeHtml(category)}</p>${thumb(post.title, category)}</header>${paragraphs.slice(0, 2).map((p) => `<p>${escapeHtml(p)}</p>`).join("")}${adSlot("본문 중간")} ${paragraphs.slice(2).map((p) => `<p>${escapeHtml(p)}</p>`).join("")}<p class="disclaimer-note">본 콘텐츠는 투자 권유가 아닌 교육 목적의 정보입니다.</p>${adSlot("본문 하단")}<section class="related"><h2>관련 글</h2><div class="post-grid small">${related.map(card).join("")}</div></section></article><aside class="article-sidebar"><section><h2>콘텐츠 원칙</h2><p>THE HUNTERS는 투자 판단을 대신하지 않으며, 원자료 확인과 개인의 위험 감내 수준 점검을 권장합니다.</p></section>${adSlot("사이드바")}</aside></main>`,
    "index,follow",
    `/contents/${post.slug}/`,
  );
}

function aboutPage() {
  return page("ABOUT | THE HUNTERS", "THE HUNTERS의 운영 목적, 활동 내용, 콘텐츠 원칙을 소개합니다.", `<main class="site-main narrow"><section class="page-hero"><p class="kicker">About</p><h1>THE HUNTERS 소개</h1><p class="lead">THE HUNTERS는 대학생과 투자 입문자가 금융 지식을 체계적으로 익히고 토론할 수 있도록 운영되는 교육 중심 커뮤니티입니다.</p></section><section class="prose"><h2>운영 목적</h2><p>투자 경험이 적은 사람이 과장된 정보나 단기 성과 중심의 메시지에 흔들리지 않도록 기본 개념, 분석 방법, 시장 해석 프레임을 제공합니다.</p><h2>활동 내용</h2><p>정기 스터디, 모의투자 대회 복기, 기업 분석 발표, 경제 뉴스 읽기, 투자 용어 학습 자료 제작을 중심으로 활동합니다.</p><h2>운영 원칙</h2><p>특정 종목 매수나 매도를 지시하지 않으며 확정적 결과를 약속하지 않습니다. 모든 자료는 교육 목적의 정보로 제공됩니다.</p></section></main>`, "index,follow", "/about/");
}

function contactPage() {
  return page("CONTACT | THE HUNTERS", "THE HUNTERS 문의 이메일, 문의 양식, 운영자 연락 안내 페이지입니다.", `<main class="site-main narrow"><section class="page-hero"><p class="kicker">Contact</p><h1>문의</h1><p class="lead">콘텐츠, 운영, 개인정보 관련 문의는 아래 이메일 또는 문의 양식을 이용해 주세요.</p></section><section class="contact-grid"><article><h2>운영자 연락 안내</h2><p>이메일: <a href="mailto:${contactEmail}">${contactEmail}</a></p><p>문의 내용에 개인정보가 포함될 수 있는 경우 공개 댓글이나 외부 게시판 대신 Q&A 비밀글 또는 이메일을 사용해 주세요.</p><a class="btn" href="/qa.html">Q&A 비밀글 작성</a></article><form class="contact-form" action="mailto:${contactEmail}" method="post" enctype="text/plain"><label for="name">이름</label><input id="name" name="name" autocomplete="name" required><label for="email">이메일</label><input id="email" name="email" type="email" autocomplete="email" required><label for="message">문의 내용</label><textarea id="message" name="message" required></textarea><button type="submit">문의 보내기</button></form></section></main>`, "index,follow", "/contact/");
}

function legalPage(slug, title, description, sections) {
  return page(`${title} | THE HUNTERS`, description, `<main class="site-main narrow"><section class="page-hero"><p class="kicker">Policy</p><h1>${title}</h1><p class="lead">${description}</p></section><section class="prose">${sections.map(([h, p]) => `<h2>${h}</h2><p>${p}</p>`).join("")}<p class="meta">시행일: ${updatedDate}</p></section></main>`, "index,follow", `/${slug}/`);
}

const legal = {
  privacy: legalPage("privacy", "개인정보처리방침", "THE HUNTERS가 수집하는 개인정보와 처리 기준을 안내합니다.", [["수집 항목", "문의 및 Q&A 운영을 위해 이름 또는 닉네임, 이메일, 연락처, 문의 내용, 비밀번호 해시, 조회 코드를 수집할 수 있습니다."], ["이용 목적", "문의 확인, 답변 제공, 지원 절차 안내, 서비스 운영 안정성 확보를 위해 사용합니다."], ["보유 기간", "목적 달성 후 지체 없이 파기하며, 관련 법령 또는 분쟁 대응에 필요한 경우 필요한 기간 동안 보관할 수 있습니다."], ["제3자 제공", "법령상 요구 또는 이용자 동의가 있는 경우를 제외하고 개인정보를 외부에 제공하지 않습니다."], ["문의", `개인정보 관련 문의는 ${contactEmail}로 연락해 주세요.`]]),
  terms: legalPage("terms", "이용약관", "THE HUNTERS 웹사이트 이용 기준과 책임 범위를 안내합니다.", [["서비스 성격", "본 사이트는 금융 교육 콘텐츠와 커뮤니티 운영 정보를 제공하는 웹사이트입니다."], ["이용자 의무", "이용자는 타인의 권리를 침해하거나 허위 정보를 입력하거나 불법적인 목적으로 서비스를 이용해서는 안 됩니다."], ["콘텐츠 이용", "사이트의 글과 이미지는 교육 목적의 참고 자료이며 무단 복제와 상업적 재배포를 제한합니다."], ["서비스 변경", "운영 상황에 따라 콘텐츠, 메뉴, 기능이 변경될 수 있습니다."]]),
  disclaimer: legalPage("disclaimer", "투자 관련 면책 고지", "THE HUNTERS 콘텐츠의 교육 목적과 투자 판단 책임 범위를 명확히 안내합니다.", [["교육 목적", "본 사이트의 모든 금융 콘텐츠는 투자 권유가 아닌 교육 목적의 정보입니다."], ["투자 판단", "투자 결정과 그 결과는 이용자 본인의 책임이며, 콘텐츠는 특정 종목이나 상품의 매수 또는 매도를 지시하지 않습니다."], ["성과 보장 배제", "THE HUNTERS는 수익률, 원금 보전, 특정 결과를 보장하지 않습니다."], ["자료 확인", "콘텐츠 작성 시 신뢰 가능한 자료를 참고하지만, 이용자는 공시와 공식 통계 등 원자료를 직접 확인해야 합니다."]]),
};

async function write(relative, html) {
  const file = path.join(root, relative);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${html}\n`, "utf8");
}

async function main() {
  await write("index.html", homePage());
  await write("contents/index.html", contentsPage());
  await write("contents.html", contentsPage());
  for (const post of posts) await write(`contents/${post.slug}/index.html`, articlePage(post));
  await write("about/index.html", aboutPage());
  await write("about.html", aboutPage());
  await write("contact/index.html", contactPage());
  await write("contact.html", contactPage());
  await write("privacy/index.html", legal.privacy);
  await write("privacy.html", legal.privacy);
  await write("terms/index.html", legal.terms);
  await write("terms.html", legal.terms);
  await write("disclaimer/index.html", legal.disclaimer);
  await write("disclaimer.html", legal.disclaimer);
  const urls = ["/", "/about/", "/contents/", "/market.html", "/contact/", "/privacy/", "/terms/", "/disclaimer/", ...posts.map((post) => `/contents/${post.slug}/`)];
  await write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${siteUrl}${url}</loc><lastmod>${updatedDate}</lastmod></url>`).join("")}</urlset>`);
  await write("robots.txt", `User-agent: *\nAllow: /\nDisallow: /qa.html\nDisallow: /admin-secret.html\nDisallow: /api/qa\nDisallow: /api/admin\nSitemap: ${siteUrl}/sitemap.xml\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
