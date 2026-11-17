import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "react-router";
import type { Cafe, CafeTag, CafesResponse } from "../../shared/types.ts";
import { Badge, MapButtons, PageHeader, SourceLinks } from "../components/CardParts.tsx";
import { fetchCafes } from "../lib/fetchCafes.ts";
import { filterCafes, isFilterActive, parseFilter, toSearchParams } from "../lib/filterCafes.ts";
import type { CafeFilter } from "../lib/filterCafes.ts";
import { SITE_NAME, usePageMeta } from "../lib/usePageMeta.ts";

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "success"; data: CafesResponse };

const EMPTY: CafeFilter = { region: null, tags: [], query: "" };

/** S4 카페 (FR-5~FR-14) */
export default function Cafes() {
  usePageMeta(
    `남양주 카페 — 지역·분위기로 골라보기 | ${SITE_NAME}`,
    "강뷰, 대형카페, 베이커리 등 분위기와 지역으로 남양주 카페를 찾아보세요.",
  );

  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    // 화면을 떠나 취소된 요청의 결과는 성공·실패 모두 무시한다
    fetchCafes(controller.signal)
      .then((data) => !controller.signal.aborted && setState({ status: "success", data }))
      .catch(() => !controller.signal.aborted && setState({ status: "error" }));
    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return (
    <>
      <PageHeader title="남양주 카페" subtitle="지역과 분위기로 골라보세요" />
      {/* 상태 알림 영역은 항상 두고 문구만 바꾼다 (화면낭독기가 새로 생긴 live 영역을 놓치지 않게) */}
      <p role="status" className="sr-only">
        {state.status === "loading" ? "카페 정보를 불러오는 중이에요" : ""}
      </p>
      {state.status === "success" ? (
        <CafeBrowser data={state.data} />
      ) : (
        <>
          <FilterSkeleton />
          {state.status === "loading" ? <LoadingCards /> : <LoadError onRetry={retry} />}
        </>
      )}
    </>
  );
}

/** 검색어를 주소에 반영하기까지 기다리는 시간. 결과 목록은 기다리지 않고 바로 바뀐다. */
const QUERY_URL_DELAY_MS = 300;

/** 주소에 실리는 검색어 형태 (공백만 있으면 빈 값 — toSearchParams와 같은 규칙) */
const urlQuery = (q: string) => (q.trim() ? q : "");

function CafeBrowser({ data }: { data: CafesResponse }) {
  const [params, setParams] = useSearchParams();
  const urlFilter = useMemo(() => parseFilter(params, data.regions, data.tags), [params, data]);

  // 검색칸은 화면 상태로 제어한다. 라우터는 주소 변경을 Transition으로 반영해서,
  // 주소 값으로 직접 제어하면 한글 조합 입력이 깨진다("카페" → "ㅋ카카ㅍ페페") — 5단계 리뷰에서 재현.
  const [query, setQuery] = useState(urlFilter.query);
  const pushedQuery = useRef(urlFilter.query);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchId = useId();

  // 뒤로 가기 등 바깥에서 주소의 검색어가 바뀌면 검색칸을 맞춘다
  useEffect(() => {
    if (urlFilter.query !== pushedQuery.current) {
      pushedQuery.current = urlFilter.query;
      setQuery(urlFilter.query);
    }
  }, [urlFilter.query]);

  const filter = useMemo<CafeFilter>(() => ({ ...urlFilter, query }), [urlFilter, query]);
  const results = useMemo(() => filterCafes(data.cafes, filter), [data.cafes, filter]);

  /**
   * 주소 갱신. 현재 주소를 기준으로(빠른 연속 클릭에도 값이 안 섞이게) 바꿀 키만 고치고 나머지 파라미터는 유지.
   * 검색어 입력은 기록을 쌓지 않고(replace), 칩 선택은 뒤로 가기로 되돌릴 수 있게 기록을 남긴다.
   */
  const update = useCallback(
    (next: Partial<CafeFilter>, replace = false) => {
      setParams(
        (prev) => {
          const merged: CafeFilter = { ...parseFilter(prev, data.regions, data.tags), query, ...next };
          pushedQuery.current = urlQuery(merged.query);
          return toSearchParams(merged, prev);
        },
        { replace, preventScrollReset: true },
      );
    },
    [setParams, data.regions, data.tags, query],
  );

  // 입력이 잠깐 멈추면 검색어를 주소에 반영 (FR-12)
  useEffect(() => {
    if (urlQuery(query) === pushedQuery.current) return;
    const timer = setTimeout(() => update({ query }, true), QUERY_URL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query, update]);

  const toggleTag = (t: CafeTag) =>
    update({ tags: filter.tags.includes(t) ? filter.tags.filter((x) => x !== t) : [...filter.tags, t] });

  const clearQuery = () => {
    setQuery("");
    update({ query: "" }, true);
    searchRef.current?.focus(); // 지우기 버튼이 사라져도 포커스를 잃지 않게
  };

  const reset = () => {
    setQuery("");
    update(EMPTY);
    searchRef.current?.focus(); // 초기화 버튼이 사라져도 포커스를 잃지 않게
  };

  if (data.cafes.length === 0) {
    return <Notice>아직 등록된 카페가 없어요.</Notice>;
  }

  const active = isFilterActive(filter);

  return (
    <>
      <div className="space-y-5 rounded-xl border border-line bg-surface p-4 sm:p-5">
        {/* 검색 (FR-8) */}
        <div className="relative">
          <label htmlFor={searchId} className="sr-only">
            카페 이름 검색
          </label>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            ref={searchRef}
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: 카페 이름 일부"
            autoComplete="off"
            className="min-h-12 w-full rounded-lg border border-line bg-white pl-10 pr-12 text-base [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              className="absolute right-1 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:text-ink"
            >
              <span aria-hidden="true">×</span>
              <span className="sr-only">검색어 지우기</span>
            </button>
          )}
        </div>

        {/* 지역 (FR-6): 하나만 선택 */}
        <ChipGroup label="지역">
          {[null, ...data.regions].map((r) => (
            <Chip key={r ?? "all"} pressed={filter.region === r} onClick={() => update({ region: r })}>
              {r ?? "전체"}
            </Chip>
          ))}
        </ChipGroup>

        {/* 분위기 태그 (FR-7): 여러 개, 하나라도 해당(OR) */}
        <ChipGroup label="분위기" hint="하나라도 해당하면 보여줘요" wrap>
          {data.tags.map((t) => (
            <Chip key={t} pressed={filter.tags.includes(t)} onClick={() => toggleTag(t)} check>
              {t}
            </Chip>
          ))}
        </ChipGroup>
      </div>

      {/* 결과 수 (FR-11) */}
      <div className="mt-6 mb-4 flex min-h-11 items-center justify-between gap-3">
        <p aria-live="polite" className="font-medium">
          <span className="text-xl font-bold text-accent-strong">{results.length}</span>곳
        </p>
        {active && <ResetButton onClick={reset} />}
      </div>

      {results.length === 0 ? (
        <Notice action={<ResetButton onClick={reset} />}>조건에 맞는 카페가 없어요. 지역이나 태그를 바꿔 보세요.</Notice>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((c) => (
            <li key={c.id}>
              <CafeCard cafe={c} />
            </li>
          ))}
        </ul>
      )}

      {data.verifiedAt && (
        <p className="mt-8 text-sm text-muted">
          카페 정보 확인일: {data.verifiedAt} · 방문 전 지도에서 영업 여부를 확인하세요.
        </p>
      )}
    </>
  );
}

/** 카페 카드 (FR-5, FR-9). 이미지가 없으면 첫 글자 + 패턴 배경 (PRD 4장) */
function CafeCard({ cafe }: { cafe: Cafe }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white">
      <div
        aria-hidden="true"
        className="flex h-28 items-center justify-center bg-accent-soft text-4xl font-bold text-accent/60 [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:14px_14px]"
      >
        <span className="rounded-full bg-accent-soft px-4">{cafe.name.replace(/^카페\s*/, "").charAt(0)}</span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h2 className="text-lg font-bold">{cafe.name}</h2>
          <div className="mt-1">
            <Badge tone="line">{cafe.region}</Badge>
          </div>
        </div>
        {cafe.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="분위기">
            {cafe.tags.map((t) => (
              <li key={t}>
                <Badge>{t}</Badge>
              </li>
            ))}
          </ul>
        )}
        <p className="flex-1 text-sm leading-relaxed">{cafe.description}</p>
        <p className="text-sm text-muted">{cafe.address}</p>
        <MapButtons name={cafe.name} />
        <SourceLinks sources={cafe.sources} />
      </div>
    </article>
  );
}

function ChipGroup({
  label,
  hint,
  wrap = false,
  children,
}: {
  label: string;
  hint?: string;
  wrap?: boolean;
  children: ReactNode;
}) {
  const labelId = useId();
  return (
    <div>
      <p id={labelId} className="mb-2 text-sm font-bold">
        {label}
        {hint && <span className="ml-2 font-normal text-muted">{hint}</span>}
      </p>
      {/* 지역은 모바일에서 한 줄 가로 스크롤 (DESIGN.md S4) */}
      <div
        role="group"
        aria-labelledby={labelId}
        className={
          wrap
            ? "flex flex-wrap gap-2"
            : "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        }
      >
        {children}
      </div>
    </div>
  );
}

function Chip({
  pressed,
  onClick,
  check = false,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  check?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full border px-4 text-sm font-medium whitespace-nowrap ${
        pressed ? "border-accent bg-accent text-white" : "border-line bg-white hover:border-accent"
      }`}
    >
      {check && pressed && <span aria-hidden="true">✓</span>}
      {children}
    </button>
  );
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-medium hover:border-accent hover:text-accent"
    >
      필터 초기화
    </button>
  );
}

function Notice({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-line px-4 py-12 text-center">
      <p>{children}</p>
      {action}
    </div>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="mt-6">
      <Notice
        action={
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-11 items-center rounded-lg bg-accent px-5 font-medium text-white hover:bg-accent-strong"
          >
            다시 시도
          </button>
        }
      >
        카페 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
      </Notice>
    </div>
  );
}

/** 불러오는 중: 필터 비활성 자리 (FR-14) */
function FilterSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-5 rounded-xl border border-line bg-surface p-4 opacity-60 sm:p-5">
      <div className="h-12 rounded-lg bg-line/60" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-11 w-20 rounded-full bg-line/60" />
        ))}
      </div>
    </div>
  );
}

function LoadingCards() {
  return (
    <div className="mt-6">
      <ul aria-hidden="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="h-80 animate-pulse rounded-xl bg-surface" />
        ))}
      </ul>
    </div>
  );
}
