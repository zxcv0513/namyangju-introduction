# 남양주 산책 (namyangju-introduction)

사이트: https://namyangju-introduction.xooxs0513.workers.dev

남양주의 관광 명소, 축제·행사, 카페를 소개하는 사이트. 요구사항 `PRD.md`, 화면 `DESIGN.md`, API 계약 `API.md`.

## 실행

```bash
npm install
npm run dev        # http://localhost:5173 (화면 + /api/* 를 로컬 Workers 런타임으로 함께 실행)
npm run typecheck  # tsc -b (화면·Worker·설정 3개 tsconfig)
npm run build      # 타입 검사 + 프로덕션 빌드 → dist/
npm run cf-typegen # wrangler.jsonc를 바꾼 뒤 worker-configuration.d.ts 다시 생성
```

- 테스트 프레임워크는 아직 없다.
- Node.js 22.12 이상 필요 (react-router 8은 22.22 이상).

## 구조

| 경로 | 내용 |
|---|---|
| `src/react-app/` | React 화면. `pages/`(홈·명소·축제·카페·404), `components/`(레이아웃·카드 부품), `lib/`(카페 필터·API 호출·지도 링크·페이지 메타) |
| `src/worker/` | Hono API + `robots.txt`·`sitemap.xml`. `index.ts`(진입점) → `app.ts`(라우트·오류 응답) → `cafes.ts`(데이터 검사·응답 생성) |
| `src/shared/types.ts` | 서버·화면 공통 타입, 태그 허용값 |
| `src/data/*.json` | 카페·명소·축제·도시 정보 (원본 조사 자료와 출처 메모는 `research/`) |
| `wrangler.jsonc` | Cloudflare Worker 설정. `/api/*`·`/robots.txt`·`/sitemap.xml`만 Worker 실행, 나머지는 정적 파일 |

## 배포

Cloudflare Worker `namyangju-introduction` + GitHub 연결(Workers Builds). 대시보드의 Worker 이름과 `wrangler.jsonc`의 `name`이 같아야 한다. 자세한 근거는 `API.md` 4장.
