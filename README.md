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
- Q&A 관리: 질문 확인, 답변 작성/수정, 공개여부 변경, 삭제

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
- `qaItems`

배포 후 테스트:

1. `/admin-secret.html` 접속
2. `ADMIN_PASSWORD`로 로그인
3. 연락처나 티커 문구를 수정하고 전체 저장
4. 홈페이지를 새로고침해 반영 확인
5. 공개 API 확인:
   - `/api/site-settings`
   - `/api/notices`

### Q&A board

공개 Q&A 게시판은 아래 경로에서만 질문 작성폼을 제공합니다.

- `/qa.html`

홈페이지에는 Q&A 게시판으로 이동하는 링크만 노출하고, 질문 작성폼은 메인 화면에 직접 노출하지 않습니다.

비밀글 구조:

- 질문 등록 시 이름 또는 닉네임, 비밀번호, 제목, 질문 내용, 개인정보 동의를 받습니다.
- 질문 비밀번호는 평문 저장하지 않고 salt와 함께 SHA-256 해시로 저장합니다.
- 공개 목록 API `/api/qa`는 제목, 날짜, 마스킹된 이름, 답변상태, 비밀글 여부만 반환합니다.
- 질문 내용과 답변은 `/api/qa/:id/verify`에서 비밀번호가 맞을 때만 반환합니다.
- 관리자 답변은 `/admin-secret.html`의 `Q&A 관리` 탭에서 작성합니다.

Q&A APIs:

- `GET /api/qa`: 공개 질문 목록
- `POST /api/qa`: 새 질문 등록
- `POST /api/qa/:id/verify`: 작성자 비밀번호 검증 후 상세 반환
- `GET /api/admin/qa`: 관리자 전체 질문 조회
- `PUT /api/admin/qa/:id`: 답변/공개여부/답변상태 수정
- `DELETE /api/admin/qa/:id`: 질문 삭제

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
