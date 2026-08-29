import { useState } from "react";
import {
  Ban,
  ChevronDown,
  Orbit,
  Pause,
  Pencil,
  Play,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { BrandWatermark, getBrand } from "@/lib/logos";
import {
  bodyKindLabel,
  CATEGORIES,
  categoryLabel,
  classify,
  frequencyLabel,
  FREQUENCIES,
  monthlyEquivalent,
  nextFromStart,
  nextOccurrence,
  startedOf,
  statusLabel,
  activeMonthlyTotal,
} from "@/lib/domain";
import { formatDayLong, formatEuro } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/cn";
import { CloseButton } from "./close-button";
import { GlassField, GlassSelect } from "./ui-fields";
import type { CategoryId, Frequency, Subscription } from "@/lib/types";

export function DetailSheet({
  sub,
  onClose,
  onSeeOrbit,
}: {
  sub: Subscription;
  onClose: () => void;
  onSeeOrbit: () => void;
}) {
  const updateSubscription = useAppStore((s) => s.updateSubscription);
  const removeSubscription = useAppStore((s) => s.removeSubscription);
  const subscriptions = useAppStore((s) => s.subscriptions);
  const total = activeMonthlyTotal(subscriptions);
  const kind = classify(sub, total);
  const next = nextOccurrence(sub.nextRenewal, sub.frequency);
  const monthly = monthlyEquivalent(sub);
  const brand = getBrand(sub.brandKey);
  const [edit, setEdit] = useState(false);
  const [more, setMore] = useState(false);
  const [price, setPrice] = useState(String(sub.price));
  const [frequency, setFrequency] = useState<Frequency>(sub.frequency);
  const [startedAt, setStartedAt] = useState(startedOf(sub));
  const [category, setCategory] = useState<CategoryId>(sub.category);
  const [notes, setNotes] = useState(sub.notes);

  const setStatus = (status: Subscription["status"]) => {
    updateSubscription(sub.id, { status });
    if (status === "paused") toast.success("In pausa");
    if (status === "active") toast.success("Di nuovo attivo");
    if (status === "cancelled") toast.success("Annullato");
  };

  const saveEdit = () => {
    const n = Number(price.replace(",", "."));
    if (!Number.isFinite(n) || n < 0) {
      toast.error("Prezzo non valido");
      return;
    }
    const nextRenewal = nextFromStart(startedAt, frequency);
    updateSubscription(sub.id, {
      price: Math.round(n * 100) / 100,
      frequency,
      startedAt,
      nextRenewal,
      category,
      notes,
    });
    setEdit(false);
    toast.success("Aggiornato");
  };

  const weight =
    total > 0 && sub.status === "active" && sub.frequency !== "once"
      ? `${Math.round((monthly / total) * 100)}%`
      : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-void/45"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className="sheet-in relative z-10 flex max-h-[88%] w-full max-w-[480px] flex-col overflow-hidden rounded-t-xl"
        style={{
          background: `linear-gradient(180deg, ${brand.color}26 0%, rgb(12 17 38 / 0.97) 30%)`,
          boxShadow: `0 0 0 1px ${brand.color}44, 0 -14px 40px rgb(0 0 0 / 0.4)`,
          backdropFilter: "blur(22px)",
        }}
      >
        <div className="relative shrink-0 px-4 pt-4">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-[68%] overflow-hidden">
            <span
              className="absolute right-[-8%] top-[-18%] select-none font-display text-[72px] font-semibold leading-none tracking-tight text-white"
              style={{ opacity: 0.14, filter: "blur(2px)" }}
            >
              {sub.name}
            </span>
            <div className="absolute right-2 top-[-10%] h-36 w-36 opacity-50">
              <BrandWatermark brandKey={sub.brandKey} name={sub.name} />
            </div>
          </div>
          <div className="relative mb-3 flex items-start gap-2">
            <div className="min-w-0 flex-1 pr-8">
              <h2 className="truncate text-lg font-semibold">{sub.name}</h2>
              <p className="text-xs text-muted">{frequencyLabel(sub.frequency)}</p>
            </div>
            <CloseButton onClick={onClose} className="absolute right-0 top-0" />
          </div>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-[max(12px,env(safe-area-inset-bottom))]">
          {edit ? (
            <div className="relative space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <GlassField label="Prezzo €">
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    inputMode="decimal"
                    className="glass-field h-10 w-full px-3 text-sm tabular-nums"
                  />
                </GlassField>
                <GlassField label="Frequenza">
                  <GlassSelect
                    value={frequency}
                    onChange={(v) => setFrequency(v as Frequency)}
                    options={FREQUENCIES.map((f) => ({ id: f.id, label: f.label }))}
                  />
                </GlassField>
              </div>
              {more && (
                <>
                  <GlassField label="Data di attivazione">
                    <input
                      type="date"
                      value={startedAt}
                      onChange={(e) => setStartedAt(e.target.value)}
                      className="glass-field h-10 w-full px-3 text-sm"
                    />
                  </GlassField>
                  <GlassField label="Categoria">
                    <GlassSelect
                      value={category}
                      onChange={(v) => setCategory(v as CategoryId)}
                      options={CATEGORIES}
                    />
                  </GlassField>
                  <GlassField label="Nota">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="glass-field w-full resize-none px-3 py-2 text-sm"
                    />
                  </GlassField>
                </>
              )}
              <button
                type="button"
                onClick={() => setMore((v) => !v)}
                className="flex h-8 w-full items-center justify-center gap-1 text-xs text-muted"
              >
                Altro
                <ChevronDown className={cn("size-3.5 transition-transform", more && "rotate-180")} />
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="glow-tap h-11 w-full rounded-2xl font-display text-sm font-semibold text-void"
                style={{ background: brand.color }}
              >
                Salva
              </button>
            </div>
          ) : (
            <>
              <div className="relative grid grid-cols-2 gap-2">
                <Info label="Prezzo" value={formatEuro(sub.price)} />
                <Info label="Prossimo rinnovo" value={formatDayLong(next)} />
              </div>
              {more && (
                <div className="relative mt-2 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-white/6 px-3 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                    <p className="text-[10px] text-muted">Stato</p>
                    <span
                      className={cn(
                        "mt-0.5 inline-block rounded-full px-2 py-0.5 font-display text-xs font-medium",
                        sub.status === "active"
                          ? "bg-ok/15 text-ok"
                          : sub.status === "paused"
                            ? "bg-warn/15 text-warn"
                            : "bg-bad/15 text-bad",
                      )}
                    >
                      {statusLabel(sub.status)}
                    </span>
                  </div>
                  <Info label="Categoria" value={categoryLabel(sub.category)} />
                  <Info label="Corpo" value={bodyKindLabel(kind)} />
                  <Info label="Peso" value={weight} />
                  <Info label="Attivazione" value={formatDayLong(new Date(startedOf(sub)))} />
                  <Info label="Nota" value={sub.notes.trim() ? sub.notes : "—"} />
                </div>
              )}
              <div className="relative mt-3 flex items-center justify-between gap-1.5">
                <IconBtn
                  label="Modifica"
                  onClick={() => {
                    setEdit(true);
                    setMore(true);
                  }}
                >
                  <Pencil className="size-4" />
                </IconBtn>
                <IconBtn label="Vedi in orbita" onClick={onSeeOrbit}>
                  <Orbit className="size-4" />
                </IconBtn>
                {sub.status !== "paused" ? (
                  <IconBtn label="Pausa" tone="warn" onClick={() => setStatus("paused")}>
                    <Pause className="size-4" />
                  </IconBtn>
                ) : (
                  <IconBtn label="Riprendi" tone="ok" onClick={() => setStatus("active")}>
                    <Play className="size-4" />
                  </IconBtn>
                )}
                {sub.status !== "cancelled" ? (
                  <IconBtn label="Annulla" tone="bad" onClick={() => setStatus("cancelled")}>
                    <Ban className="size-4" />
                  </IconBtn>
                ) : (
                  <IconBtn label="Riattiva" tone="ok" onClick={() => setStatus("active")}>
                    <Play className="size-4" />
                  </IconBtn>
                )}
                <IconBtn
                  label="Elimina"
                  tone="bad"
                  onClick={() => {
                    removeSubscription(sub.id);
                    toast.success("Eliminato");
                    onClose();
                  }}
                >
                  <Trash2 className="size-4" />
                </IconBtn>
              </div>
              <button
                type="button"
                onClick={() => setMore((v) => !v)}
                className="mt-1 flex h-8 w-full items-center justify-center gap-1 text-xs text-muted"
              >
                Altro
                <ChevronDown className={cn("size-3.5 transition-transform", more && "rotate-180")} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="rounded-2xl bg-white/6 px-3 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
      <p className="text-[10px] text-muted">{label}</p>
      <p className="mt-0.5 truncate font-display text-sm font-medium">{value}</p>
    </div>
  );
}

function IconBtn({
  onClick,
  label,
  children,
  tone,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  tone?: "warn" | "ok" | "bad";
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "glow-tap flex size-11 flex-1 items-center justify-center rounded-2xl bg-white/8 text-fg",
        tone === "warn" && "bg-warn/15 text-warn",
        tone === "ok" && "bg-ok/15 text-ok",
        tone === "bad" && "bg-bad/12 text-bad",
      )}
    >
      {children}
    </button>
  );
}
