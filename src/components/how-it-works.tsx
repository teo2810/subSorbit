import {
  Circle,
  CloudFog,
  Compass,
  Grip,
  Hand,
  Orbit,
  Sparkles,
  Timer,
  Trash2,
  ZoomIn,
} from "lucide-react";
import { CloseButton } from "./close-button";

const RULES = [
  {
    icon: Circle,
    title: "Più grosso, più costoso",
    text: "La dimensione dell’icona è il peso sul totale: più spendi, più il pianeta è grande.",
  },
  {
    icon: Orbit,
    title: "Più vicino, più frequente",
    text: "La distanza dal sole segue la frequenza di rinnovo: settimanale vicino, mensile in mezzo, annuale e una tantum più lontani.",
  },
  {
    icon: Sparkles,
    title: "Più brilla, più è vicino alla scadenza",
    text: "Il bagliore e il pulse crescono verso il rinnovo. La velocità dell’orbita la scegli tu (0.5× / 1× / 2×).",
  },
  {
    icon: Compass,
    title: "Orbite concentriche",
    text: "Quattro fasce fisse: settimanale, mensile, annuale/una tantum, spazzatura. Stesso centro, ogni fascia un po’ inclinata.",
  },
  {
    icon: Sparkles,
    title: "Selezione",
    text: "Tocca un pianeta o l’icona nella barra: zoom ravvicinato, bagliore ciano ampio e pulse sull’icona piccola. Il resto si spegne.",
  },
  {
    icon: Trash2,
    title: "Orbita spazzatura",
    text: "La fascia più esterna. Ci finiscono gli abbonamenti annullati o cancellati.",
  },
  {
    icon: CloudFog,
    title: "In pausa",
    text: "Restano in orbita ma avvolti da una nube scura.",
  },
];

const GESTURES = [
  {
    icon: Hand,
    title: "Trascina",
    text: "Ruota la visuale attorno al sole.",
  },
  {
    icon: ZoomIn,
    title: "Pinch o rotellina",
    text: "Zoom avanti e indietro. Doppio tap per azzerare.",
  },
  {
    icon: Circle,
    title: "Tocca un pianeta",
    text: "Apre il pannello dei dettagli.",
  },
  {
    icon: Grip,
    title: "Long-press sulla card",
    text: "Zoom rapido sul pianeta: la telecamera lo segue lungo l’orbita.",
  },
  {
    icon: Timer,
    title: "Velocità 0.5× / 1× / 2×",
    text: "Selettori in basso a destra sulla vista orbitale.",
  },
];

export function HowItWorks({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-void/70"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="sheet-in glass relative z-10 flex max-h-[86%] w-full max-w-[480px] flex-col rounded-t-xl sm:rounded-xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="font-orbit text-[11px] font-medium tracking-[0.38em] text-cyan uppercase">
              Orbit
            </p>
            <h2 className="mt-1 text-xl font-semibold">Come funziona</h2>
          </div>
          <CloseButton onClick={onClose} />
        </div>
        <div className="no-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto px-5">
          <p className="text-sm leading-relaxed text-muted">
            Il sole è il totale mensile. Intorno, ogni abbonamento è un pianeta:
            grandezza, distanza e velocità raccontano costo, frequenza e scadenza.
          </p>
          <section>
            <h3 className="mb-2 font-display text-sm font-medium text-fg">
              Regole orbitali
            </h3>
            <ul className="space-y-2">
              {RULES.map((r) => (
                <li
                  key={r.title}
                  className="flex gap-3 rounded-2xl bg-white/4 px-3 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
                >
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-cyan/12 text-cyan">
                    <r.icon className="size-4" />
                  </span>
                  <span>
                    <span className="block font-display text-sm font-medium">
                      {r.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                      {r.text}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="mb-2 font-display text-sm font-medium text-fg">
              Interazioni
            </h3>
            <ul className="space-y-2">
              {GESTURES.map((r) => (
                <li
                  key={r.title}
                  className="flex gap-3 rounded-2xl bg-white/4 px-3 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
                >
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet/15 text-violet">
                    <r.icon className="size-4" />
                  </span>
                  <span>
                    <span className="block font-display text-sm font-medium">
                      {r.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                      {r.text}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <div className="shrink-0 px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="glow-tap h-12 w-full rounded-2xl bg-cyan font-display text-sm font-semibold text-void"
          >
            Ho capito
          </button>
        </div>
      </div>
    </div>
  );
}
