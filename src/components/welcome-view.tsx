import { OrbitLockup } from "./orbit-mark";

export function WelcomeView({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-[#02040a] text-fg">
      <div className="relative z-10 min-h-0 flex-1">
        <img
          src={`${import.meta.env.BASE_URL}welcome-solar.jpg`}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#02040a] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#02040a] via-[#02040a]/80 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-[max(28px,env(safe-area-inset-top))] flex justify-center px-6">
          <OrbitLockup size="hero" />
        </div>
      </div>
      <div className="relative z-20 mx-auto w-full max-w-[420px] shrink-0 px-6 pt-1 pb-[max(22px,env(safe-area-inset-bottom))]">
        <h1 className="text-center font-display text-[26px] font-semibold leading-tight tracking-tight">
          Gestisci. Controlla.
          <br />
          Risparmia.
        </h1>
        <p className="mx-auto mt-3 max-w-[320px] text-center text-sm leading-relaxed text-muted">
          Tieni traccia degli abbonamenti e di quanto hai già pagato sul totale
          del mese.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="glow-tap mt-7 h-12 w-full rounded-full bg-cyan font-display text-sm font-semibold text-void"
        >
          Inizia
        </button>
        <button
          type="button"
          onClick={onStart}
          className="glow-tap mt-2 h-12 w-full rounded-full bg-white/8 font-display text-sm font-medium text-fg"
        >
          Ho già un account
        </button>
        <p className="mt-4 pb-2 text-center text-[11px] text-muted">
          <span className="text-ok">Free</span> per sempre.{" "}
          <span className="text-violet">Orbit</span> per vedere tutto.
        </p>
      </div>
    </div>
  );
}
