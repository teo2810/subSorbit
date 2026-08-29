import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export function GlassField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs text-muted">{label}</p>
      {children}
    </div>
  );
}

export function GlassSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.id === value)?.label ?? value;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="glass-field glow-tap flex h-11 w-full items-center justify-between px-3 text-left text-sm"
      >
        <span className="truncate">{current}</span>
        <ChevronDown
          className={cn("size-4 text-muted transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <ul
          className="no-scrollbar absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-2xl border border-white/12 p-1 shadow-[0_18px_50px_rgba(0,0,0,0.5)]"
          style={{ background: "rgb(11 15 32 / 0.98)", backdropFilter: "blur(18px)" }}
        >
          {options.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex h-10 w-full items-center rounded-xl px-3 text-left text-sm",
                  o.id === value ? "bg-cyan/15 text-cyan" : "text-fg",
                )}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
