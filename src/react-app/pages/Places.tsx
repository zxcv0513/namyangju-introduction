import { useState } from "react";
import placesData from "../../data/places.json";
import type { Place, PlaceCategory } from "../../shared/types.ts";
import { Badge, ExternalLink, MapButtons, PageHeader, SourceLinks } from "../components/CardParts.tsx";
import { SITE_NAME, usePageMeta } from "../lib/usePageMeta.ts";

const places = placesData as Place[];
const CATEGORY_ORDER: PlaceCategory[] = ["자연", "역사·문화", "체험·공원"];
const categories = CATEGORY_ORDER.filter((c) => places.some((p) => p.category === c));

/** S2 관광 명소 (FR-2) */
export default function Places() {
  usePageMeta(`관광 명소 | ${SITE_NAME}`, "정약용유적지, 수종사, 물의정원 등 남양주에서 가 볼 만한 곳.");
  const [category, setCategory] = useState<PlaceCategory | null>(null);
  const shown = category ? places.filter((p) => p.category === category) : places;

  return (
    <>
      <PageHeader title="관광 명소" subtitle={`남양주에서 가 볼 만한 곳 ${places.length}곳`} />

      {/* 분류가 2개 이상일 때만 보여준다 (DESIGN.md S2) */}
      {categories.length >= 2 && (
        <div role="group" aria-label="분류" className="mb-6 flex flex-wrap gap-2">
          {[null, ...categories].map((c) => {
            const active = c === category;
            return (
              <button
                key={c ?? "all"}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(c)}
                className={`min-h-11 rounded-full border px-4 text-sm font-medium ${
                  active ? "border-accent bg-accent text-white" : "border-line hover:border-accent"
                }`}
              >
                {c ?? "전체"}
              </button>
            );
          })}
        </div>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <li key={p.id}>
            <article className="flex h-full flex-col gap-3 rounded-xl border border-line p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{p.category}</Badge>
                <Badge tone="line">{p.region}</Badge>
              </div>
              <h2 className="text-lg font-bold">{p.name}</h2>
              <p className="flex-1 text-sm leading-relaxed">{p.description}</p>
              <p className="text-sm text-muted">{p.address}</p>
              <MapButtons name={p.name} />
              {p.officialUrl && <ExternalLink href={p.officialUrl}>공식 안내 보기</ExternalLink>}
              <SourceLinks sources={p.sources} />
            </article>
          </li>
        ))}
      </ul>
    </>
  );
}
