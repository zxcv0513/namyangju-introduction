// 서버(Hono)와 화면(React)이 함께 쓰는 타입. 계약은 API.md 1장.

/** API.md에 정한 태그 허용값과 화면 표시 순서 */
export const CAFE_TAGS = [
  "강뷰",
  "호수·저수지뷰",
  "대형카페",
  "베이커리",
  "정원",
  "반려견 동반",
  "루프탑",
  "산·계곡뷰",
] as const;

export type CafeTag = (typeof CAFE_TAGS)[number];

export interface Source {
  title: string;
  url: string;
}

export interface CafeImage {
  src: string;
  alt: string;
  credit: string;
}

export interface Cafe {
  id: string;
  name: string;
  region: string;
  address: string;
  tags: CafeTag[];
  description: string;
  image: CafeImage | null;
  sources: Source[];
  verifiedAt: string;
}

/** GET /api/cafes 성공 응답 (200) */
export interface CafesResponse {
  cafes: Cafe[];
  regions: string[];
  tags: CafeTag[];
  verifiedAt: string | null;
}

export type ApiErrorCode = "INTERNAL_ERROR" | "METHOD_NOT_ALLOWED" | "NOT_FOUND";

/** 오류 응답 (404, 405, 500) */
export interface ApiErrorResponse {
  error: { code: ApiErrorCode; message: string };
}

// ── 정적 데이터 (명소·축제·도시) — 화면 코드에 포함, API 없음 (DESIGN.md 2장) ──

export type PlaceCategory = "자연" | "역사·문화" | "체험·공원";

export interface Place {
  id: string;
  name: string;
  region: string;
  address: string;
  category: PlaceCategory;
  description: string;
  officialUrl: string | null;
  sources: Source[];
  verifiedAt: string;
  image: CafeImage | null;
}

export interface Festival {
  id: string;
  name: string;
  months: number[];
  venue: string;
  description: string;
  lastHeldYear: number;
  officialUrl: string | null;
  sources: Source[];
  verifiedAt: string;
}

export interface CityInfo {
  summary: string;
  facts: { label: string; value: string; asOf: string; source: Source }[];
  transport: { mode: string; description: string; source: Source }[];
  verifiedAt: string;
}

/** 사이트 주소 목록 — 화면 라우트와 sitemap.xml이 같이 쓴다 */
export const SITE_PATHS = ["/", "/places", "/festivals", "/cafes"] as const;
