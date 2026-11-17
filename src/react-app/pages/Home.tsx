import { Link } from "react-router";
import cityData from "../../data/city.json";
import type { CityInfo } from "../../shared/types.ts";
import { ExternalLink } from "../components/CardParts.tsx";
import { SITE_NAME, usePageMeta } from "../lib/usePageMeta.ts";

const city = cityData as CityInfo;

const SHORTCUTS = [
  { to: "/places", title: "관광 명소", desc: "정약용유적지, 수종사, 물의정원 등 가 볼 만한 곳", highlight: false },
  { to: "/festivals", title: "축제·행사", desc: "계절마다 열리는 남양주의 축제", highlight: false },
  { to: "/cafes", title: "카페", desc: "지역·분위기로 골라보는 남양주 카페", highlight: true },
] as const;

/** S1 홈 (FR-1) */
export default function Home() {
  usePageMeta(`${SITE_NAME} — 강과 숲, 카페의 도시 남양주`, "남양주의 관광 명소, 축제, 카페를 한곳에서 둘러보세요.");

  return (
    <div className="space-y-12 sm:space-y-16">
      <section className="rounded-2xl bg-gradient-to-br from-accent-soft via-white to-surface px-5 py-10 sm:px-10 sm:py-14">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          강과 숲, 그리고 카페의 도시
          <br />
          <span className="text-accent-strong">남양주</span>
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted sm:text-lg">{city.summary}</p>
      </section>

      <section aria-labelledby="shortcuts-title">
        <h2 id="shortcuts-title" className="sr-only">
          둘러보기
        </h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {SHORTCUTS.map((s) => (
            <li key={s.to}>
              <Link
                to={s.to}
                className={`flex h-full flex-col rounded-xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md ${
                  s.highlight ? "border-accent bg-accent text-white" : "border-line bg-white"
                }`}
              >
                <span className="text-lg font-bold">
                  {s.title} <span aria-hidden="true">→</span>
                </span>
                <span className={`mt-1 text-sm ${s.highlight ? "text-white/90" : "text-muted"}`}>{s.desc}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="facts-title">
        <h2 id="facts-title" className="text-xl font-bold sm:text-2xl">
          한눈에 보는 남양주
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {city.facts.map((f) => (
            <div key={f.label} className="rounded-xl border border-line p-4">
              <dt className="text-sm text-muted">{f.label}</dt>
              <dd className="mt-1 font-bold">{f.value}</dd>
              <dd className="mt-2 text-xs text-muted">
                기준: {f.asOf} ·{" "}
                <a href={f.source.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                  출처<span className="sr-only">: {f.source.title} (새 탭)</span>
                </a>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="transport-title">
        <h2 id="transport-title" className="text-xl font-bold sm:text-2xl">
          서울에서 가는 법
        </h2>
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
          {city.transport.map((t) => (
            <li key={t.description} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-baseline sm:gap-4">
              <span className="w-16 shrink-0 font-bold text-accent-strong">{t.mode}</span>
              <span className="flex-1">{t.description}</span>
              <span className="text-xs">
                <ExternalLink href={t.source.url}>
                  출처<span className="sr-only">: {t.source.title}</span>
                </ExternalLink>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">노선과 운행 정보는 바뀔 수 있어요. 출발 전 교통 앱에서 확인하세요.</p>
      </section>
    </div>
  );
}
