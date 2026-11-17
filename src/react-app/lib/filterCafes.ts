import type { Cafe, CafeTag } from "../../shared/types.ts";

export interface CafeFilter {
  /** null이면 전체 지역 */
  region: string | null;
  /** 비어 있으면 태그 조건 없음. 여러 개면 하나라도 해당(OR) — PRD FR-7 */
  tags: CafeTag[];
  query: string;
}

/** 검색 비교용: 공백 제거 + 영문 소문자 (DESIGN.md S4 필터 규칙) */
export const normalize = (s: string) => s.replace(/\s+/g, "").toLowerCase();

/** 지역 AND 태그(OR) AND 이름 검색 */
export function filterCafes(cafes: Cafe[], f: CafeFilter): Cafe[] {
  const q = normalize(f.query);
  return cafes.filter(
    (c) =>
      (f.region === null || c.region === f.region) &&
      (f.tags.length === 0 || f.tags.some((t) => c.tags.includes(t))) &&
      (q === "" || normalize(c.name).includes(q)),
  );
}

export const isFilterActive = (f: CafeFilter) =>
  f.region !== null || f.tags.length > 0 || f.query.trim() !== "";

/**
 * 주소 쿼리 → 필터 (PRD FR-12). 데이터에 없는 지역·태그는 무시한다.
 * 예: ?region=조안면&tags=강뷰,베이커리&q=카페
 */
export function parseFilter(
  params: URLSearchParams,
  regions: readonly string[],
  tags: readonly CafeTag[],
): CafeFilter {
  const region = params.get("region");
  const rawTags = (params.get("tags") ?? "").split(",").map((t) => t.trim());
  return {
    region: region !== null && regions.includes(region) ? region : null,
    tags: tags.filter((t) => rawTags.includes(t)),
    query: params.get("q") ?? "",
  };
}

/**
 * 필터 → 주소 쿼리. 빈 값(공백만 있는 검색어 포함)은 주소에서 뺀다.
 * base의 다른 파라미터(utm_* 등)는 그대로 둔다.
 */
export function toSearchParams(f: CafeFilter, base?: URLSearchParams): URLSearchParams {
  const p = new URLSearchParams(base);
  p.delete("region");
  p.delete("tags");
  p.delete("q");
  if (f.region) p.set("region", f.region);
  if (f.tags.length) p.set("tags", f.tags.join(","));
  if (f.query.trim()) p.set("q", f.query);
  return p;
}
