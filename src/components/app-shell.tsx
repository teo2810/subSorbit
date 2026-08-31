import { useEffect, useMemo, useRef, useState } from "react";
import { CircleHelp } from "lucide-react";
import { Toaster } from "sonner";
import { BottomNav } from "./bottom-nav";
import { CalendarView } from "./calendar-view";
import { DataView } from "./data-view";
import { DetailSheet } from "./detail-sheet";
import { FilterChips } from "./filter-chips";
import { HomeView } from "./home-view";
import { HowItWorks } from "./how-it-works";
import { OrbitCanvas } from "./orbit-canvas";
import { ScreenHeader } from "./orbit-mark";
import { SettingsSheet } from "./settings-sheet";
import { SubForm } from "./sub-form";
import { cn } from "@/lib/cn";
import { activeMonthlyTotal, daysUntilRenewal } from "@/lib/domain";
import { formatEuroCompact } from "@/lib/format";
import { BrandBadge, preloadBrandIcons } from "@/lib/logos";
import { useAppStore, type OrbitSpeed } from "@/lib/store";
import type { StatusFilter, Subscription, TabId } from "@/lib/types";

const TAB_ORDER: TabId[] = ["home", "orbit", "calendar", "data"];

const TOAST_OPTIONS = {
  style: {
    background: "#12182e",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#eef2ff",
  },
};

export function AppShell() {
  const subscriptions = useAppStore((s) => s.subscriptions);
  const orbitSpeed = useAppStore((s) => s.orbitSpeed);
  const setSeenGuide = useAppStore((s) => s.setSeenGuide);
  const setOrbitSpeed = useAppStore((s) => s.setOrbitSpeed);

  const [tab, setTab] = useState<TabId>("home");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [guideOpen, setGuideOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef(tab);
  tabRef.current = tab;
  const blockRef = useRef({ form: false, settings: false, guide: false, detail: false });
  blockRef.current = {
    form: formOpen,
    settings: settingsOpen,
    guide: guideOpen,
    detail: Boolean(detailId),
  };

  useEffect(() => {
    preloadBrandIcons();
    const result = useAppStore.persist.rehydrate() as void | Promise<void>;
    if (result && typeof result.then === "function") void result;
  }, []);

  const monthly = activeMonthlyTotal(subscriptions);
  const detail = useMemo(
    () => subscriptions.find((s) => s.id === detailId) ?? null,
    [subscriptions, detailId],
  );

  const goTab = (t: TabId) => {
    if (t === tab) return;
    setTab(t);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 420);
  };

  const closeGuide = () => {
    setGuideOpen(false);
    setSeenGuide(true);
  };

  const quickFocus = (id: string) => {
    setDetailId(null);
    setFormOpen(false);
    goTab("orbit");
    setFocusId(id);
  };

  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const st = { x: 0, y: 0, on: false, horiz: false, period: false };
    const onStart = (e: TouchEvent) => {
      const b = blockRef.current;
      if (b.form || b.settings || b.guide || b.detail) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input,textarea,select,[data-no-swipe]")) return;
      const tabNow = tabRef.current;
      if (tabNow === "orbit") return;
      st.x = t.clientX;
      st.y = t.clientY;
      st.on = true;
      st.horiz = false;
      st.period = Boolean(target?.closest("[data-period-swipe]"));
    };
    const onMove = (e: TouchEvent) => {
      if (!st.on) return;
      const t = e.changedTouches[0] ?? e.touches[0];
      if (!t) return;
      const dx = t.clientX - st.x;
      const dy = t.clientY - st.y;
      if (!st.horiz && Math.abs(dx) + Math.abs(dy) > 10) {
        st.horiz = Math.abs(dx) > Math.abs(dy) * 1.15;
        if (!st.horiz) st.on = false;
      }
      if (st.horiz) e.preventDefault();
    };
    const onEnd = (e: TouchEvent) => {
      if (!st.on) return;
      st.on = false;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - st.x;
      const dy = t.clientY - st.y;
      if (!st.horiz || Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
      if (st.period && (tabRef.current === "home" || tabRef.current === "data")) {
        window.dispatchEvent(new CustomEvent("orbit-flip-period"));
        return;
      }
      const i = TAB_ORDER.indexOf(tabRef.current);
      if (dx < 0 && i < TAB_ORDER.length - 1) goTab(TAB_ORDER[i + 1]!);
      if (dx > 0 && i > 0) goTab(TAB_ORDER[i - 1]!);
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", () => {
      st.on = false;
    });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, []);

  const idx = TAB_ORDER.indexOf(tab);
  const openSettings = () => setSettingsOpen(true);

  return (
    <div
      ref={pageRef}
      className="relative mx-auto flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col overflow-hidden text-fg overscroll-none"
    >
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="relative h-full w-full overflow-hidden">
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ display: tab === "home" ? "block" : "none" }}
          >
            <HomeView
              subscriptions={subscriptions}
              onOpen={setDetailId}
              onQuickFocus={quickFocus}
              onSettings={openSettings}
              active={tab === "home"}
            />
          </div>
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ display: tab === "orbit" ? "block" : "none" }}
          >
            <div className="absolute inset-0 pb-24">
              <OrbitCanvas
                subscriptions={subscriptions}
                filter={filter}
                speed={orbitSpeed}
                focusId={focusId}
                pinnedId={detailId}
                onSelect={(id) => {
                  if (!id) {
                    setDetailId(null);
                    setFocusId(null);
                    return;
                  }
                  setDetailId(id);
                }}
                onFocusDone={() => setFocusId(null)}
              />
            </div>
            <header className="pointer-events-none absolute inset-x-0 top-0 z-20">
              <div className="pointer-events-auto mx-auto max-w-[720px]">
                <ScreenHeader
                  onSettings={openSettings}
                  subtitle={`Spesa mensile ${formatEuroCompact(monthly)}/mese`}
                />
                <div className="px-5">
                  <FilterChips value={filter} onChange={setFilter} />
                </div>
              </div>
            </header>
            <div className="pointer-events-none absolute inset-x-0 bottom-28 z-20 flex flex-col items-center px-4">
                <div className="pointer-events-auto mb-2 w-full max-w-[720px]">
                  <OrbitIconStrip
                    subscriptions={subscriptions}
                    filter={filter}
                    selectedId={focusId}
                    onPick={(id) => {
                      if (focusId === id) {
                        setFocusId(null);
                        return;
                      }
                      setDetailId(null);
                      setFocusId(id);
                    }}
                  />
                </div>
                <div className="flex w-full max-w-[720px] items-end justify-between">
                  <button
                    type="button"
                    onClick={() => setGuideOpen(true)}
                    className="pointer-events-auto glass-soft glow-tap flex h-10 items-center gap-1.5 rounded-full px-3 font-display text-xs text-fg"
                  >
                    <CircleHelp className="size-3.5 text-cyan" />
                    Come funziona
                  </button>
                  <div className="pointer-events-auto glass-soft flex h-10 items-center rounded-full p-1">
                    {([0.5, 1, 2] as OrbitSpeed[]).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setOrbitSpeed(v)}
                        className={cn(
                          "h-9 min-w-10 rounded-full px-2 font-display text-[11px] font-medium glow-tap",
                          orbitSpeed === v ? "bg-cyan text-void" : "text-muted",
                        )}
                      >
                        {v}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
          </div>
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ display: tab === "calendar" ? "block" : "none" }}
          >
            <CalendarView
              subscriptions={subscriptions}
              onOpen={setDetailId}
              onQuickFocus={quickFocus}
              onSettings={openSettings}
            />
          </div>
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ display: tab === "data" ? "block" : "none" }}
          >
            <DataView
              subscriptions={subscriptions}
              onOpen={setDetailId}
              onSettings={openSettings}
              active={tab === "data"}
            />
          </div>
        </div>
        {flash ? (
          <div className="tab-flash pointer-events-none absolute inset-0 z-30" />
        ) : null}
      </div>

      <BottomNav tab={tab} onTab={goTab} onAdd={() => setFormOpen(true)} />

      {detail && (
        <DetailSheet
          sub={detail}
          onClose={() => {
            setDetailId(null);
            setFocusId(null);
          }}
          onSeeOrbit={() => {
            goTab("orbit");
            setFocusId(detail.id);
          }}
        />
      )}

      {formOpen && (
        <SubForm
          onClose={() => setFormOpen(false)}
          onSaved={(id) => {
            setFormOpen(false);
            goTab("orbit");
            setFocusId(id);
          }}
        />
      )}

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <HowItWorks open={guideOpen} onClose={closeGuide} />
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={TOAST_OPTIONS}
      />
    </div>
  );
}

function OrbitIconStrip({
  subscriptions,
  filter,
  selectedId,
  onPick,
}: {
  subscriptions: Subscription[];
  filter: StatusFilter;
  selectedId: string | null;
  onPick: (id: string) => void;
}) {
  const items = subscriptions
    .filter((s) => filter === "all" || s.status === filter)
    .slice()
    .sort((a, b) => {
      const pa = a.status === "cancelled" ? 1 : a.status === "paused" ? 0.5 : 0;
      const pb = b.status === "cancelled" ? 1 : b.status === "paused" ? 0.5 : 0;
      if (pa !== pb) return pa - pb;
      return daysUntilRenewal(a) - daysUntilRenewal(b);
    });
  const ids = items.map((s) => s.id).join(",");
  const scroller = useRef<HTMLDivElement>(null);
  const unit = useRef(0);
  const jumping = useRef(false);
  const COPIES = 5;

  useEffect(() => {
    const el = scroller.current;
    if (!el || items.length === 0) return;
    const measure = () => {
      unit.current = el.scrollWidth / COPIES;
      if (unit.current <= 0) return;
      jumping.current = true;
      el.scrollLeft = unit.current * 2;
      jumping.current = false;
    };
    const onScroll = () => {
      if (jumping.current) return;
      const w = unit.current;
      if (w < 8) return;
      if (el.scrollLeft < w * 1.05) {
        jumping.current = true;
        el.scrollLeft += w;
        jumping.current = false;
      } else if (el.scrollLeft > w * (COPIES - 2.05)) {
        jumping.current = true;
        el.scrollLeft -= w;
        jumping.current = false;
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    requestAnimationFrame(measure);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [ids, items.length]);

  if (!items.length) return null;
  const loop = Array.from({ length: COPIES }, () => items).flat();
  return (
    <div
      ref={scroller}
      data-no-swipe
      className="icon-strip-scroll mx-auto w-full max-w-[720px] overflow-x-auto overflow-y-visible rounded-full bg-black/40 py-2.5"
      style={{
        touchAction: "pan-x",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <div className="flex w-max items-center gap-2 px-3">
        {loop.map((s, i) => {
          const on = selectedId === s.id;
          const days = s.status === "active" ? daysUntilRenewal(s) : null;
          return (
            <button
              key={`${s.id}-${i}`}
              type="button"
              onClick={() => onPick(s.id)}
              aria-label={s.name}
              className={cn(
                "relative size-8 shrink-0 rounded-full",
                on
                  ? "icon-pulse z-10 ring-2 ring-cyan ring-offset-2 ring-offset-void"
                  : selectedId
                    ? "opacity-30"
                    : "opacity-85",
              )}
            >
              <BrandBadge brandKey={s.brandKey} name={s.name} size={32} />
              {days !== null && days <= 7 && days < 9000 ? (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-cyan px-1 font-display text-[8px] font-semibold leading-3 text-void">
                  {days === 0 ? "oggi" : `${days}g`}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
