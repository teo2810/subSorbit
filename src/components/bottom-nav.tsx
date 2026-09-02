import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { CalendarDays, House, Orbit, PieChart, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import type { TabId } from "@/lib/types";

const TABS: { id: TabId; label: string; icon: typeof House }[] = [
  { id: "home", label: "Home", icon: House },
  { id: "orbit", label: "Orbita", icon: Orbit },
  { id: "calendar", label: "Agenda", icon: CalendarDays },
  { id: "data", label: "Dati", icon: PieChart },
];

const EASE =
  "left 320ms cubic-bezier(0.22, 1, 0.36, 1), width 320ms cubic-bezier(0.22, 1, 0.36, 1)";

export function BottomNav({
  tab,
  onTab,
  onAdd,
}: {
  tab: TabId;
  onTab: (t: TabId) => void;
  onAdd: () => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState<{ l: number; w: number } | null>(null);
  const [armed, setArmed] = useState(false);
  const [hit, setHit] = useState(false);
  const busy = useRef(false);

  const measure = (id: TabId) => {
    const bar = barRef.current;
    const btn = btnRefs.current[id];
    if (!bar || !btn) return null;
    const br = bar.getBoundingClientRect();
    const el = btn.getBoundingClientRect();
    if (el.width < 8) return null;
    return { l: el.left - br.left, w: el.width };
  };

  useLayoutEffect(() => {
    const next = measure(tab);
    if (next) setPill(next);
  }, [tab]);

  useEffect(() => {
    if (!pill || armed) return;
    const id = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(id);
  }, [pill, armed]);

  useEffect(() => {
    const pin = () => {
      const vv = window.visualViewport;
      const inset = vv
        ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
        : 0;
      document.documentElement.style.setProperty("--nav-shift", `${inset}px`);
    };
    const snap = () => {
      const next = measure(tab);
      if (next) setPill(next);
    };
    const onWin = () => {
      pin();
      snap();
    };
    pin();
    snap();
    window.visualViewport?.addEventListener("resize", onWin);
    window.visualViewport?.addEventListener("scroll", pin);
    window.addEventListener("resize", onWin);
    return () => {
      window.visualViewport?.removeEventListener("resize", onWin);
      window.visualViewport?.removeEventListener("scroll", pin);
      window.removeEventListener("resize", onWin);
    };
  }, [tab]);

  const add = () => {
    if (busy.current) return;
    busy.current = true;
    setHit(true);
    window.setTimeout(() => {
      onAdd();
      setHit(false);
      busy.current = false;
    }, 420);
  };

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 z-40 px-3"
      style={{
        bottom: "var(--nav-shift, 0px)",
        paddingBottom: "max(10px, env(safe-area-inset-bottom))",
      }}
    >
      <div
        ref={barRef}
        className="pointer-events-auto relative mx-auto flex max-w-[480px] items-end justify-between gap-1 overflow-visible rounded-xl px-3 pb-2 pt-2 glass"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute top-2 bottom-2 rounded-2xl bg-cyan/18"
          style={{
            left: pill?.l ?? 12,
            width: pill?.w ?? 0,
            opacity: pill ? 1 : 0,
            boxShadow: "0 0 12px rgba(56,232,255,0.2)",
            transition: armed ? EASE : "none",
          }}
        />
        <NavBtn
          refEl={(el) => {
            btnRefs.current.home = el;
          }}
          active={tab === "home"}
          label="Home"
          onClick={() => onTab("home")}
          icon={<House className="size-5" strokeWidth={tab === "home" ? 2.4 : 1.8} />}
        />
        <NavBtn
          refEl={(el) => {
            btnRefs.current.orbit = el;
          }}
          active={tab === "orbit"}
          label="Orbita"
          onClick={() => onTab("orbit")}
          icon={<Orbit className="size-5" strokeWidth={tab === "orbit" ? 2.4 : 1.8} />}
        />
        <button
          type="button"
          onClick={add}
          aria-label="Aggiungi abbonamento"
          className="fab-sun relative z-20 -mt-8 mb-1 flex size-[58px] items-center justify-center rounded-full text-void"
          style={{
            transform: hit ? "scale(0.72)" : "scale(1)",
            transition: "transform 200ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <Plus
            className="size-7"
            strokeWidth={2.6}
            style={{
              transform: hit ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 200ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </button>
        <NavBtn
          refEl={(el) => {
            btnRefs.current.calendar = el;
          }}
          active={tab === "calendar"}
          label="Agenda"
          onClick={() => onTab("calendar")}
          icon={
            <CalendarDays
              className="size-5"
              strokeWidth={tab === "calendar" ? 2.4 : 1.8}
            />
          }
        />
        <NavBtn
          refEl={(el) => {
            btnRefs.current.data = el;
          }}
          active={tab === "data"}
          label="Dati"
          onClick={() => onTab("data")}
          icon={<PieChart className="size-5" strokeWidth={tab === "data" ? 2.4 : 1.8} />}
        />
      </div>
      <span className="sr-only">{TABS.map((t) => t.label).join(", ")}</span>
    </nav>
  );
}

function NavBtn({
  active,
  label,
  icon,
  onClick,
  refEl,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  refEl: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      ref={refEl}
      type="button"
      onClick={onClick}
      className={cn(
        "relative z-10 flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl transition-colors duration-200 glow-tap",
        active ? "text-cyan" : "text-muted",
      )}
    >
      {icon}
      <span className="font-display text-[10px] font-medium tracking-wide">{label}</span>
    </button>
  );
}
