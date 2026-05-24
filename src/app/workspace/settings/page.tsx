"use client";

import { useState } from "react";
import { Settings, Ruler, Moon, Sun, Monitor, Trash2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [defaultUnit, setDefaultUnit] = useState<"cm" | "m">("cm");
  const [qualityPreset, setQualityPreset] = useState<"standard" | "hd" | "ultra">("hd");

  const clearLocalData = () => {
    if (confirm("Sei sicuro di voler eliminare tutti i progetti e le foto salvate localmente? Questa azione non può essere annullata.")) {
      localStorage.clear();
      alert("Tutti i dati locali sono stati eliminati con successo.");
      window.location.href = "/";
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Impostazioni Applicazione</h1>
        <p className="text-xs text-foreground/50 mt-1">
          Personalizza il comportamento di RoomAI sul tuo dispositivo.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Visual Settings */}
        <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2 border-b border-gray-100 dark:border-gray-900 pb-2">
            <Moon className="w-4 h-4 text-blue-500" />
            Tema Visivo
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "light", label: "Chiaro", icon: Sun },
              { id: "dark", label: "Scuro", icon: Moon },
              { id: "system", label: "Sistema", icon: Monitor }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as any)}
                className={cn(
                  "p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-2 transition-all",
                  theme === t.id 
                    ? "bg-foreground text-background border-foreground shadow-sm" 
                    : "bg-background border-gray-200 dark:border-gray-800 hover:bg-surface-hover"
                )}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Measurement Preferences */}
        <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2 border-b border-gray-100 dark:border-gray-900 pb-2">
            <Ruler className="w-4 h-4 text-orange-500" />
            Preferenze Unità di Misura
          </h2>
          <div className="flex gap-4">
            <button
              onClick={() => setDefaultUnit("cm")}
              className={cn(
                "px-5 py-2.5 rounded-xl border text-xs font-semibold transition-all",
                defaultUnit === "cm" 
                  ? "bg-foreground text-background border-foreground" 
                  : "bg-background border-gray-200 dark:border-gray-800 hover:bg-surface-hover"
              )}
            >
              Centimetri (cm)
            </button>
            <button
              onClick={() => setDefaultUnit("m")}
              className={cn(
                "px-5 py-2.5 rounded-xl border text-xs font-semibold transition-all",
                defaultUnit === "m" 
                  ? "bg-foreground text-background border-foreground" 
                  : "bg-background border-gray-200 dark:border-gray-800 hover:bg-surface-hover"
              )}
            >
              Metri (m)
            </button>
          </div>
        </div>

        {/* AI Resolution Preset */}
        <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2 border-b border-gray-100 dark:border-gray-900 pb-2">
            <Settings className="w-4 h-4 text-purple-500" />
            Qualità Elaborazione AI
          </h2>
          <div className="space-y-3">
            {[
              { id: "standard", label: "Bilanciata (Rapida)", desc: "Minor consumo di batteria, render in 5 secondi." },
              { id: "hd", label: "Alta Definizione (Consigliata)", desc: "Ricostruzione prospettica ottimizzata, dettagli accurati." },
              { id: "ultra", label: "Ultra HD (Max Dettaglio)", desc: "Rendering ray-tracing 3D completo per texture complesse." }
            ].map((p) => (
              <label 
                key={p.id}
                className={cn(
                  "p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all hover:bg-surface-hover/30",
                  qualityPreset === p.id ? "border-foreground bg-surface-hover/40" : "border-gray-200 dark:border-gray-800"
                )}
              >
                <input 
                  type="radio" 
                  name="preset"
                  checked={qualityPreset === p.id}
                  onChange={() => setQualityPreset(p.id as any)}
                  className="mt-1"
                />
                <div>
                  <h4 className="text-xs font-bold text-foreground/90">{p.label}</h4>
                  <p className="text-[10px] text-foreground/50 mt-0.5">{p.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-red-600 dark:text-red-400 border-b border-red-500/10 pb-2">
            <ShieldAlert className="w-4 h-4" />
            Zona di Sicurezza
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-foreground/90">Elimina tutti i dati dell'applicazione</h3>
              <p className="text-[10px] text-foreground/50 mt-0.5">
                Rimuovi definitivamente la cache dei progetti, le foto caricate e le impostazioni.
              </p>
            </div>
            <button
              onClick={clearLocalData}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-center shrink-0 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Elimina Dati Locali
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
