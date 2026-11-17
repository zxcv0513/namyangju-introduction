import { CAFE_TAGS } from "../shared/types.ts";
import type { Cafe, CafeTag, CafesResponse, Source } from "../shared/types.ts";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

const isCafeTag = (v: unknown): v is CafeTag =>
  typeof v === "string" && (CAFE_TAGS as readonly string[]).includes(v);

const isSource = (v: unknown): v is Source => {
  if (typeof v !== "object" || v === null) return false;
  const s = v as Record<string, unknown>;
  return isNonEmptyString(s.title) && isNonEmptyString(s.url) && /^https?:\/\//.test(s.url);
};

/**
 * 데이터 파일 한 항목을 검사한다. 형식이 틀리면 이유를 담은 Error를 던진다.
 * 데이터 파일이 깨진 채 배포되면 잘못된 정보를 보여주는 대신 500으로 알린다 (API.md 1장).
 */
function parseCafe(raw: unknown, index: number): Cafe {
  const fail = (reason: string): never => {
    throw new Error(`cafes.json[${index}] ${reason}`);
  };
  if (typeof raw !== "object" || raw === null) fail("객체가 아님");
  const r = raw as Record<string, unknown>;

  for (const key of ["id", "name", "region", "address", "description"] as const) {
    if (!isNonEmptyString(r[key])) fail(`${key} 없음`);
  }
  if (!Array.isArray(r.tags) || !r.tags.every(isCafeTag)) fail("tags 형식 오류");
  if (!Array.isArray(r.sources) || r.sources.length < 1 || !r.sources.every(isSource)) {
    fail("sources 형식 오류");
  }
  if (!isNonEmptyString(r.verifiedAt) || !DATE_RE.test(r.verifiedAt)) fail("verifiedAt 형식 오류");
  if (r.image !== null && r.image !== undefined) fail("image는 이번 버전에서 null이어야 함");

  return {
    id: r.id as string,
    name: r.name as string,
    region: r.region as string,
    address: r.address as string,
    tags: [...new Set(r.tags as CafeTag[])],
    description: r.description as string,
    image: null,
    sources: r.sources as Source[],
    verifiedAt: r.verifiedAt as string,
  };
}

/** 원본 데이터 → GET /api/cafes 응답 본문 */
export function buildCafesResponse(rawData: unknown): CafesResponse {
  if (!Array.isArray(rawData)) throw new Error("cafes.json 최상위가 배열이 아님");

  const cafes = rawData.map(parseCafe);

  const ids = new Set<string>();
  for (const c of cafes) {
    if (ids.has(c.id)) throw new Error(`cafes.json id 중복: ${c.id}`);
    ids.add(c.id);
  }

  const collator = new Intl.Collator("ko");
  cafes.sort((a, b) => collator.compare(a.name, b.name));

  const regions = [...new Set(cafes.map((c) => c.region))].sort(collator.compare);
  const usedTags = new Set(cafes.flatMap((c) => c.tags));
  const tags = CAFE_TAGS.filter((t) => usedTags.has(t));
  // 같은 YYYY-MM-DD 형식이라 문자열 비교로 가장 오래된 날짜를 고른다
  const verifiedAt = cafes.reduce<string | null>(
    (oldest, c) => (oldest === null || c.verifiedAt < oldest ? c.verifiedAt : oldest),
    null,
  );

  return { cafes, regions, tags, verifiedAt };
}
