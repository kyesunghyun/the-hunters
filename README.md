# the-hunters

## Cloudflare Pages Functions

### Hidden admin CMS

관리자 페이지는 홈페이지 링크에 노출하지 않습니다. 직접 아래 경로로 접속합니다.

- `/admin-secret.html`

로그인은 Cloudflare Pages 환경변수 `ADMIN_PASSWORD`로 검증합니다. 비밀번호는 코드에 저장하지 않습니다.

관리자에서 수정 가능한 항목:

- 공지사항: 제목, 날짜, 요약, 링크, 상단고정, 공개여부
- 활동기록: 제목, 날짜, 요약, 링크, 상단고정, 공개여부
- 연락처: 문의 안내 문구, 회장 연락처, 운영진 연락처
- 뉴스티커: 문구, 공개여부, 순서
- 메인문구: 메인 제목, 서브 카피, 지원 버튼 문구, 지원자 유의사항 문구

Cloudflare 설정:

1. Cloudflare Dashboard > Workers & Pages > KV > Create namespace
2. namespace 이름 예시: `THE_HUNTERS_CMS`
3. Pages 프로젝트 `the-hunters` > Settings > Functions > KV namespace bindings
4. Add binding:
   - Variable name: `THE_HUNTERS_CMS`
   - KV namespace: 방금 만든 namespace
5. Pages 프로젝트 > Settings > Environment variables 또는 Variables and Secrets
6. Production 환경에 secret 추가:
   - `ADMIN_PASSWORD`: 관리자 로그인 비밀번호
7. 저장 후 재배포

KV keys:

- `notices`
- `activities`
- `siteSettings`
- `tickerItems`

배포 후 테스트:

1. `/admin-secret.html` 접속
2. `ADMIN_PASSWORD`로 로그인
3. 연락처나 티커 문구를 수정하고 전체 저장
4. 홈페이지를 새로고침해 반영 확인
5. 공개 API 확인:
   - `/api/site-settings`
   - `/api/notices`

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
