"use client";

import { useWorkspaceStore } from "@/store/workspaceStore";
import { Key, Wallet, Info, Lock, Save, Sparkles, AlertCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const freeGenerations = useWorkspaceStore((state) => state.freeGenerations);

  return (
    <div className="max-w-4xl mx-auto py-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" /> Impostazioni e Motori AI
        </h1>
        <p className="text-foreground/60 text-sm mt-1">
          Gestisci le credenziali dei modelli AI e monitora i tuoi consumi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-900 pb-3">
            <Key className="w-5 h-5 text-blue-500" />
            <h2 className="font-bold text-sm uppercase tracking-wider">Chiavi di Accesso API</h2>
          </div>

          <p className="text-xs text-foreground/60 leading-relaxed">
            Per garantire la massima sicurezza, la tua chiave API Google Gemini è ora configurata <strong>lato Server</strong> come Variabile d'Ambiente e non verrà mai esposta al browser.
          </p>

          <div className="mt-auto p-4 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-green-700 dark:text-green-400">Connessione Sicura Attiva</p>
              <p className="text-[10px] text-green-600/70 dark:text-green-500/70 mt-0.5">Le tue chiavi non vengono salvate localmente o inviate al client.</p>
            </div>
          </div>
        </div>

        {/* Wallet & Consumption */}
        <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col gap-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-bl-full pointer-events-none" />

          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-900 pb-3">
            <Wallet className="w-5 h-5 text-green-500" />
            <h2 className="font-bold text-sm uppercase tracking-wider">Wallet e Consumi Reali</h2>
          </div>

          <p className="text-xs text-foreground/60 leading-relaxed">
            RoomAI traccia in millisecondi il tempo esatto di esecuzione delle GPU esterne (Nvidia A40/A100) per fornirti un conteggio cristallino di quanto hai speso per i tuoi render.
          </p>

          <div className="bg-background border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mt-2 shadow-inner flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-foreground/40 mb-1 tracking-wider">Restyling Gratuiti Effettuati</p>
              <h3 className="text-3xl font-black text-green-600 dark:text-green-500 tracking-tighter">
                {freeGenerations} <span className="text-lg text-foreground/50 font-medium">/ ∞</span>
              </h3>
            </div>
            <div className="w-12 h-12 bg-green-50 dark:bg-green-950/30 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-green-500" />
            </div>
          </div>

          <div className="mt-auto p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 rounded-xl text-[10px] flex items-start gap-2 leading-relaxed">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              <strong>Media costi:</strong> Google AI Studio offre un livello gratuito immenso per gli sviluppatori: 1.500 analisi visive al giorno senza chiedere carta di credito. La generazione dell'immagine finale è invece garantita gratuitamente e illimitatamente da Pollinations.ai.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsIcon(props: any) {
  return <Settings {...props} />;
}
import { Settings, CheckCircle } from "lucide-react";
