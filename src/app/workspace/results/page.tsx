"use client";

import { useEffect, useState } from "react";
import { BeforeAfterSlider } from "@/components/workspace/BeforeAfterSlider";
import { RoomViewer3D } from "@/components/workspace/RoomViewer3D";
import { cn } from "@/lib/utils";
import { 
  Download, Share2, Layers, Sliders, ShieldCheck, 
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
  const [viewMode, setViewMode] = useState<"render" | "model3d">("render");
  const [restylingLevel, setRestylingLevel] = useState<"light" | "medium" | "complete">("medium");
  const [reuseMax, setReuseMax] = useState(false);
  const [budget, setBudget] = useState(1200);

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

  // Existing furniture state
  const [existingMobili, setExistingMobili] = useState<Array<{
    id: string;
    name: string;
    type: string;
    status: "keep" | "evaluate" | "replace";
  }>>([
    { id: "m1", name: "Divano 3 posti grigio", type: "divano", status: "keep" },
    { id: "m2", name: "Tavolo da pranzo in legno", type: "tavolo", status: "evaluate" },
    { id: "m3", name: "Mobile TV basso", type: "mobile-tv", status: "replace" },
    { id: "m4", name: "Libreria a parete bianca", type: "libreria", status: "keep" },
  ]);

  // --- INIZIO INTEGRAZIONE STORE ---
  const photosFromStore = useWorkspaceStore(state => state.photos);
  const dimensionsFromStore = useWorkspaceStore(state => state.dimensions);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Imposta le tue misure 3D
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

      // Estrai le tue VERE foto dallo store globale
      if (photosFromStore && photosFromStore.length > 0) {
        setPhotosCount(photosFromStore.length);
        setUserPhotos(photosFromStore);
      }
    }
  }, [photosFromStore, dimensionsFromStore]);
  // --- FINE INTEGRAZIONE STORE ---

  // Update all items to "keep" if "Riusa il più possibile" is checked
  useEffect(() => {
    if (reuseMax) {
      setExistingMobili(prev => prev.map(m => ({ ...m, status: "keep" })));
    }
  }, [reuseMax]);

  const toggleMobilStatus = (id: string, newStatus: "keep" | "evaluate" | "replace") => {
    if (reuseMax && newStatus !== "keep") {
      setReuseMax(false);
    }
    setExistingMobili(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
  };

  // Dynamically compute the 3D meshes based on room size & status selections
  const getFurniture3DList = (): FurnitureItem[] => {
    const list: FurnitureItem[] = [];
    const lenM = length / 100;
    const widM = width / 100;

    // Sofa (m1)
    const m1 = existingMobili.find(m => m.id === "m1");
    if (m1) {
      list.push({
        id: "m1",
        name: "Divano Grigio (Esistente)",
        type: "sofa",
        x: -lenM / 4,
        y: 0,
        z: widM / 3.5,
        w: 2.0,
        h: 0.85,
        d: 0.9,
        status: m1.status
      });
    }

    // Dining Table (m2)
    const m2 = existingMobili.find(m => m.id === "m2");
    if (m2) {
      list.push({
        id: "m2",
        name: "Tavolo Legno (Esistente)",
        type: "table",
        x: lenM / 3.5,
        y: 0,
        z: -widM / 3.5,
        w: 1.4,
        h: 0.75,
        d: 0.8,
        status: m2.status
      });
    }

    // TV Cabinet (m3)
    const m3 = existingMobili.find(m => m.id === "m3");
    if (m3) {
      list.push({
        id: "m3",
        name: "Mobile TV Basso (Esistente)",
        type: "cabinet",
        x: -lenM / 4,
        y: 0,
        z: -widM / 2.5,
        w: 1.6,
        h: 0.45,
        d: 0.45,
        status: m3.status
      });
    }

    // Bookcase (m4)
    const m4 = existingMobili.find(m => m.id === "m4");
    if (m4) {
      list.push({
        id: "m4",
        name: "Libreria Parete (Esistente)",
        type: "bookcase",
        x: -lenM / 2 + 0.15,
        y: 0,
        z: 0,
        w: 0.3,
        h: 2.0,
        d: 1.2,
        status: m4.status
      });
    }

    // AI proposed items based on levels & substitutions
    // 1. Proposed Rug (always proposed in medium/complete to anchor the room)
    if (restylingLevel !== "light") {
      list.push({
        id: "prop-rug",
        name: "Tappeto AI (Proposta)",
        type: "rug",
        x: -lenM / 4,
        y: 0.005,
        z: widM / 12,
        w: 2.4,
        h: 0.02,
        d: 1.8,
        status: "proposed"
      });
    }

    // 2. Proposed Armchair (added in medium/complete)
    if (restylingLevel !== "light") {
      list.push({
        id: "prop-chair",
        name: "Poltrona AI (Proposta)",
        type: "chair",
        x: lenM / 10,
        y: 0,
        z: widM / 4,
        w: 0.8,
        h: 0.75,
        d: 0.8,
        status: "proposed"
      });
    }

    // 3. Proposed TV Cabinet (if existing cabinet is marked "replace" or level is complete)
    const replaceTV = existingMobili.find(m => m.id === "m3")?.status === "replace";
    if (replaceTV || restylingLevel === "complete") {
      list.push({
        id: "prop-tv-cab",
        name: "Mobile Sospeso AI (Proposta)",
        type: "cabinet",
        x: -lenM / 4,
        y: 0.3, // suspended
        z: -widM / 2.6,
        w: 1.8,
        h: 0.4,
        d: 0.4,
        status: "proposed"
      });
    }

    // 4. Proposed Dining Light (if level is complete)
    if (restylingLevel === "complete") {
      list.push({
        id: "prop-light",
        name: "Sospensione AI (Proposta)",
        type: "lighting",
        x: lenM / 3.5,
        y: 1.7, // hanging
        z: -widM / 3.5,
        w: 0.6,
        h: 0.6,
        d: 0.6,
        status: "proposed"
      });
    }

    return list;
  };

  // Generate dynamic actionable advice
  const getDynamicAdvice = () => {
    const keptCount = existingMobili.filter(m => m.status === "keep").length;
    
    const advices = [];

    if (restylingLevel === "light") {
      advices.push({
        title: "Intervento Conservativo",
        desc: `Stai mantenendo ${keptCount} mobili su ${existingMobili.length}. L'AI ha focalizzato il budget su complementi (tessili, illuminazione) per rinfrescare l'ambiente senza costose demolizioni.`
      });
    } else if (restylingLevel === "medium") {
      advices.push({
        title: "Bilanciamento Spazi & Funzioni",
        desc: "Sostituendo il mobile TV esistente, abbiamo aperto spazio per una credenza sospesa visivamente più leggera, che allinea il soggiorno allo stile Modern Minimalist."
      });
    } else {
      advices.push({
        title: "Rinnovo Architettonico Completo",
        desc: "L'AI consiglia la verniciatura scura della parete attrezzata (Nord) per contrastare il divano grigio e l'inserimento di una lampada a sospensione sopra il tavolo da pranzo."
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

    if (existingMobili.find(m => m.id === "m3")?.status === "replace") {
      list.push({ text: "Rimozione mobile TV e montaggio credenza sospesa", priority: "Alta", cost: "Medio" });
    }

    if (restylingLevel !== "light") {
      list.push({ text: "Acquisto tappeto materico 240x180 cm", priority: "Bassa", cost: "Variabile" });
    }

    if (restylingLevel === "complete") {
      list.push({ text: "Installazione punto luce decentrato sopra il tavolo", priority: "Media", cost: "Impegnativo" });
    }

    return list;
  };

  const beforeImage = userPhotos.length > 0 ? userPhotos[0].url : "/modern_living_room_before.png";
  const afterImage = userPhotos.length > 0 ? userPhotos[0].url : "/modern_living_room_after.png";
  const overlayImage = userPhotos.length > 0 ? userPhotos[0].edgeUrl : undefined;

  const getAfterFilter = () => {
    if (restylingLevel === "light") {
      return "brightness(1.06) contrast(1.03) saturate(0.96)";
    } else if (restylingLevel === "medium") {
      return "brightness(1.12) contrast(1.08) saturate(0.92) sepia(0.04) hue-rotate(4deg)";
    } else {
      return "brightness(1.18) contrast(1.14) saturate(0.86) sepia(0.08) hue-rotate(-4deg)";
    }
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
            onClick={() => alert("Rendering HD in coda locale. Tempo stimato: 1 minuto.")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-gray-200 dark:border-gray-800 text-xs font-semibold hover:bg-surface-hover transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" /> Condividi
          </button>
          <button 
            onClick={() => alert("Salvataggio layout in formato PDF completato.")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Esporta Progetto
          </button>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Viewport Container */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* View Mode Tabs */}
          <div className="flex justify-between items-center bg-surface border border-gray-200 dark:border-gray-800 rounded-2xl p-2 shadow-sm">
            <div className="flex gap-2">
              <button 
                onClick={() => setViewMode("render")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  viewMode === "render" ? "bg-foreground text-background" : "text-foreground/60 hover:text-foreground"
                )}
              >
                Render Prima / Dopo
              </button>
              <button 
                onClick={() => setViewMode("model3d")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  viewMode === "model3d" ? "bg-foreground text-background" : "text-foreground/60 hover:text-foreground"
                )}
              >
                Ricostruzione 3D Metrica
              </button>
            </div>
            
            <div className="text-[10px] text-foreground/40 font-mono pr-2">
              {viewMode === "render" ? "VISTA FOTOREALISTICA STIMATA" : "VISTA INTERATTIVA WEBGL"}
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl p-3 shadow-sm overflow-hidden min-h-[350px] flex items-center justify-center">
            {viewMode === "render" ? (
              <div className="w-full">
                {beforeImage && beforeImage.length > 0 ? (
                  <BeforeAfterSlider 
                    beforeImage={beforeImage}
                    afterImage={afterImage}
                    afterFilter={getAfterFilter()}
                    overlayImage={overlayImage}
                  />
                ) : (
                  <div className="w-full h-80 bg-gray-100 dark:bg-gray-900 rounded-2xl flex items-center justify-center text-center">
                    <div className="space-y-3 max-w-sm">
                      <p className="text-sm text-foreground/60 font-medium">Foto non caricate</p>
                      <p className="text-xs text-foreground/40">Torna al step 1 per caricare le foto della tua stanza e vedrai il preview qui.</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full">
                <RoomViewer3D 
                  length={length}
                  width={width}
                  height={height}
                  doorsCount={doors}
                  windowsCount={windows}
                  furniture={getFurniture3DList()}
                />
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
                  onClick={() => setRestylingLevel(l.id as any)}
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
          </div>

          {/* Existing Furniture Editor */}
          <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-foreground/80">
                Mobili Esistenti Rilevati
              </h3>
              
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={reuseMax}
                  onChange={(e) => setReuseMax(e.target.checked)}
                  className="rounded text-blue-500 focus:ring-0 w-3.5 h-3.5"
                />
                <span className="text-[10px] font-bold text-blue-500 uppercase">Riusa il più possibile</span>
              </label>
            </div>

            <div className="space-y-3">
              {existingMobili.map((mob) => (
                <div key={mob.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-background border border-gray-200 dark:border-gray-800 rounded-xl">
                  <span className="text-xs font-semibold text-foreground/90 truncate">{mob.name}</span>
                  
                  <div className="flex gap-1.5 self-end sm:self-center">
                    {[
                      { id: "keep", label: "Mantieni", color: "text-green-600 bg-green-500/10 border-green-500/30" },
                      { id: "evaluate", label: "Valuta", color: "text-amber-600 bg-amber-500/10 border-amber-500/30" },
                      { id: "replace", label: "Sostituisci", color: "text-red-600 bg-red-500/10 border-red-500/30" }
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleMobilStatus(mob.id, s.id as any)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all",
                          mob.status === s.id 
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

    </div>
  );
}