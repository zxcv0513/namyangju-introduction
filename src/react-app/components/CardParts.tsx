import type { ReactNode } from "react";
import type { Source } from "../../shared/types.ts";
import { kakaoMapUrl, naverMapUrl } from "../lib/mapLinks.ts";

const externalProps = { target: "_blank", rel: "noopener noreferrer" } as const;

/** 네이버 지도·카카오맵 버튼 (PRD FR-9) */
export function MapButtons({ name }: { name: string }) {
  const cls =
    "inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-line px-3 text-sm font-medium hover:border-accent hover:text-accent";
  return (
    <div className="flex gap-2">
      <a href={naverMapUrl(name)} {...externalProps} className={cls} aria-label={`${name} 네이버 지도에서 보기(새 탭)`}>
        네이버 지도
      </a>
      <a href={kakaoMapUrl(name)} {...externalProps} className={cls} aria-label={`${name} 카카오맵에서 보기(새 탭)`}>
        카카오맵
      </a>
    </div>
  );
}

/** 카드 하단 출처 링크 (PRD 4장) */
export function SourceLinks({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null;
  return (
    <p className="text-xs text-muted">
      출처:{" "}
      {sources.map((s, i) => (
        <span key={s.url}>
          {i > 0 && " · "}
          <a href={s.url} {...externalProps} className="underline underline-offset-2 hover:text-accent">
            {s.title}
            <span className="sr-only">(새 탭)</span>
          </a>
        </span>
      ))}
    </p>
  );
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      {...externalProps}
      className="inline-flex min-h-11 items-center font-medium text-accent underline underline-offset-4 hover:text-accent-strong"
    >
      {children}
      <span className="sr-only">(새 탭)</span>
    </a>
  );
}

export function Badge({ children, tone = "soft" }: { children: ReactNode; tone?: "soft" | "line" }) {
  const cls =
    tone === "soft"
      ? "bg-accent-soft text-accent-strong"
      : "border border-line text-muted";
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{children}</span>;
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6 sm:mb-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
    </header>
  );
}
