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
    <div className="pointer-events-none absolute -inset-8 overflow-visible">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 46%, rgba(34,211,238,0.38) 0%, rgba(56,189,248,0.16) 38%, rgba(99,102,241,0.08) 62%, transparent 78%)",
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
