import { useEffect, useId, useState } from "react";
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from "react-router";
import city from "../../data/city.json";
import places from "../../data/places.json";
import festivals from "../../data/festivals.json";
import { SITE_NAME } from "../lib/usePageMeta.ts";

const NAV = [
  { to: "/", label: "홈", end: true },
  { to: "/places", label: "관광 명소", end: false },
  { to: "/festivals", label: "축제·행사", end: false },
  { to: "/cafes", label: "카페", end: false },
] as const;

/** 정적 데이터 중 가장 오래된 확인일 (카페는 카페 화면에서 API 값으로 따로 표시) */
const siteVerifiedAt = [city.verifiedAt, ...places.map((p) => p.verifiedAt), ...festivals.map((f) => f.verifiedAt)]
  .sort()[0];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 items-center px-3 rounded-lg hover:text-accent ${
    isActive ? "font-bold underline decoration-2 underline-offset-8 text-accent-strong" : "text-ink"
  }`;

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const location = useLocation();

  // 화면을 옮기면 모바일 메뉴를 닫는다 (DESIGN.md 1장). 지금 페이지 링크를 눌러도 닫히도록 링크 onClick에서도 닫는다.
  useEffect(() => setMenuOpen(false), [location.pathname]);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2"
      >
        본문 바로가기
      </a>

      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between px-4 sm:px-6">
          <Link to="/" onClick={closeMenu} className="flex min-h-14 items-center text-lg font-bold text-accent-strong">
            {SITE_NAME}
          </Link>

          <nav aria-label="주 메뉴" className="hidden md:block">
            <ul className="flex gap-1">
              {NAV.map((n) => (
                <li key={n.to}>
                  <NavLink to={n.to} end={n.end} className={navLinkClass}>
                    {n.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg md:hidden"
            aria-expanded={menuOpen}
            aria-controls={menuOpen ? menuId : undefined}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
            <span className="sr-only">{menuOpen ? "메뉴 닫기" : "메뉴 열기"}</span>
          </button>
        </div>

        {menuOpen && (
          <nav id={menuId} aria-label="주 메뉴" className="border-t border-line md:hidden">
            <ul className="mx-auto flex max-w-[1120px] flex-col px-2 py-2">
              {NAV.map((n) => (
                <li key={n.to}>
                  <NavLink to={n.to} end={n.end} className={navLinkClass} onClick={closeMenu}>
                    {n.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      <main id="main" className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto max-w-[1120px] space-y-1 px-4 py-6 text-sm text-muted sm:px-6">
          <p>
            정보 확인일: {siteVerifiedAt} · 방문 전 영업 여부와 일정을 꼭 확인하세요.
          </p>
          <p>각 카드의 출처 링크에서 원래 자료를 확인할 수 있어요.</p>
        </div>
      </footer>

      <ScrollRestoration />
    </div>
  );
}
