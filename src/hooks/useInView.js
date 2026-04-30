import { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────────────────
   useInView
   Returns a [ref, isVisible] pair. Once the element attached to ref
   scrolls into the viewport it flips to true and stays true (no
   re-triggering on scroll back out — cards don't hide again).

   threshold  — how much of the element must be visible to trigger (0–1)
   rootMargin — expand/shrink the detection zone (CSS margin syntax)
───────────────────────────────────────────────────────────────────── */
export function useInView({ threshold = 0.15, rootMargin = "0px" } = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // fire once, then stop watching
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return [ref, isVisible];
}
