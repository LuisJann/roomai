"use client";

import { Lightbulb, Info, Move, Palette } from "lucide-react";

export function AdvicePanel() {
  return (
    <div className="bg-surface rounded-2xl border border-gray-200 dark:border-gray-800 p-6 h-full shadow-sm flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <Lightbulb className="w-5 h-5 text-yellow-500" />
        <h3 className="font-semibold text-lg">Consigli dell'AI</h3>
      </div>
      
      <div className="space-y-4 overflow-y-auto flex-1 pr-2">
        <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
          <div className="flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-400 font-medium text-sm">
            <Move className="w-4 h-4" /> Ottimizzazione Spazi
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            Abbiamo spostato il divano per favorire l'ingresso della luce naturale dalla grande finestra, creando un ambiente più arioso e accogliente.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30">
          <div className="flex items-center gap-2 mb-2 text-purple-700 dark:text-purple-400 font-medium text-sm">
            <Palette className="w-4 h-4" /> Palette Colori
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            I toni neutri caldi (crema e legno chiaro) contrastano i profili neri degli infissi, tipico dello stile "Modern Minimalist", bilanciando l'eleganza con il calore domestico.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
          <div className="flex items-center gap-2 mb-2 text-green-700 dark:text-green-400 font-medium text-sm">
            <Info className="w-4 h-4" /> Suggerimento Acquisto
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            Aggiungi un tappeto materico a trama grossa per delimitare l'area relax e migliorare l'acustica della stanza.
          </p>
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
        <button className="w-full bg-foreground text-background py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
          Esporta Progetto Completo
        </button>
      </div>
    </div>
  );
}
