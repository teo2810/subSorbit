import { useMemo } from "react";

/**
 * Sfondo decorativo per i grafici circolari (spesa, categorie): un bagliore
 * cosmico morbido più qualche stella che scintilla, per non lasciare i grafici
 * su un nero piatto. Puramente decorativo, non cattura il tap.
 */
export function ChartBackdrop() {
  const stars = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        top: 6 + Math.random() * 88,
        left: 6 + Math.random() * 88,
        size: 1 + Math.random() * 1.6,
        delay: Math.random() * 3.5,
        duration: 2.4 + Math.random() * 2.6,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      <div
        className="absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 46%, rgba(34,211,238,0.28) 0%, rgba(56,189,248,0.12) 40%, transparent 70%)",
        }}
      />
      {stars.map((s) => (
        <span
          key={s.id}
          className="star-twinkle absolute rounded-full bg-white"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
