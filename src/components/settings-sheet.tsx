import { useRef } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { CloseButton } from "./close-button";
import { parseBackupPayload } from "@/lib/domain";
import { useAppStore } from "@/lib/store";

export function SettingsSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
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

  const pickFile = () => {
    onClose();
    window.setTimeout(() => fileRef.current?.click(), 180);
  };

  const importJson = async (file: File) => {
    try {
      const data = parseBackupPayload(JSON.parse(await file.text()));
      replaceAll(data.subscriptions);
      if (data.displayName) setDisplayName(data.displayName);
      if (data.email) setEmail(data.email);
      toast.success(`Importati ${data.subscriptions.length} abbonamenti`);
    } catch {
      toast.error("File non valido");
    }
  };

  return (
    <>
    <input
      ref={fileRef}
      type="file"
      accept="application/json,.json"
      className="pointer-events-none fixed h-0 w-0 opacity-0"
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) void importJson(f);
        e.target.value = "";
      }}
    />
    {open ? (
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
            onClick={pickFile}
            className="glass-soft glow-tap flex h-12 items-center justify-center gap-2 rounded-lg text-sm"
          >
            <Upload className="size-4" /> Importa
          </button>
        </div>
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
    ) : null}
    </>
  );
}
