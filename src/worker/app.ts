import { Hono } from "hono";
import type { Context } from "hono";
import { SITE_PATHS } from "../shared/types.ts";
import type { ApiErrorCode, ApiErrorResponse } from "../shared/types.ts";
import { buildCafesResponse } from "./cafes.ts";

const errorBody = (code: ApiErrorCode, message: string): ApiErrorResponse => ({
  error: { code, message },
});

/**
 * 데이터 읽기를 주입받아 앱을 만든다.
 * 실제 배포는 index.ts에서 cafes.json을 넘기고, 검증 스크립트는 깨진 데이터를 넘겨 500을 확인한다.
 */
export function createApp(loadCafes: () => unknown) {
  const app = new Hono();

  app.get("/api/cafes", (c) => {
    const body = buildCafesResponse(loadCafes());
    c.header("Cache-Control", "public, max-age=300");
    return c.json(body, 200);
  });

  app.all("/api/cafes", (c) => {
    c.header("Allow", "GET");
    return c.json(errorBody("METHOD_NOT_ALLOWED", "허용되지 않은 요청이에요."), 405);
  });

  // 검색엔진 안내 파일 (PRD FR-16). 배포 주소가 정해지지 않아 요청 주소로 절대 URL을 만든다.
  app.get("/robots.txt", (c) => {
    const origin = new URL(c.req.url).origin;
    c.header("Cache-Control", "public, max-age=3600");
    return c.text(`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
  });

  app.get("/sitemap.xml", (c) => {
    const origin = new URL(c.req.url).origin;
    const urls = SITE_PATHS.map((p) => `  <url><loc>${origin}${p}</loc></url>`).join("\n");
    c.header("Content-Type", "application/xml; charset=utf-8");
    c.header("Cache-Control", "public, max-age=3600");
    return c.body(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    );
  });

  // 사이트맵과 비슷한 주소(sitemap.xml/, Sitemap.xml, sitemap, sitemap_index.xml 등)는 SPA 화면(HTML)으로
  // 떨어지지 않게 정식 주소로 영구 이동시킨다. Search Console "Sitemap이 HTML입니다" 오류 대응 (2026-11-17).
  app.get("*", async (c, next) => {
    const path = new URL(c.req.url).pathname;
    if (path !== "/sitemap.xml" && /^\/sitemap(_index)?(\.xml)?\/?$/i.test(path)) {
      return c.redirect("/sitemap.xml", 301);
    }
    return next();
  });

  const notFound = (c: Context) =>
    c.json(errorBody("NOT_FOUND", "요청한 API가 없어요."), 404);
  app.all("/api/*", notFound);
  app.notFound(notFound);

  app.onError((err, c) => {
    // 원인은 서버 로그에만 남기고 응답에는 내부 정보를 넣지 않는다 (API.md 1장)
    console.error("[api] 처리 중 오류:", err);
    return c.json(errorBody("INTERNAL_ERROR", "카페 정보를 불러오지 못했어요."), 500);
  });

  return app;
}
