"use client";

import { useState } from "react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { Sparkles, Download, Save, Image as ImageIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const roomOptions = ["Soggiorno", "Camera da letto", "Cucina", "Bagno", "Studio", "Terrazza"];
const styleOptions = ["Moderno", "Minimalista", "Industriale", "Boho Chic", "Classico", "Scandinavo", "Cyberpunk", "Rustico"];

export default function InspirationPage() {
  const [selectedRoom, setSelectedRoom] = useState("Soggiorno");
  const [selectedStyle, setSelectedStyle] = useState("Moderno");
  const [customPrompt, setCustomPrompt] = useState("");

  const addNotification = useWorkspaceStore(state => state.addNotification);
  const addPendingTask = useWorkspaceStore(state => state.addPendingTask);
  const removePendingTask = useWorkspaceStore(state => state.removePendingTask);
  const saveInspiration = useWorkspaceStore(state => state.saveInspiration);
  
  // Controlla se c'è un task in corso
  const pendingTasks = useWorkspaceStore(state => state.pendingTasks);
  const isGenerating = pendingTasks.some(t => t.type === "inspiration");

  const handleGenerate = () => {
    const basePrompt = `A highly detailed, photorealistic interior design of a ${selectedRoom}, ${selectedStyle} style. ${customPrompt}. Architectural digest photography, 8k resolution, unreal engine 5 render, global illumination.`;
    
    const taskId = `insp_${Date.now()}`;
    addNotification({ id: taskId, message: "Generazione Ispirazione in background...", type: "info" });
    addPendingTask({ id: taskId, type: "inspiration", status: "loading" });

    // Esecuzione asincrona svincolata dal ciclo di vita del componente
    (async () => {
      try {
        const response = await fetch("/api/inspiration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: basePrompt })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Errore dal server proxy API");
        }
        
        // Save to DB permanently
        try {
          await fetch('/api/gallery/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: data.imageUrl, type: 'inspiration' })
          });
        } catch (err) {
          console.error("Failed to save inspiration to DB:", err);
        }
        
        saveInspiration(data.imageUrl);
        addNotification({ 
          id: taskId, 
          message: "Ispirazione completata con successo!", 
          type: "success", 
          link: "/workspace/gallery" 
        });
      } catch (error: any) {
        console.error("Errore generazione:", error);
        addNotification({ 
          id: taskId, 
          message: `Errore: ${error.message || "Errore durante la generazione dell'immagine"}`, 
          type: "error" 
        });
      } finally {
        removePendingTask(taskId);
      }
    })();
  };

  return (
    <div className="max-w-6xl mx-auto py-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <LightbulbIcon className="w-8 h-8 text-yellow-500" /> Cerca Ispirazione AI
        </h1>
        <p className="text-foreground/60 mt-2 max-w-2xl">
          Non sai da dove iniziare? Usa il nostro motore gratuito Text-to-Image per esplorare infinite possibilità di design. Inserisci i dettagli e l'AI genererà una stanza fotorealistica da zero per ispirarti.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm space-y-6">
          <div>
            <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block mb-2">Tipo di Stanza</label>
            <div className="flex flex-wrap gap-2">
              {roomOptions.map(room => (
                <button
                  key={room}
                  onClick={() => setSelectedRoom(room)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-semibold transition-all border",
                    selectedRoom === room 
                      ? "bg-foreground text-background border-foreground" 
                      : "bg-background text-foreground/70 border-gray-200 dark:border-gray-800 hover:border-gray-400"
                  )}
                >
                  {room}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block mb-2">Stile Architettonico</label>
            <div className="flex flex-wrap gap-2">
              {styleOptions.map(style => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-semibold transition-all border",
                    selectedStyle === style 
                      ? "bg-blue-500 text-white border-blue-500 shadow-sm" 
                      : "bg-background text-foreground/70 border-gray-200 dark:border-gray-800 hover:border-gray-400"
                  )}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block mb-2">Dettagli Aggiuntivi (Opzionale)</label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="es. Divano verde smeraldo, grande finestra con vista montagna, pavimento in legno scuro..."
              className="w-full bg-background border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-28"
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-4 py-4 font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? (
              <Sparkles className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {isGenerating ? "Generazione in background (Vedi in Galleria)" : "Genera Ispirazione (Gratis)"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LightbulbIcon(props: any) {
  return <Search {...props} />;
}
