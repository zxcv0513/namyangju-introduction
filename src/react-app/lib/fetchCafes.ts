import { CAFE_TAGS } from "../../shared/types.ts";
import type { Cafe, CafeTag, CafesResponse } from "../../shared/types.ts";

/** 요청 제한 시간 (API.md 1장 화면 쪽 처리) */
export const FETCH_TIMEOUT_MS = 10_000;

const isStr = (v: unknown): v is string => typeof v === "string" && v.length > 0;
const isTag = (v: unknown): v is CafeTag =>
  typeof v === "string" && (CAFE_TAGS as readonly string[]).includes(v);

/** 응답은 신뢰 경계: 필수 필드가 빠진 카페는 건너뛴다 (API.md 1장) */
function toCafe(raw: unknown): Cafe | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (![r.id, r.name, r.region, r.address, r.description, r.verifiedAt].every(isStr)) return null;
  if (!Array.isArray(r.tags) || !Array.isArray(r.sources)) return null;
  const sources = r.sources.filter(
    (s): s is { title: string; url: string } =>
      typeof s === "object" && s !== null && isStr(s.title) && isStr(s.url) && /^https?:\/\//.test(s.url),
  );
  // 서버(src/worker/cafes.ts)와 같은 기준: 출처가 하나도 없으면 보여주지 않는다
  if (sources.length === 0) return null;
  return {
    id: r.id as string,
    name: r.name as string,
    region: r.region as string,
    address: r.address as string,
    description: r.description as string,
    verifiedAt: r.verifiedAt as string,
    tags: [...new Set(r.tags.filter(isTag))],
    sources,
    image: null,
  };
}

/**
 * GET /api/cafes. 네트워크 오류·시간 초과·2xx 아닌 응답·형식 불일치는 모두 Error를 던진다.
 * signal로 화면을 떠날 때 요청을 취소할 수 있다.
 */
export async function fetchCafes(signal?: AbortSignal): Promise<CafesResponse> {
  // AbortSignal.any는 비교적 최근 브라우저에만 있어 직접 묶는다
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("시간 초과")), FETCH_TIMEOUT_MS);
  const onAbort = () => controller.abort(signal?.reason);
  if (signal?.aborted) onAbort();
  signal?.addEventListener("abort", onAbort);

  let data: unknown;
  try {
    const res = await fetch("/api/cafes", {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }

  if (typeof data !== "object" || data === null || !Array.isArray((data as { cafes?: unknown }).cafes)) {
    throw new Error("응답 형식 오류");
  }
  const cafes = (data as { cafes: unknown[] }).cafes
    .map(toCafe)
    .filter((c): c is Cafe => c !== null);

  // 지역·태그 목록은 실제로 쓸 카페에서 다시 만든다 (건너뛴 항목의 값이 칩에 남지 않게)
  const collator = new Intl.Collator("ko");
  const regions = [...new Set(cafes.map((c) => c.region))].sort(collator.compare);
  const used = new Set(cafes.flatMap((c) => c.tags));
  const verifiedAt = (data as { verifiedAt?: unknown }).verifiedAt;

  return {
    cafes,
    regions,
    tags: CAFE_TAGS.filter((t) => used.has(t)),
    verifiedAt: isStr(verifiedAt) ? verifiedAt : null,
  };
}
