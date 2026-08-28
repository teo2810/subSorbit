import { useRef } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { CloseButton } from "./close-button";
import { useAppStore } from "@/lib/store";
import type { Subscription } from "@/lib/types";

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const displayName = useAppStore((s) => s.displayName);
  const email = useAppStore((s) => s.email);
  const subscriptions = useAppStore((s) => s.subscriptions);
  const setDisplayName = useAppStore((s) => s.setDisplayName);
  const setEmail = useAppStore((s) => s.setEmail);
  const replaceAll = useAppStore((s) => s.replaceAll);
  const clearSubscriptions = useAppStore((s) => s.clearSubscriptions);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportJson = () => {
    const blob = new Blob(
      [JSON.stringify({ version: 1, subscriptions, displayName, email }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orbit-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup esportato");
  };

  const importJson = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as {
        subscriptions?: Subscription[];
        displayName?: string;
        email?: string;
      };
      if (!Array.isArray(data.subscriptions)) throw new Error("formato");
      replaceAll(data.subscriptions);
      if (data.displayName) setDisplayName(data.displayName);
      if (data.email) setEmail(data.email);
      toast.success("Backup importato");
    } catch {
      toast.error("File non valido");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-void/70"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="sheet-in glass relative z-10 w-full max-w-[480px] rounded-t-xl px-5 pt-5 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Impostazioni</h2>
          <CloseButton onClick={onClose} />
        </div>
        <label className="glass-soft block rounded-lg px-4 py-3">
          <span className="text-xs text-muted">Nome</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full bg-transparent text-sm outline-none"
          />
        </label>
        <label className="glass-soft mt-2 block rounded-lg px-4 py-3">
          <span className="text-xs text-muted">Email per backup</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.it"
            className="mt-1 w-full bg-transparent text-sm outline-none placeholder:text-faint"
          />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={exportJson}
            className="glass-soft glow-tap flex h-12 items-center justify-center gap-2 rounded-lg text-sm"
          >
            <Download className="size-4" /> Esporta
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="glass-soft glow-tap flex h-12 items-center justify-center gap-2 rounded-lg text-sm"
          >
            <Upload className="size-4" /> Importa
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importJson(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => {
            clearSubscriptions();
            toast.success("Abbonamenti cancellati");
            onClose();
          }}
          className="glow-tap mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-bad/12 font-display text-sm text-bad"
        >
          <Trash2 className="size-4" /> Cancella abbonamenti
        </button>
      </div>
    </div>
  );
}
