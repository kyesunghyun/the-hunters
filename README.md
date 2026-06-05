# the-hunters

## Cloudflare Pages Functions

### `/api/apply`

가입폼 데이터를 Google Apps Script Web App으로 전달합니다.

Environment variable:

- `GOOGLE_SCRIPT_URL`: Google Apps Script Web App `/exec` URL. 코드에는 fallback URL이 있지만, 운영에서는 Cloudflare Pages secret으로 설정하는 것을 권장합니다.

### `/api/market`

홈페이지의 Market Snapshot 데이터를 서버 측에서 가져와 반환합니다. 브라우저는 외부 금융 API를 직접 호출하지 않고 `/api/market`만 호출합니다.

Current data sources:

- KOSPI, KOSDAQ: Naver Finance realtime JSON
- S&P 500, NASDAQ: Naver Stock index JSON
- USD/KRW: open.er-api.com free exchange-rate API

현재 구현은 API key 없이 동작합니다. 외부 API 제한이나 정책 변경에 대비해 실제 운영에서 유료/공식 API로 교체할 경우 아래 환경변수를 Cloudflare Pages secret으로 추가해 `functions/api/market.js`에서만 사용하세요.

- `MARKET_API_KEY`: 지수 데이터 제공 API key
- `EXCHANGE_API_KEY`: 환율 데이터 제공 API key

시장 데이터 응답은 5분 캐시를 사용합니다.
