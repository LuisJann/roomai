"use client";

import { useEffect, useState } from "react";
import { BeforeAfterSlider } from "@/components/workspace/BeforeAfterSlider";
import { cn } from "@/lib/utils";
import { 
  Download, Share2, Sliders, ShieldCheck, 
  Trash2, Sparkles, HelpCircle, CheckSquare, Square, 
  DollarSign, ListTodo, ChevronRight, CornerDownRight
} from "lucide-react";
import Link from "next/link";
import { useWorkspaceStore } from "@/store/workspaceStore"; // <-- IMPORTATO LO STORE

interface FurnitureItem {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  status: "keep" | "evaluate" | "replace" | "proposed";
}

export default function ResultsPage() {
  const [restylingLevel, setRestylingLevel] = useState<"light" | "medium" | "complete">("medium");
  const [reuseMax, setReuseMax] = useState(false);
  const [budget, setBudget] = useState(1200);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isRendering, setIsRendering] = useState(false);

  const triggerRenderSimulation = () => {
    setIsRendering(true);
    setTimeout(() => setIsRendering(false), 2000);
  };

  // Room config state (loaded from localStorage or defaults)
  const [roomName, setRoomName] = useState("Il mio Soggiorno");
  const [roomType, setRoomType] = useState("soggiorno");
  const [length, setLength] = useState(450);
  const [width, setWidth] = useState(350);
  const [height, setHeight] = useState(270);
  const [doors, setDoors] = useState(1);
  const [windows, setWindows] = useState(2);
  
  const [photosCount, setPhotosCount] = useState(4);
  const [userPhotos, setUserPhotos] = useState<Array<{ url: string; edgeUrl: string; name: string }>>([]);

  // Style Directives state
  const [styleDirectives, setStyleDirectives] = useState<Array<{
    id: string;
    name: string;
    status: "add" | "avoid" | "neutral";
  }>>([
    { id: "d1", name: "Illuminazione Ambientale Calda", status: "neutral" },
    { id: "d2", name: "Piante da Interno (Verde)", status: "neutral" },
    { id: "d3", name: "Materiali Naturali (Legno/Pietra)", status: "neutral" },
    { id: "d4", name: "Tappeti di Design", status: "neutral" },
    { id: "d5", name: "Quadri e Arte Moderna", status: "neutral" },
    { id: "d6", name: "Pareti con Colori d'Accento", status: "neutral" },
    { id: "d7", name: "Tende e Tessuti Morbidi", status: "neutral" },
    { id: "d8", name: "Mobili Sospesi Minimal", status: "neutral" },
    { id: "d9", name: "Lampadari a Sospensione Centrali", status: "neutral" },
    { id: "d10", name: "Tonalità Indaco/Blu", status: "neutral" }
  ]);

  const photosFromStore = useWorkspaceStore(state => state.photos);
  const dimensionsFromStore = useWorkspaceStore(state => state.dimensions);
  const detectedFurnitureFromStore = useWorkspaceStore(state => state.detectedFurniture);
  const geminiApiKey = useWorkspaceStore(state => state.geminiApiKey);
  const incrementFreeGenerations = useWorkspaceStore(state => state.incrementFreeGenerations);
  const addNotification = useWorkspaceStore(state => state.addNotification);
  const removeNotification = useWorkspaceStore(state => state.removeNotification);
  const addPendingTask = useWorkspaceStore(state => state.addPendingTask);
  const removePendingTask = useWorkspaceStore(state => state.removePendingTask);
  const saveRender = useWorkspaceStore(state => state.saveRender);
  const pendingTasks = useWorkspaceStore(state => state.pendingTasks);

  const [realAfterImage, setRealAfterImage] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isReviewingPrompt, setIsReviewingPrompt] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState("");
  const isRealGenerating = pendingTasks.some(t => t.type === "render");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (dimensionsFromStore) {
        setRoomName(dimensionsFromStore.roomName || "Il mio Soggiorno");
        setRoomType(dimensionsFromStore.roomType || "soggiorno");
        setLength(dimensionsFromStore.manual?.length || 450);
        setWidth(dimensionsFromStore.manual?.width || 350);
        setHeight(dimensionsFromStore.manual?.height || 270);
        setDoors(dimensionsFromStore.manual?.doors || 1);
        setWindows(dimensionsFromStore.manual?.windows || 2);
      } else {
        const storedDims = localStorage.getItem("roomai_dimensions");
        if (storedDims) {
          try {
            const dims = JSON.parse(storedDims);
            setRoomName(dims.roomName || "Il mio Soggiorno");
            setRoomType(dims.roomType || "soggiorno");
            setLength(dims.manual?.length || 450);
            setWidth(dims.manual?.width || 350);
            setHeight(dims.manual?.height || 270);
            setDoors(dims.manual?.doors || 1);
            setWindows(dims.manual?.windows || 2);
          } catch (e) {}
        }
      }

      if (photosFromStore && photosFromStore.length > 0) {
        setPhotosCount(photosFromStore.length);
        setUserPhotos(photosFromStore);
      }
    }
  }, [photosFromStore, dimensionsFromStore, detectedFurnitureFromStore]);

  const toggleDirectiveStatus = (id: string, newStatus: "add" | "avoid" | "neutral") => {
    setStyleDirectives(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
    triggerRenderSimulation();
  };

  const getDynamicAdvice = () => {
    const advices = [];

    if (restylingLevel === "light") {
      advices.push({
        title: "Intervento Conservativo",
        desc: `L'AI focalizzerà il budget su complementi (tessili, illuminazione) per rinfrescare l'ambiente mantenendo la struttura base.`
      });
    } else if (restylingLevel === "medium") {
      advices.push({
        title: "Bilanciamento Spazi & Funzioni",
        desc: "Sostituendo alcuni elementi chiave, apriamo spazio per arredi visivamente più leggeri e moderni."
      });
    } else {
      advices.push({
        title: "Rinnovo Architettonico Completo",
        desc: "L'AI consiglia un totale stravolgimento dei volumi e dei colori per un impatto visivo estremo e lussuoso."
      });
    }

    if (budget < 800) {
      advices.push({
        title: "Ottimizzazione Low-Budget",
        desc: "Con budget ridotto, evita acquisti strutturali. Concentrati sulla pittura fai-da-te delle pareti e sul riposizionamento strategico del tavolo da pranzo."
      });
    } else {
      advices.push({
        title: "Investimento Qualità",
        desc: `Con budget di €${budget}, suggeriamo l'acquisto di una poltrona di design e di un tappeto a pelo corto per definire visivamente l'area conversazione.`
      });
    }

    return advices;
  };

  const getPracticalChecklist = () => {
    const list = [
      { text: "Pittura parete di fondo (effetto accento)", priority: "Media", cost: "Economico" },
      { text: "Riposizionamento divano a 25cm dalla parete Est", priority: "Alta", cost: "Gratis" }
    ];

    if (styleDirectives.find(m => m.name.includes("Illuminazione") && m.status === "add")) {
      list.push({ text: "Acquisto lampade a luce calda (2700K)", priority: "Alta", cost: "Medio" });
    }

    if (restylingLevel !== "light") {
      list.push({ text: "Acquisto tappeto materico 240x180 cm", priority: "Bassa", cost: "Variabile" });
    }

    if (restylingLevel === "complete") {
      list.push({ text: "Installazione punto luce decentrato sopra il tavolo", priority: "Media", cost: "Impegnativo" });
    }

    return list;
  };

  const currentPhoto = userPhotos.length > 0 ? userPhotos[selectedPhotoIndex] : null;
  const beforeImage = currentPhoto ? currentPhoto.url : "/modern_living_room_before.png";
  const afterImage = realAfterImage || beforeImage;
  const overlayImage = realAfterImage ? undefined : (currentPhoto ? currentPhoto.edgeUrl : undefined);

  const getAfterFilter = () => {
    const addedCount = styleDirectives.filter(m => m.status === "add").length;
    if (budget > 3000 && restylingLevel === "complete") return "contrast(1.1) saturate(1.2)";
    if (restylingLevel === "light" && addedCount === 0) return "brightness(1.05)";
    if (addedCount > 2) return "hue-rotate(-5deg) saturate(1.1)";
    return "brightness(1.1) contrast(1.05)";
  };

  const prepareGeneration = () => {
    if (!currentPhoto?.url) {
      alert("Nessuna foto disponibile per la generazione.");
      return;
    }

    const taskId = `render_${Date.now()}`;
    addNotification({ id: taskId, message: "Analisi della stanza in corso...", type: "info" });
    addPendingTask({ id: taskId, type: "render", status: "loading" });

    (async () => {
      try {
        const visionRes = await fetch("/api/vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: currentPhoto.url,
          }),
        });

        const visionData = await visionRes.json();

        if (!visionRes.ok) {
          throw new Error(visionData.error || "Errore durante l'analisi visiva della stanza.");
        }

        let roomDescription = visionData.description || "";
        
        const addItems = styleDirectives.filter(m => m.status === "add").map(m => m.name).join(", ");
        const avoidItems = styleDirectives.filter(m => m.status === "avoid").map(m => m.name).join(", ");
        const instructions = `MUST ADD: ${addItems || "None"}. MUST STRICTLY AVOID: ${avoidItems || "None"}. MAXIMUM BUDGET: €${budget}. User custom request: ${customPrompt || "None"}`;

        const finalPrompt = `BASE_STRUCTURE: ${roomDescription} | STYLE_OVERRIDE: ${restylingLevel} restyling, modern, clean, architectural digest, 8k resolution | USER_INSTRUCTION: ${instructions}. Generate a photorealistic interior design strictly following the base structure and applying the style and instructions.`;
        
        setDraftPrompt(finalPrompt);
        setIsReviewingPrompt(true);
        removePendingTask(taskId);
        removeNotification(taskId);
      } catch (err: any) {
        console.error(err);
        addNotification({ 
          id: taskId,
          message: `Errore Visione: ${err.message}`, 
          type: "error"
        });
        removePendingTask(taskId);
        removeNotification(taskId);
      }
    })();
  };

  const confirmGeneration = () => {
    setIsReviewingPrompt(false);
    const taskId = `render_final_${Date.now()}`;
    addNotification({ id: taskId, message: "Generazione Render Finale avviata...", type: "info" });
    addPendingTask({ id: taskId, type: "render", status: "loading" });

    (async () => {
      try {
        const genRes = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: draftPrompt }),
        });

        const genData = await genRes.json();

        if (!genRes.ok) {
           throw new Error(genData.error || "Errore durante la generazione dell'immagine.");
        }

        const finalUrl = genData.outputUrl;
        try {
          await fetch('/api/gallery/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: finalUrl, type: 'render' })
          });
        } catch (err) {
          console.error("Failed to save render to DB:", err);
        }
        incrementFreeGenerations();
        
        addNotification({ 
          id: taskId,
          message: `Restyling Gratuito completato!`, 
          type: "success",
          link: "/workspace/gallery"
        });
        
        setRealAfterImage(finalUrl);
      } catch (err: any) {
        console.error(err);
        addNotification({ 
          id: taskId,
          message: `Errore Generazione: ${err.message}`, 
          type: "error"
        });
      } finally {
        removePendingTask(taskId);
      }
    })();
  };

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-900 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{roomName}</h1>
            <span className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Accuratezza Stima: 85%
            </span>
          </div>
          <p className="text-xs text-foreground/50 mt-1">
            Tipo: <span className="capitalize font-semibold">{roomType}</span> • Elaborato con {photosCount} foto reali + Misure geometriche {length}x{width}x{height} cm
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={prepareGeneration}
            disabled={isRealGenerating}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
            )}
          >
            {isRealGenerating ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {isRealGenerating ? "Elaborazione Cloud..." : "Genera Restyling (Gratis)"}
          </button>
          
          <button 
            onClick={() => alert("Salvataggio layout in formato PDF completato.")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Esporta
          </button>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Viewport Container */}
        <div className="lg:col-span-7 space-y-4">          
          {/* Top Bar for Results View */}
          <div className="flex justify-between items-center bg-surface border border-gray-200 dark:border-gray-800 rounded-2xl p-2 shadow-sm">
            <div className="flex gap-2">
              <div className="px-4 py-2 rounded-xl text-xs font-bold bg-foreground text-background">
                Render Prima / Dopo
              </div>
            </div>
          </div>

          {/* Render Viewer Wrapper */}
          <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl p-3 shadow-sm overflow-hidden flex flex-col gap-3">
            <div className="relative min-h-[350px] flex items-center justify-center rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-900">
              {isRendering && !isRealGenerating && (
                <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
                  <Sparkles className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                  <p className="text-sm font-bold animate-pulse">Aggiornamento ologrammi AR...</p>
                  <p className="text-[10px] text-foreground/50 mt-1">Calcolo posizioni in tempo reale</p>
                </div>
              )}
              {isRealGenerating && (
                <div className="absolute inset-0 z-20 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center">
                  <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-pulse" />
                    <div className="absolute inset-0 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-sm font-bold animate-pulse text-blue-500">GPU al lavoro in background...</p>
                  <p className="text-[10px] text-foreground/50 mt-2 font-mono">Puoi navigare in altre pagine. Notifica al completamento.</p>
                </div>
              )}

              <div className="w-full">
                {beforeImage && beforeImage.length > 0 ? (
                  <BeforeAfterSlider 
                    beforeImage={beforeImage}
                    afterImage={afterImage}
                    afterFilter={realAfterImage ? "none" : getAfterFilter()}
                    overlayImage={overlayImage}
                    proposedChanges={[]}
                  />
                ) : (
                  <div className="w-full h-80 flex items-center justify-center text-center">
                    <div className="space-y-3 max-w-sm">
                      <p className="text-sm text-foreground/60 font-medium">Foto non caricate</p>
                      <p className="text-xs text-foreground/40">Torna al step 1 per caricare le foto della tua stanza e vedrai il preview qui.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Photo Gallery thumbnails */}
            {userPhotos.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 px-1 custom-scrollbar">
                {userPhotos.map((photo, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setSelectedPhotoIndex(idx); triggerRenderSimulation(); }}
                    className={cn(
                      "relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all",
                      selectedPhotoIndex === idx ? "border-blue-500 shadow-md scale-105" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={photo.url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Honesty disclaimer footer */}
          <div className="p-3.5 bg-gray-50 dark:bg-gray-900/30 border border-gray-200/50 dark:border-gray-800/50 rounded-2xl text-[10px] text-foreground/50 leading-relaxed">
            💡 <strong>Disclaimer di Confidenza AI:</strong> I modelli 3D e i render vengono calcolati proiettando le coordinate 2D delle foto nello spazio metrico. Per gli acquisti strutturali, verifica sempre le dimensioni sul posto con un metro tradizionale.
          </div>
        </div>

        {/* Right Side: Design Settings & Suggestions */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Restyling Level Selector */}
          <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm space-y-3.5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-blue-500 flex items-center gap-1.5">
              <Sliders className="w-4 h-4" /> Livello di Intervento Restyling
            </h3>
            
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "light", name: "Leggero", desc: "Arredi intatti" },
                { id: "medium", name: "Medio", desc: "Qualche cambio" },
                { id: "complete", name: "Completo", desc: "Rilayout totale" }
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => { setRestylingLevel(l.id as any); triggerRenderSimulation(); }}
                  className={cn(
                    "p-3 rounded-2xl border text-center transition-all flex flex-col justify-between min-h-[60px]",
                    restylingLevel === l.id 
                      ? "border-foreground bg-foreground/5 dark:bg-foreground/5 font-semibold" 
                      : "border-gray-200 dark:border-gray-800 text-foreground/60 hover:bg-surface-hover/30"
                  )}
                >
                  <span className="text-xs font-bold block">{l.name}</span>
                  <span className="text-[9px] text-foreground/40 block mt-0.5">{l.desc}</span>
                </button>
              ))}
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
              <label className="text-xs font-semibold text-foreground/80 mb-2 block">Istruzioni Personalizzate (Opzionale)</label>
              <textarea 
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="es. Aggiungi un vaso rosso sul tavolo, cambia il divano in pelle nera..."
                className="w-full bg-background border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
              />
            </div>
          </div>

          {/* Style Directives Editor */}
          <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-foreground/80">
                Direttive di Arredo
              </h3>
            </div>

            <div className="space-y-3">
              {styleDirectives.map((dir) => (
                <div key={dir.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-background border border-gray-200 dark:border-gray-800 rounded-xl">
                  <span className="text-xs font-semibold text-foreground/90 truncate">{dir.name}</span>
                  
                  <div className="flex gap-1.5 self-end sm:self-center">
                    {[
                      { id: "add", label: "Aggiungi", color: "text-green-600 bg-green-500/10 border-green-500/30" },
                      { id: "neutral", label: "Indifferente", color: "text-gray-500 bg-gray-500/10 border-gray-500/30" },
                      { id: "avoid", label: "Evita", color: "text-red-600 bg-red-500/10 border-red-500/30" }
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleDirectiveStatus(dir.id, s.id as any)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all",
                          dir.status === s.id 
                            ? s.color 
                            : "bg-surface-hover/30 border-transparent text-foreground/50 hover:text-foreground"
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget Slider */}
          <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-foreground/80 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-green-500" /> Budget Stimato
              </h3>
              <span className="text-xs font-bold text-green-500">€ {budget}</span>
            </div>
            <input 
              type="range" 
              min={100} 
              max={5000} 
              step={100}
              value={budget}
              onChange={(e) => setBudget(parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-foreground"
            />
            <div className="flex justify-between text-[9px] text-foreground/40 font-semibold">
              <span>€ 100</span>
              <span>€ 5.000+</span>
            </div>
          </div>

          {/* Suggestions Accordions */}
          <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-foreground/80 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-500" /> Consigli di Design
            </h3>

            <div className="space-y-3">
              {getDynamicAdvice().map((advice, idx) => (
                <div key={idx} className="p-3 bg-background border border-gray-200 dark:border-gray-800 rounded-xl space-y-1">
                  <h4 className="text-xs font-bold flex items-center gap-1 text-foreground/90">
                    <ChevronRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    {advice.title}
                  </h4>
                  <p className="text-[11px] text-foreground/60 leading-relaxed pl-4">
                    {advice.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable checklist */}
          <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-foreground/80 flex items-center gap-1.5">
              <ListTodo className="w-4 h-4 text-orange-500" /> Checklist Interventi
            </h3>

            <div className="space-y-2.5">
              {getPracticalChecklist().map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <input 
                    type="checkbox" 
                    className="rounded text-blue-500 w-4 h-4 mt-0.5 focus:ring-0" 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground/80 leading-snug">{item.text}</p>
                    <div className="flex gap-2 text-[9px] font-semibold text-foreground/40 mt-1">
                      <span>Priorità: {item.priority}</span>
                      <span>•</span>
                      <span>Costo: {item.cost}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      <div className="text-center pt-8">
        <Link 
          href="/workspace"
          className="text-xs font-bold text-foreground/60 hover:text-foreground hover:underline flex items-center justify-center gap-1 transition-colors"
        >
          ← Torna al workspace per caricare un altro progetto
        </Link>
      </div>

      {/* Prompt Review Modal */}
      {isReviewingPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xl max-w-2xl w-full space-y-4">
            <h3 className="font-bold text-lg text-foreground">Revisione Prompt AI</h3>
            <p className="text-xs text-foreground/60">
              Gemini ha analizzato la stanza e generato le seguenti istruzioni. Puoi ispezionarle e modificarle manualmente prima di inviarle al motore grafico per il render finale.
            </p>
            <textarea
              value={draftPrompt}
              onChange={(e) => setDraftPrompt(e.target.value)}
              className="w-full h-48 bg-background border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsReviewingPrompt(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-foreground/70 hover:bg-foreground/5 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={confirmGeneration}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
              >
                Conferma e Genera
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}