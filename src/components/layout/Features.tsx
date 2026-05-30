"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Box, Sparkles, Lightbulb, History, X } from "lucide-react";
import { useState } from "react";

export function Features() {
  const [selectedFeature, setSelectedFeature] = useState<number | null>(null);

  const features = [
    {
      icon: <Box className="w-6 h-6 text-blue-500" />,
      title: "Editor 3D",
      badge: null,
      description: "Progetta e arreda le tue stanze interattive in 3D. Aggiungi mobili, sposta gli oggetti nello spazio e salva le configurazioni nel cloud.",
      longDescription: "Il nostro Editor 3D avanzato ti permette di creare planimetrie, importare modelli 3D esterni (.glb/.gltf) e posizionare arredi con precisione millimetrica. L'intera scena viene salvata direttamente nel tuo database Supabase, permettendoti di accedervi in futuro. L'accesso a questo strumento richiede permessi specifici rilasciati dall'Amministratore.",
      color: "bg-blue-500/10",
      border: "border-blue-500/20",
      textColor: "text-blue-500"
    },
    {
      icon: <Sparkles className="w-6 h-6 text-purple-500" />,
      title: "Modifica Immagine",
      badge: "BETA",
      description: "Sfrutta l'Intelligenza Artificiale per modificare le foto dei tuoi interni, cambiare stile o riarredare completamente con un click.",
      longDescription: "Un potentissimo strumento guidato dall'AI. Carica la foto della tua stanza e descrivi testualmente come vorresti trasformarla (es. 'stile industriale con divano in pelle nera'). L'intelligenza artificiale analizzerà le geometrie e genererà un nuovo render ultra-realistico. Essendo una funzione Beta intensiva, l'uso è strettamente regolato.",
      color: "bg-purple-500/10",
      border: "border-purple-500/20",
      textColor: "text-purple-500"
    },
    {
      icon: <Lightbulb className="w-6 h-6 text-amber-500" />,
      title: "Ispirazione AI",
      badge: null,
      description: "Esplora idee di interior design generate dall'AI e trova l'ispirazione perfetta per il tuo prossimo progetto architettonico.",
      longDescription: "A corto di idee? La galleria Ispirazione AI ti fornisce prompt pronti all'uso e generazioni visive per darti la scintilla creativa perfetta. Sfoglia migliaia di stili, dall'Art Deco al Minimalismo scandinavo, per trovare il moodboard perfetto per il tuo prossimo cliente o per la tua casa.",
      color: "bg-amber-500/10",
      border: "border-amber-500/20",
      textColor: "text-amber-500"
    },
    {
      icon: <History className="w-6 h-6 text-green-500" />,
      title: "Storico Cloud",
      badge: null,
      description: "Tutti i tuoi progetti 3D e render sono salvati e sincronizzati in sicurezza sul cloud. Accedi da qualsiasi dispositivo senza perdere dati.",
      longDescription: "Addio ai vecchi salvataggi in locale che andavano persi cambiando computer. Con lo Storico Cloud integrato in Supabase, ogni modifica viene archiviata nel tuo account. Se hai i permessi di Amministratore, questa sezione ti permette anche di visionare i progetti salvati da tutti gli altri utenti della piattaforma.",
      color: "bg-green-500/10",
      border: "border-green-500/20",
      textColor: "text-green-500"
    }
  ];

  return (
    <section className="py-24 px-4 relative z-10 bg-background/50 backdrop-blur-3xl border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Tutto ciò che ti serve per il <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Design d'Interni</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            RoomAI unisce la potenza del rendering 3D tradizionale con la velocità dell'Intelligenza Artificiale Generativa, in un unico ambiente di lavoro unificato.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-surface border border-border rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group relative flex flex-col h-full"
            >
              <div className={`w-12 h-12 rounded-2xl ${feature.color} border ${feature.border} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-bold">{feature.title}</h3>
                {feature.badge && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 uppercase tracking-widest border border-purple-500/30">
                    {feature.badge}
                  </span>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {feature.description}
              </p>
              
              <button 
                onClick={() => setSelectedFeature(index)}
                className="mt-6 inline-flex items-center text-sm font-semibold text-foreground/80 hover:text-purple-400 transition-colors cursor-pointer text-left"
              >
                Scopri di più <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedFeature !== null && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFeature(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <div className="fixed inset-0 flex items-center justify-center z-[101] p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full max-w-lg bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
              >
                <div className={`p-6 pb-0 flex justify-between items-start`}>
                  <div className={`w-14 h-14 rounded-2xl ${features[selectedFeature].color} border ${features[selectedFeature].border} flex items-center justify-center mb-4`}>
                    {features[selectedFeature].icon}
                  </div>
                  <button 
                    onClick={() => setSelectedFeature(null)}
                    className="p-2 bg-secondary rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-foreground/70" />
                  </button>
                </div>
                <div className="p-6 pt-2">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold tracking-tight">{features[selectedFeature].title}</h3>
                    {features[selectedFeature].badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 uppercase tracking-widest border border-purple-500/30">
                        {features[selectedFeature].badge}
                      </span>
                    )}
                  </div>
                  <p className="text-foreground/70 leading-relaxed text-sm">
                    {features[selectedFeature].longDescription}
                  </p>
                  <div className="mt-8">
                    <button 
                      onClick={() => setSelectedFeature(null)}
                      className="w-full py-3 rounded-xl bg-foreground text-background font-semibold hover:scale-[1.02] active:scale-95 transition-transform"
                    >
                      Chiudi Scheda
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
