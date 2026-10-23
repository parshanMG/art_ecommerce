import { useEffect, useState } from "react";

/* ─────────────────────────────────────────────────────────────────────
   useCanHover
   true when the primary input can hover (mouse / trackpad), false on
   touch screens. Uses the same media query Tailwind v4 wraps every
   hover: / group-hover: style in, so it tells you exactly when those
   styles will never fire and a tap fallback is needed.
───────────────────────────────────────────────────────────────────── */
const HOVER_QUERY = "(hover: hover)";

export function useCanHover() {
  const [canHover, setCanHover] = useState(() => window.matchMedia(HOVER_QUERY).matches);

  useEffect(() => {
    const mql = window.matchMedia(HOVER_QUERY);
    const onChange = (e) => setCanHover(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return canHover;
}
