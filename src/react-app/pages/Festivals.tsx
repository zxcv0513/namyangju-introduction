import festivalsData from "../../data/festivals.json";
import type { Festival } from "../../shared/types.ts";
import { Badge, ExternalLink, PageHeader, SourceLinks } from "../components/CardParts.tsx";
import { formatMonths } from "../lib/formatMonths.ts";
import { SITE_NAME, usePageMeta } from "../lib/usePageMeta.ts";

/** 월 정보가 없으면 맨 뒤로 */
const firstMonth = (f: Festival) => (f.months.length ? Math.min(...f.months) : 13);

const festivals = [...(festivalsData as Festival[])].sort(
  (a, b) => firstMonth(a) - firstMonth(b) || a.name.localeCompare(b.name, "ko"),
);

/** S3 축제·행사 (FR-3) */
export default function Festivals() {
  usePageMeta(`축제·행사 | ${SITE_NAME}`, "계절마다 열리는 남양주의 축제와 행사 안내.");

  return (
    <>
      <PageHeader title="축제·행사" />
      <p role="note" className="mb-6 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
        날짜는 해마다 바뀔 수 있어요. 정확한 일정은 공식 안내에서 확인하세요.
      </p>

      <ul className="grid gap-4 sm:grid-cols-2">
        {festivals.map((f) => (
          <li key={f.id}>
            <article className="flex h-full flex-col gap-3 rounded-xl border border-line p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{formatMonths(f.months)}</Badge>
                <span className="text-xs text-muted">최근 개최: {f.lastHeldYear}년</span>
              </div>
              <h2 className="text-lg font-bold">{f.name}</h2>
              <p className="text-sm text-muted">장소: {f.venue}</p>
              <p className="flex-1 text-sm leading-relaxed">{f.description}</p>
              {f.officialUrl && <ExternalLink href={f.officialUrl}>공식 안내 보기</ExternalLink>}
              <SourceLinks sources={f.sources} />
            </article>
          </li>
        ))}
      </ul>
    </>
  );
}
