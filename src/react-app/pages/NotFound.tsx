import { useEffect } from "react";
import { Link } from "react-router";
import { SITE_NAME, usePageMeta } from "../lib/usePageMeta.ts";

/** S5 없는 주소 */
export default function NotFound() {
  usePageMeta(`페이지 없음 | ${SITE_NAME}`, "찾는 페이지가 없어요.");

  // 없는 주소도 SPA라 200으로 열리므로 검색 결과에 남지 않게 noindex를 붙인다
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold">찾는 페이지가 없어요</h1>
      <Link
        to="/"
        className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-accent px-5 font-medium text-white hover:bg-accent-strong"
      >
        홈으로
      </Link>
    </div>
  );
}
