"use client";

import Link from "next/link";
import { History, LayoutGrid, ArrowRight, Calendar, Info } from "lucide-react";

export default function HistoryPage() {
  const historyItems = [
    {
      id: "soggiorno-moderno",
      name: "Soggiorno Moderno",
      type: "Soggiorno",
      dimensions: "4.5m x 3.5m x 2.7m",
      date: "Oggi, 18:30",
      status: "Completato",
      href: "/workspace/results"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Storico Progetti</h1>
        <p className="text-xs text-foreground/50 mt-1">
          Registro delle ultime elaborazioni effettuate sul tuo dispositivo. Nessun dato lascia questo computer.
        </p>
      </div>

      <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
        {historyItems.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-900">
            {historyItems.map((item) => (
              <div 
                key={item.id} 
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-hover/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground/90">{item.name}</h3>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-foreground/50 mt-1">
                      <span className="flex items-center gap-1">
                        <LayoutGrid className="w-3.5 h-3.5" /> {item.type}
                      </span>
                      <span>•</span>
                      <span>Misure: {item.dimensions}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {item.date}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <span className="text-[10px] bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 font-bold px-2.5 py-0.5 rounded-full">
                    {item.status}
                  </span>
                  
                  <Link 
                    href={item.href}
                    className="text-xs font-semibold text-foreground hover:text-blue-500 flex items-center gap-1 transition-colors"
                  >
                    Vedi Risultati <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center space-y-4">
            <History className="w-12 h-12 text-foreground/30 mx-auto" />
            <h3 className="font-semibold text-base">Nessun progetto in archivio</h3>
            <p className="text-xs text-foreground/50 max-w-xs mx-auto">
              Non hai ancora elaborato nessuna stanza. Torna al workspace per caricare le foto del primo progetto!
            </p>
            <Link 
              href="/workspace"
              className="bg-foreground text-background px-6 py-2.5 rounded-full text-xs font-semibold inline-block"
            >
              Inizia Ora
            </Link>
          </div>
        )}
      </div>

      <div className="p-4 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl text-[11px] text-foreground/70 leading-relaxed flex items-start gap-2 max-w-3xl">
        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <span>
          <strong>Nota sulla Privacy:</strong> Lo storico si basa su dati salvati nel browser. 
          Se cancelli i dati di navigazione o utilizzi la modalità in incognito, i progetti elaborati verranno persi. 
          Ricorda di esportare il progetto finale in PDF o salvare le immagini HD sul tuo computer.
        </span>
      </div>
    </div>
  );
}
