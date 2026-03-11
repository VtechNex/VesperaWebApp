import React from "react";

export default function CountUp({
  end,
  start = 0,
  duration = 1500,
  prefix = "",
  suffix = "",
  className = "",
  once = true,
  formatter,
}) {
  const ref = React.useRef(null);
  const rafRef = React.useRef(0);
  const [value, setValue] = React.useState(start);

  React.useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setValue(end);
      return () => {};
    }
    const el = ref.current;
    if (!el) return;

    let startTime = 0;
    let cancelled = false;
    let started = false; // per-effect flag to handle React StrictMode double-invoke

    const step = (ts) => {
      if (cancelled) return;
      if (!startTime) startTime = ts;
      const progress = Math.min(1, (ts - startTime) / duration);
      const next = start + (end - start) * progress;
      setValue(Math.floor(next));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    const run = () => {
      if (once && started) return;
      started = true;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(step);
    };

    // Fallback if IntersectionObserver is not available
    if (typeof window !== 'undefined' && !('IntersectionObserver' in window)) {
      run();
      return () => cancelAnimationFrame(rafRef.current);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          run();
          if (once) observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, [start, end, duration, once]);

  const display = formatter ? formatter(value) : value.toLocaleString("en-IN");

  return (
    <span ref={ref} className={className} aria-live="polite">
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

