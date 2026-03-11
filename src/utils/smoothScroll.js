export function smoothScrollTo(idOrHash) {
  try {
    const id = (idOrHash || "").replace(/^#/, "");
    if (!id) return;
    const el = document.getElementById(id);
    if (el) {
      const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      if (history && history.pushState) {
        history.pushState(null, "", `#${id}`);
      }
    }
  } catch {}
}

export function interceptAnchorClicks(root = document) {
  const onClick = (e) => {
    const anchor = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href || href === "#") return;
    const id = href.slice(1);
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    if (history && history.pushState) {
      history.pushState(null, "", `#${id}`);
    }
  };
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}

