import { useId, useState } from "react";
import { Settings } from "lucide-react";
import { cn } from "@/lib/cn";

export function OrbitMark({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
}) {
  const scale =
    size === "hero"
      ? "text-[48px] sm:text-[64px]"
      : size === "lg"
        ? "text-[28px]"
        : size === "sm"
          ? "text-[15px]"
          : "text-[20px]";
  return (
    <span
      className={cn(
        "inline-block font-orbit font-normal uppercase leading-none",
        size === "hero"
          ? "tracking-[0.48em]"
          : size === "sm"
            ? "tracking-[0.32em]"
            : "tracking-[0.36em]",
        scale,
        className,
      )}
      style={
        size === "hero"
          ? {
              background: "linear-gradient(180deg, #f4fdff 0%, #a5f3fc 55%, #22d3ee 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              filter:
                "drop-shadow(0 0 18px rgba(34,211,238,0.65)) drop-shadow(0 0 42px rgba(34,211,238,0.35))",
            }
          : {
              color: "#e8fdff",
              textShadow:
                size === "sm"
                  ? "0 0 8px rgba(34,211,238,0.7)"
                  : "0 0 10px rgba(103,232,249,0.95), 0 0 28px rgba(34,211,238,0.45)",
            }
      }
    >
      ORBIT
    </span>
  );
}

export function OrbitSun({
  size = 28,
  pulse = false,
}: {
  size?: number;
  pulse?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden
      className={cn("shrink-0 overflow-visible", pulse && "sun-pulse")}
      style={{
        filter:
          "drop-shadow(0 0 4px rgba(255,255,255,0.9)) drop-shadow(0 0 10px rgba(34,211,238,0.85)) drop-shadow(0 0 22px rgba(34,211,238,0.55))",
      }}
    >
      <defs>
        <radialGradient id={`os-${uid}`} cx="36%" cy="32%" r="64%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="32%" stopColor="#e8f6ff" />
          <stop offset="62%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#0891b2" />
        </radialGradient>
      </defs>
      <ellipse
        cx="32"
        cy="34"
        rx="26"
        ry="9"
        fill="none"
        stroke="#22d3ee"
        strokeWidth="1.8"
        opacity="0.55"
        transform="rotate(-18 32 34)"
      />
      <circle cx="32" cy="32" r="13.5" fill={`url(#os-${uid})`} />
      <circle cx="26" cy="26" r="4.2" fill="rgba(255,255,255,0.4)" />
    </svg>
  );
}

export function OrbitLockup({
  size = "sm",
}: {
  size?: "sm" | "md" | "hero";
}) {
  const sun = size === "hero" ? 58 : size === "md" ? 28 : 26;
  const mark = size === "hero" ? "hero" : size === "md" ? "md" : "sm";
  return (
    <div className="flex items-center gap-2">
      <OrbitSun size={sun} pulse={size === "hero"} />
      <OrbitMark size={mark} />
    </div>
  );
}

export function ScreenHeader({
  onSettings,
  subtitle,
}: {
  onSettings: () => void;
  subtitle?: string;
}) {
  const [spin, setSpin] = useState(false);
  return (
    <header className="flex shrink-0 items-center justify-between px-5 pt-5 pb-2">
      <div className="flex min-w-0 items-center gap-2">
        <OrbitSun size={26} />
        <div className="min-w-0">
          <h1 className="leading-none">
            <OrbitMark size="sm" />
          </h1>
          {subtitle ? (
            <p className="mt-1 truncate text-[11px] text-muted">{subtitle}</p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          setSpin(true);
          window.setTimeout(() => setSpin(false), 480);
          onSettings();
        }}
        aria-label="Impostazioni"
        className="glow-tap flex size-10 items-center justify-center rounded-full bg-white/8 text-muted"
      >
        <Settings className={cn("size-5", spin && "gear-spin")} />
      </button>
    </header>
  );
}
