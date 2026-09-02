import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  CATEGORIES,
  emptySubscription,
  FREQUENCIES,
  nextFromStart,
  nextOccurrence,
} from "@/lib/domain";
import { BrandBadge, getBrand, matchBrands } from "@/lib/logos";
import { CloseButton } from "./close-button";
import { GlassField, GlassSelect } from "./ui-fields";
import { useAppStore } from "@/lib/store";
import { formatDayLong } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { CategoryId, Frequency, Subscription } from "@/lib/types";

export function SubForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const addSubscription = useAppStore((s) => s.addSubscription);
  const initial = emptySubscription();
  const [name, setName] = useState(initial.name);
  const [category, setCategory] = useState<CategoryId>(initial.category);
  const [price, setPrice] = useState(String(initial.price));
  const [frequency, setFrequency] = useState<Frequency>(initial.frequency);
  const [startedAt, setStartedAt] = useState(initial.startedAt ?? initial.nextRenewal);
  const [brandKey, setBrandKey] = useState(initial.brandKey);
  const [notes, setNotes] = useState(initial.notes);
  const [more, setMore] = useState(true);

  const suggestions = useMemo(() => matchBrands(name), [name]);
  const brand = getBrand(brandKey);
  const tint = brandKey !== "custom" ? brand.color : "#22d3ee";
  const picked = brandKey !== "custom" || name.trim().length > 0;
  const previewNext = startedAt
    ? formatDayLong(nextOccurrence(nextFromStart(startedAt, frequency), frequency))
    : "—";

  const applyPreset = (key: string) => {
    const b = getBrand(key);
    setBrandKey(b.key);
    setName(b.name);
    setCategory(b.category);
    if (b.typicalPrice > 0) setPrice(String(b.typicalPrice));
    setFrequency(b.frequency);
  };

  const save = () => {
    const trimmed = name.trim();
    const n = Number(price.replace(",", "."));
    if (!trimmed) {
      toast.error("Serve un nome");
      return;
    }
    if (!Number.isFinite(n) || n < 0) {
      toast.error("Prezzo non valido");
      return;
    }
    if (!startedAt) {
      toast.error("Scegli una data");
      return;
    }
    const nextRenewal = nextFromStart(startedAt, frequency);
    const payload: Omit<Subscription, "id"> = {
      name: trimmed,
      category,
      price: Math.round(n * 100) / 100,
      frequency,
      nextRenewal,
      startedAt,
      status: "active",
      brandKey: brandKey || "custom",
      notes: notes.trim(),
    };
    const id = addSubscription(payload);
    toast.success("In orbita");
    onSaved(id);
  };

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
          background: `linear-gradient(180deg, ${tint}26 0%, rgb(12 17 38 / 0.97) 30%)`,
          boxShadow: `0 0 0 1px ${tint}44, 0 -14px 40px rgb(0 0 0 / 0.4)`,
          backdropFilter: "blur(22px)",
        }}
      >
        <div className="relative shrink-0 px-4 pt-4">
          {picked && brandKey !== "custom" ? (
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 overflow-hidden">
              <div className="absolute left-[70%] top-1/2 -translate-x-1/2 -translate-y-[35%] opacity-[0.13] blur-[0.5px]">
                <BrandBadge brandKey={brandKey} name={name} size={104} />
              </div>
            </div>
          ) : null}
          <div className="relative mb-3 flex items-start">
            <div className="min-w-0 flex-1 pr-10">
              <h2 className="truncate text-lg font-semibold">
                {picked && name ? name : "Nuovo abbonamento"}
              </h2>
              <p className="text-xs text-muted">Scegli un brand, il resto si compila da solo</p>
            </div>
            <CloseButton onClick={onClose} className="absolute right-0 top-0" />
          </div>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-[max(12px,env(safe-area-inset-bottom))]">
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (brandKey !== "custom" && e.target.value !== brand.name) {
                setBrandKey("custom");
              }
            }}
            placeholder="Cerca Netflix, Spotify…"
            autoComplete="off"
            className="glass-field relative mb-2 h-10 w-full px-3 text-sm"
          />
          <div className="no-scrollbar relative mb-3 flex gap-2 overflow-x-auto pb-1">
            {suggestions.slice(0, 12).map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => applyPreset(b.key)}
                className="glow-tap flex shrink-0 flex-col items-center gap-1 rounded-2xl p-1"
              >
                <BrandBadge brandKey={b.key} size={36} />
              </button>
            ))}
          </div>

          <div className="relative grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/6 px-3 py-2">
              <p className="text-[10px] text-muted">Prezzo</p>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="decimal"
                className="mt-0.5 w-full bg-transparent font-display text-sm font-medium outline-none"
              />
            </div>
            <div className="rounded-2xl bg-white/6 px-3 py-2">
              <p className="text-[10px] text-muted">Prossimo rinnovo</p>
              <p className="mt-0.5 truncate font-display text-sm font-medium">{previewNext}</p>
            </div>
          </div>

          {more && (
            <div className="relative mt-2 space-y-2">
              <GlassField label="Frequenza">
                <GlassSelect
                  value={frequency}
                  onChange={(v) => setFrequency(v as Frequency)}
                  options={FREQUENCIES.map((f) => ({ id: f.id, label: f.label }))}
                />
              </GlassField>
              <GlassField label="Data di attivazione">
                <div className="relative">
                  <input
                    type="date"
                    value={startedAt}
                    onChange={(e) => setStartedAt(e.target.value)}
                    className="glass-field h-10 w-full appearance-none px-3 pr-10 text-sm [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                  />
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                </div>
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
            </div>
          )}

          <button
            type="button"
            onClick={() => setMore((v) => !v)}
            className="mt-1 flex h-8 w-full items-center justify-center gap-1 text-xs text-muted"
          >
            Altro
            <ChevronDown className={cn("size-3.5 transition-transform", more && "rotate-180")} />
          </button>
          <button
            type="button"
            onClick={save}
            className="glow-tap mt-1 h-11 w-full rounded-2xl bg-cyan font-display text-sm font-semibold text-void"
          >
            Conferma
          </button>
        </div>
      </div>
    </div>
  );
}
