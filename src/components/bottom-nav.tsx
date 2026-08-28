import { type ReactNode } from "react";
import { CalendarDays, House, Orbit, PieChart, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import type { TabId } from "@/lib/types";

const TABS: { id: TabId; label: string; icon: typeof House }[] = [
  { id: "home", label: "Home", icon: House },
  { id: "orbit", label: "Orbita", icon: Orbit },
  { id: "calendar", label: "Agenda", icon: CalendarDays },
  { id: "data", label: "Dati", icon: PieChart },
];

export function BottomNav({
  tab,
  onTab,
  onAdd,
}: {
  tab: TabId;
  onTab: (t: TabId) => void;
  onAdd: () => void;
}) {
  return (
    <nav
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3"
      style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}
    >
      <div className="pointer-events-auto relative mx-auto flex max-w-[480px] items-end justify-between gap-1 rounded-xl px-3 pb-2 pt-2 glass">
        <NavBtn
          active={tab === "home"}
          label="Home"
          onClick={() => onTab("home")}
          icon={<House className="size-5" strokeWidth={tab === "home" ? 2.4 : 1.8} />}
        />
        <NavBtn
          active={tab === "orbit"}
          label="Orbita"
          onClick={() => onTab("orbit")}
          icon={<Orbit className="size-5" strokeWidth={tab === "orbit" ? 2.4 : 1.8} />}
        />
        <button
          type="button"
          onClick={onAdd}
          aria-label="Aggiungi abbonamento"
          className="fab-sun relative -mt-8 mb-1 flex size-[58px] items-center justify-center rounded-full text-void transition-transform duration-150 active:scale-95"
        >
          <Plus className="size-7" strokeWidth={2.6} />
        </button>
        <NavBtn
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
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl transition-colors duration-150 glow-tap",
        active ? "text-cyan" : "text-muted",
      )}
    >
      {icon}
      <span className="font-display text-[10px] font-medium tracking-wide">{label}</span>
    </button>
  );
}
