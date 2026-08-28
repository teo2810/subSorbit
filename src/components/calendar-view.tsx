import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { it } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { occursOnDay } from "@/lib/domain";
import { formatDayLong, formatEuroCompact, formatMonthTitle } from "@/lib/format";
import { BrandBadge } from "@/lib/logos";
import { SubCard } from "./sub-card";
import { ScreenHeader } from "./orbit-mark";
import type { Subscription } from "@/lib/types";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export function CalendarView({
  subscriptions,
  onOpen,
  onQuickFocus,
  onSettings,
}: {
  subscriptions: Subscription[];
  onOpen: (id: string) => void;
  onQuickFocus: (id: string) => void;
  onSettings: () => void;
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const daySubs = subscriptions.filter((s) => occursOnDay(s, selected));
  const upcoming = [...subscriptions]
    .filter((s) => s.status !== "cancelled")
    .sort(
      (a, b) =>
        new Date(a.nextRenewal).getTime() - new Date(b.nextRenewal).getTime(),
    )
    .slice(0, 6);

  return (
    <div className="mx-auto flex h-full w-full max-w-[520px] flex-col">
      <ScreenHeader onSettings={onSettings} />
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-36">
        <div className="glass-soft rounded-lg p-3">
          <div className="mb-3 flex items-center justify-between px-1">
            <button
              type="button"
              className="glow-tap flex size-10 items-center justify-center rounded-full bg-white/6"
              onClick={() => setMonth((m) => subMonths(m, 1))}
              aria-label="Mese precedente"
            >
              <ChevronLeft className="size-5" />
            </button>
            <h2 className="font-display text-sm font-semibold capitalize">
              {formatMonthTitle(month)}
            </h2>
            <button
              type="button"
              className="glow-tap flex size-10 items-center justify-center rounded-full bg-white/6"
              onClick={() => setMonth((m) => addMonths(m, 1))}
              aria-label="Mese successivo"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="py-1 text-[10px] font-medium tracking-wide text-faint"
              >
                {d}
              </div>
            ))}
            {days.map((day) => {
              const inMonth = isSameMonth(day, month);
              const sel = isSameDay(day, selected);
              const today = isSameDay(day, new Date());
              const hits = subscriptions.filter((s) => occursOnDay(s, day));
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelected(day)}
                  className={cn(
                    "relative flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[12px] tabular-nums",
                    !inMonth && "text-faint/50",
                    sel && "bg-cyan text-void",
                    !sel && today && "shadow-[0_0_0_1px_rgba(34,211,238,0.7)]",
                    !sel && inMonth && "text-fg",
                  )}
                >
                  {format(day, "d", { locale: it })}
                  {inMonth && hits.length > 0 ? (
                    <span className="flex items-center justify-center">
                      {hits.slice(0, 2).map((h, i) => (
                        <span
                          key={h.id}
                          className={i > 0 ? "-ml-1" : ""}
                          style={{ zIndex: 2 - i }}
                        >
                          <BrandBadge brandKey={h.brandKey} size={12} />
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="h-3" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <h3 className="mt-5 mb-2 font-display text-sm font-medium">
          Rinnovi · {formatDayLong(selected)}
        </h3>
        {daySubs.length === 0 ? (
          <p className="mb-4 text-sm text-muted">Nessun rinnovo in questo giorno.</p>
        ) : (
          <div className="mb-4 space-y-2">
            {daySubs.map((s) => (
              <SubCard
                key={s.id}
                sub={s}
                onOpen={() => onOpen(s.id)}
                onQuickFocus={() => onQuickFocus(s.id)}
              />
            ))}
            <p className="text-xs text-muted">
              Totale del giorno{" "}
              <span className="tabular-nums text-fg">
                {formatEuroCompact(daySubs.reduce((a, s) => a + s.price, 0))}
              </span>
            </p>
          </div>
        )}

        <h3 className="mt-2 mb-2 font-display text-sm font-medium">
          Prossimi rinnovi
        </h3>
        <div className="space-y-2">
          {upcoming.map((s) => (
            <SubCard
              key={s.id}
              sub={s}
              onOpen={() => onOpen(s.id)}
              onQuickFocus={() => onQuickFocus(s.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
