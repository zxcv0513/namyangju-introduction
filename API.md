# 남양주 소개 사이트 API 계약

- 버전: v1.0 (2026-11-17 사용자 승인)
- 기준 문서: `PRD.md` v1.1 (FR-13, FR-14), `DESIGN.md`
- 구현: `src/worker/app.ts`, `src/worker/cafes.ts`, 타입 `src/shared/types.ts`
- 서버: Hono (Cloudflare에서 실행 — 배포 방식은 3장)

## 1. `GET /api/cafes` (FR-13)

카페 전체 목록을 돌려준다. 필터·검색·정렬은 화면(클라이언트)에서 한다 (PRD FR-13 가정: 수십 곳 규모).

**요청**
- 쿼리 파라미터 없음. 알 수 없는 파라미터는 무시한다.

**성공 응답 — `200 OK`**
- 헤더: `Content-Type: application/json` (JSON은 UTF-8이 기본이라 charset을 붙이지 않음 — RFC 8259 11장), `Cache-Control: public, max-age=300` (5분 캐시)

```json
{
  "cafes": [
    {
      "id": "string (영문 kebab-case, 고유)",
      "name": "string",
      "region": "string (읍·면·동)",
      "address": "string (도로명 주소)",
      "tags": ["강뷰"],
      "description": "string",
      "image": null,
      "sources": [{ "title": "string", "url": "https://..." }],
      "verifiedAt": "YYYY-MM-DD"
    }
  ],
  "regions": ["string (데이터에 있는 지역, 가나다순, 중복 없음)"],
  "tags": ["string (데이터에 있는 태그, 정해진 순서, 중복 없음)"],
  "verifiedAt": "YYYY-MM-DD (항목 중 가장 오래된 확인일, 카페 0곳이면 null)"
}
```

- `image`: 이번 버전은 항상 `null`. 나중에 저작권 확인된 이미지가 생기면 `{ "src": "string", "alt": "string", "credit": "string" }`.
- `tags` 순서와 허용값: `강뷰`, `호수·저수지뷰`, `대형카페`, `베이커리`, `정원`, `반려견 동반`, `루프탑`, `산·계곡뷰` (데이터에 쓰인 것만 내려감).
- 카페가 0곳이면 `cafes: []`, `regions: []`, `tags: []`, `verifiedAt: null` 로 `200`.
- 데이터 파일 형식이 틀리면(필수 필드 없음, 허용 안 된 태그, id 중복 등) 잘못된 정보를 내보내지 않고 `500`.

**오류 응답**

| 상황 | 상태 코드 | 본문 |
|---|---|---|
| 서버 내부 오류 (데이터 읽기 실패 등) | `500` | `{ "error": { "code": "INTERNAL_ERROR", "message": "카페 정보를 불러오지 못했어요." } }` |
| GET 외 메서드 | `405` | `{ "error": { "code": "METHOD_NOT_ALLOWED", "message": "허용되지 않은 요청이에요." } }` (헤더 `Allow: GET`) |
| `/api/` 아래 없는 경로 | `404` | `{ "error": { "code": "NOT_FOUND", "message": "요청한 API가 없어요." } }` |

- 오류 본문에 내부 정보(스택, 파일 경로)를 넣지 않는다.

**화면 쪽 처리 (FR-14)**
- 요청 제한 시간 10초 **[제안]**. 넘으면 실패로 처리.
- 네트워크 오류·시간 초과·`2xx`가 아닌 응답·JSON 형식 불일치는 모두 "불러오기 실패" 화면(DESIGN S4)으로 처리하고 [다시 시도]로 재요청한다.
- 응답은 신뢰 경계로 보고 필수 필드를 확인한다. 필드가 빠진 카페 항목은 건너뛴다.

## 2. 검색엔진 안내 파일 (PRD FR-16)

- `GET /robots.txt` → `200 text/plain`. 모두 허용 + `Sitemap: {요청 주소}/sitemap.xml`
- `GET /sitemap.xml` → `200 application/xml`. 4개 주소(`src/shared/types.ts`의 `SITE_PATHS`)
- 배포 주소가 정해지지 않아 Worker가 요청 주소(origin)로 절대 URL을 만든다. 두 경로는 `wrangler.jsonc`의 `run_worker_first`에 포함. 캐시 1시간.

## 3. 데이터 저장

- 카페 데이터의 원본은 저장소 안 JSON 파일(`src/data/cafes.json` 예정)이다. Hono가 빌드 시 함께 묶어 응답한다. DB 없음 (PRD 6장: 관리자 화면 제외, JSON으로 관리).
- 명소·축제·도시 정보는 API 없이 화면 코드에 포함되는 정적 JSON (DESIGN 2장).
- 공통 타입은 서버·화면이 같은 TypeScript 타입 파일을 쓴다.

## 4. 배포 방식

**Cloudflare Workers + Static Assets 한 프로젝트, GitHub 연결은 Workers Builds** **[제안]**

근거 (2026-11-17 공식 문서 확인):
- Cloudflare는 새 프로젝트에 Pages 대신 Workers를 권장 — https://developers.cloudflare.com/workers/best-practices/workers-best-practices/ ("If you are starting a new project, use Workers instead of Pages."), Pages 문서 첫 화면 https://developers.cloudflare.com/pages/ , Hono 문서 https://hono.dev/docs/getting-started/cloudflare-pages 도 같은 안내. Pages는 폐지가 아니라 계속 지원.
- GitHub push 시 자동 배포: Workers Builds — https://developers.cloudflare.com/workers/ci-cd/builds/

구성:
- 시작점: Cloudflare 공식 템플릿 `cloudflare/templates/vite-react-template` (React + Vite + Hono + `@cloudflare/vite-plugin`) 구조를 따르고 버전만 올린다.
- `compatibility_date`: `2026-11-08` — 고정한 wrangler 4.156.2의 로컬 런타임이 지원하는 최신 날짜 (2026-11-17로 두면 로컬 실행 실패를 확인함). wrangler를 올릴 때 함께 올린다.
- `wrangler.jsonc`의 `assets`:
  - `"not_found_handling": "single-page-application"` — 어느 주소에서 새로고침해도 화면이 열림
  - `"run_worker_first": ["/api/*", "/robots.txt", "/sitemap.xml"]` — 이 경로만 Hono로 보내고 나머지는 정적 파일로 바로 응답 (https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)
- 무료 플랜 한도: Worker 요청 하루 100,000회(정적 파일 요청은 무료·무제한), 빌드 월 3,000분 (https://developers.cloudflare.com/workers/platform/limits/ , https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/)
- 대시보드의 Worker 이름과 `wrangler.jsonc`의 `name`이 같아야 빌드가 성공한다 (Workers Builds 문서).
- 사용자가 Cloudflare에 `namyangju-introduction` 프로젝트를 만들어 둠(2026-11-17) → `wrangler.jsonc`의 `name`은 `"namyangju-introduction"`으로 한다. 사용자 확인 결과 **Worker** (2026-11-17).

패키지 버전 (공개 2주 이상 지난 최신, `npm view`로 2026-11-17 확인):
| 패키지 | 버전 |
|---|---|
| react / react-dom | 19.3.1 |
| react-router | 8.5.1 |
| vite | 8.3.5 |
| @vitejs/plugin-react | 6.2.1 |
| tailwindcss / @tailwindcss/vite | 4.3.4 |
| hono | 4.13.16 |
| wrangler | 4.156.2 |
| @cloudflare/vite-plugin | 1.67.0 |
| typescript | 5.9.3 **[제안]** — 7.0.2가 최신이지만 Vite·Wrangler와의 호환을 확인한 문서가 없어, 공식 템플릿이 쓰는 5.9로 시작 |

Workers Builds 설정 (2026-11-17 공식 문서 확인 — https://developers.cloudflare.com/workers/ci-cd/builds/configuration/ , …/build-image/ , …/git-integration/):
| 항목 | 값 |
|---|---|
| 연결 경로 | 대시보드 Workers & Pages → `namyangju-introduction` → Settings → Builds → Connect |
| Root directory | 비움 (저장소 루트) |
| Production branch | `main` |
| Build command | `npm run build` (`tsc -b && vite build` → `dist/namyangju_introduction/wrangler.json` 생성) |
| Deploy command | `npx wrangler deploy` (기본값. Vite 플러그인 v1의 빌드 결과 설정을 자동 사용) |
| Node | `.node-version` = `24` (빌드 이미지 기본 24.22.1, react-router 8의 `>=22.22.0` 충족) |

- 빌드 서버 기본 npm은 10.9.2 (로컬은 11.20.0). `package-lock.json`은 lockfileVersion 3이라 둘 다 읽을 수 있다(추론). npm 11의 설치 스크립트 차단 경고는 npm 10에서는 해당 없음(추론) — 첫 빌드 로그로 확인.
- Vite 플러그인 v2(베타)로 올리면 `wrangler deploy`로 배포할 수 없어 deploy command도 바꿔야 한다 (https://developers.cloudflare.com/workers/vite-plugin/v2-beta/).
- 문서의 "Vite+"는 선택 도구 모음이며 현재 방식(v1 플러그인)은 안정판으로 계속 지원 (https://developers.cloudflare.com/workers/vite-plugin/vite-plus/).
