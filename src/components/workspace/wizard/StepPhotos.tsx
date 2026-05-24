"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Upload, Camera, Smartphone, AlertCircle, CheckCircle2, 
  X, RefreshCw, SmartphoneIcon, Info, HelpCircle, Eye, EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface StepPhotosProps {
  onNext: (photos: { url: string; edgeUrl: string; name: string }[]) => void;
}

interface UploadedPhoto {
  id: string;
  name: string;
  url: string;
  edgeUrl: string;
  showEdges: boolean;
  size: string;
  quality: "eccellente" | "accettabile" | "insufficiente";
  suggestions: string[];
  isDuplicate: boolean;
  brightness: number;
}

export function StepPhotos({ onNext }: StepPhotosProps) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(true);
  
  // Pairing session states
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [macIp, setMacIp] = useState("");
  const [macPort, setMacPort] = useState("3000");
  const [isContinuityOpen, setIsContinuityOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const removedIdsRef = useRef<Set<string>>(new Set());

  // Initialize pairing session & IP defaults
  useEffect(() => {
    if (typeof window !== "undefined") {
      setMacPort(window.location.port || "3000");
      setMacIp(window.location.hostname);
    }

    const startSession = async () => {
      try {
        const storedSessionId = localStorage.getItem("roomai_sessionId");
        if (storedSessionId) {
          setSessionId(storedSessionId);
          return;
        }

        const res = await fetch("/api/session/new");
        if (res.ok) {
          const data = await res.json();
          setSessionId(data.sessionId);
          if (data.macIp && data.macIp !== "localhost" && data.macIp !== "127.0.0.1") {
            setMacIp(data.macIp);
          }
        }
      } catch (err) {
        console.error("Errore inizializzazione sessione di pairing:", err);
      }
    };

    const storedRemoved = localStorage.getItem("roomai_removed_ids");
    if (storedRemoved) {
      removedIdsRef.current = new Set(JSON.parse(storedRemoved));
    }

    startSession();
  }, []);

  // Poll for all photos uploaded from iPhone OR desktop via session API
  useEffect(() => {
    if (!sessionId) return;

    const pollSession = async () => {
      try {
        const res = await fetch(`/api/session/poll?sessionId=${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          const remotePhotos = data.photos || [];

          setPhotos(prev => {
            const updated = [...prev];
            let modified = false;

            for (const rPhoto of remotePhotos) {
              const exists = prev.some(p => p.id === rPhoto.id);
              if (!exists && !removedIdsRef.current.has(rPhoto.id)) {
                modified = true;
                updated.push({
                  id: rPhoto.id,
                  name: rPhoto.name,
                  url: rPhoto.url,
                  edgeUrl: rPhoto.url, 
                  showEdges: false,
                  size: rPhoto.size,
                  quality: "eccellente",
                  suggestions: ["Caricamento analisi..."],
                  isDuplicate: false,
                  brightness: 120
                });
                analyzeImageFromUrl(rPhoto.url, rPhoto.id);
              }
            }

            return modified ? updated : prev;
          });
        }
      } catch (err) {
        console.error("Errore polling foto:", err);
      }
    };

    const interval = setInterval(pollSession, 1500);
    return () => clearInterval(interval);
  }, [sessionId]);

  const guidelines = [
    {
      title: "Almeno 4 angolazioni",
      desc: "Fotografa la stanza da ogni angolo per consentire la ricostruzione prospettica 3D.",
      icon: "📐"
    },
    {
      title: "Inquadra bene i dettagli",
      desc: "Assicurati di mostrare chiaramente pareti, pavimento, finestre, porte e pilastri.",
      icon: "🚪"
    },
    {
      title: "Evita mosso o buio",
      desc: "L'AI rileva la profondità dalle differenze di contrasto. Accendi le luci se necessario.",
      icon: "💡"
    },
    {
      title: "Angoli visibili",
      desc: "Cerca di catturare le linee di intersezione tra pareti e soffitto/pavimento.",
      icon: "🏠"
    }
  ];

  const analyzeImageFromUrl = (url: string, id: string) => {
    const img = new window.Image();
    if (!url.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.src = url;
    
    img.onload = () => {
      try {
        const analysis = runCanvasAnalysis(img);
        
        setPhotos(prev => {
          const updated = prev.map(p => {
            if (p.id === id) {
              const isDuplicate = prev.some(other => 
                other.id !== id && 
                Math.abs(other.brightness - analysis.brightness) < 3 && 
                other.size === p.size
              );

              return {
                ...p,
                edgeUrl: analysis.edgeUrl,
                quality: analysis.quality,
                suggestions: analysis.suggestions,
                brightness: analysis.brightness,
                isDuplicate
              };
            }
            return p;
          });
          return updated;
        });
      } catch (err) {
        console.error("Errore analisi canvas:", err);
      }
    };
  };

  const runCanvasAnalysis = (imgElement: HTMLImageElement) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Impossibile creare il contesto Canvas");

    const maxW = 320;
    let w = imgElement.naturalWidth || 640;
    let h = imgElement.naturalHeight || 480;
    
    h = Math.round((h * maxW) / w);
    w = maxW;

    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(imgElement, 0, 0, w, h);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let sumLum = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];
      sumLum += 0.299 * r + 0.587 * g + 0.114 * b;
    }
    const brightness = Math.round(sumLum / (data.length / 4));

    const gray = new Uint8Array(w * h);
    for (let i = 0; i < data.length; i += 4) {
      gray[i / 4] = Math.round(0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
    }

    const edgeCanvas = document.createElement("canvas");
    edgeCanvas.width = w;
    edgeCanvas.height = h;
    const edgeCtx = edgeCanvas.getContext("2d")!;
    const edgeImgData = edgeCtx.createImageData(w, h);
    const edgeData = edgeImgData.data;

    let edgeSum = 0;

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;

        const gx =
          -1 * gray[(y - 1) * w + (x - 1)] + 1 * gray[(y - 1) * w + (x + 1)] +
          -2 * gray[y * w + (x - 1)]       + 2 * gray[y * w + (x + 1)] +
          -1 * gray[(y + 1) * w + (x - 1)] + 1 * gray[(y + 1) * w + (x + 1)];

        const gy =
          -1 * gray[(y - 1) * w + (x - 1)] - 2 * gray[(y - 1) * w + x] - 1 * gray[(y - 1) * w + (x + 1)] +
          1 * gray[(y + 1) * w + (x - 1)]  + 2 * gray[(y + 1) * w + x] + 1 * gray[(y + 1) * w + (x + 1)];

        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edgeSum += magnitude;

        const edgeIdx = idx * 4;
        const val = Math.min(255, magnitude);
        edgeData[edgeIdx] = Math.round(val * 0.2);
        edgeData[edgeIdx+1] = Math.round(val * 0.6);
        edgeData[edgeIdx+2] = Math.round(val);
        edgeData[edgeIdx+3] = 255;
      }
    }
    edgeCtx.putImageData(edgeImgData, 0, 0);

    const avgEdge = edgeSum / (w * h);

    const suggestions: string[] = [];
    let quality: "eccellente" | "accettabile" | "insufficiente" = "eccellente";

    if (brightness < 65) {
      quality = "insufficiente";
      suggestions.push("Immagine troppo buia. Accendi le luci della stanza per ricostruire la geometria.");
    } else if (brightness > 215) {
      quality = "accettabile";
      suggestions.push("Luce molto intensa (sovraesposizione). I dettagli d'angolo potrebbero perdersi.");
    } else {
      suggestions.push("Luminosità ottimale.");
    }

    if (avgEdge < 12) {
      quality = quality === "insufficiente" ? "insufficiente" : "accettabile";
      suggestions.push("Immagine sfocata o texture piatta. Inquadra pareti con mobili o contorni definiti.");
    } else {
      suggestions.push("Definizione dei contorni elevata.");
    }

    if (imgElement.naturalWidth < 600 || imgElement.naturalHeight < 400) {
      quality = "insufficiente";
      suggestions.push("Risoluzione insufficiente. Carica una foto di qualità superiore.");
    } else {
      suggestions.push("Risoluzione OK.");
    }

    return {
      brightness,
      quality,
      suggestions,
      edgeUrl: edgeCanvas.toDataURL("image/png")
    };
  };

  const handleFiles = async (fileList: FileList) => {
    if (!sessionId) {
      console.error("Nessuna sessione attiva");
      return;
    }

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + " MB";
      const fileId = Math.random().toString(36).substring(2, 9);

      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Data = reader.result as string;

          // Immediate local preview
          setPhotos(prev => {
            const exists = prev.some(p => p.id === fileId);
            if (exists) return prev;
            return [...prev, {
              id: fileId,
              name: file.name,
              url: base64Data,
              edgeUrl: base64Data,
              showEdges: false,
              size: sizeMB,
              quality: "eccellente",
              suggestions: ["Caricamento analisi..."],
              isDuplicate: false,
              brightness: 120
            }];
          });
          
          analyzeImageFromUrl(base64Data, fileId);

          try {
            await fetch(`/api/session/upload?sessionId=${sessionId}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: fileId,
                image: base64Data,
                name: file.name,
                size: sizeMB
              })
            });
          } catch (err) {
            console.error("Errore invio foto al backend:", err);
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("Errore lettura file:", err);
      }
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
    removedIdsRef.current.add(id);
    localStorage.setItem("roomai_removed_ids", JSON.stringify(Array.from(removedIdsRef.current)));
  };

  const toggleEdges = (index: number) => {
    setPhotos(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        showEdges: !updated[index].showEdges
      };
      return updated;
    });
  };

  const triggerReplace = (index: number) => {
    setReplaceIndex(index);
    replaceInputRef.current?.click();
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && replaceIndex !== null && sessionId) {
      const file = e.target.files[0];
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + " MB";
      const fileId = Math.random().toString(36).substring(2, 9);

      setPhotos(prev => {
        const targetId = prev[replaceIndex]?.id;
        if (targetId) {
          removedIdsRef.current.add(targetId);
          localStorage.setItem("roomai_removed_ids", JSON.stringify(Array.from(removedIdsRef.current)));
        }
        return prev.filter((_, idx) => idx !== replaceIndex);
      });
      setReplaceIndex(null);

      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Data = reader.result as string;

          setPhotos(prev => [...prev, {
            id: fileId,
            name: file.name,
            url: base64Data,
            edgeUrl: base64Data,
            showEdges: false,
            size: sizeMB,
            quality: "eccellente",
            suggestions: ["Caricamento analisi..."],
            isDuplicate: false,
            brightness: 120
          }]);
          
          analyzeImageFromUrl(base64Data, fileId);

          try {
            await fetch(`/api/session/upload?sessionId=${sessionId}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: fileId,
                image: base64Data,
                name: file.name,
                size: sizeMB
              })
            });
          } catch (err) {
            console.error("Errore sostituzione foto:", err);
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("Errore lettura file:", err);
      }
    }
  };

  const handleNextStep = () => {
    if (sessionId) {
      localStorage.setItem("roomai_sessionId", sessionId);
    }
    onNext(photos.map(p => ({
      url: p.url,
      edgeUrl: p.edgeUrl,
      name: p.name
    })));
  };

  const pairingUrl = sessionId 
    ? `http://${macIp}:${macPort}/mobile-upload?session=${sessionId}`
    : "";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-semibold tracking-tight mb-2">Carica le foto della stanza</h2>
        <p className="text-foreground/60 text-sm">
          Analizziamo in tempo reale i file nel browser per estrarre contorni, verificare la luminosità e garantire un calcolo 3D affidabile.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Upload & Preview Side */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFiles(e.dataTransfer.files);
              }
            }}
            className={cn(
              "border-2 border-dashed rounded-2xl p-10 text-center transition-all flex flex-col items-center justify-center min-h-[220px]",
              isDragging 
                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20" 
                : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-surface-hover/30"
            )}
          >
            <div className="w-12 h-12 rounded-full bg-surface border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-foreground/70 animate-bounce" />
            </div>
            
            <h3 className="font-semibold text-lg mb-1">Trascina le foto qui o selezionale</h3>
            <p className="text-xs text-foreground/50 mb-6 max-w-md">
              Processiamo le immagini localmente tramite algoritmi Sobel per trovare gli angoli della stanza.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-foreground text-background px-5 py-2.5 rounded-full text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
              >
                Seleziona file
              </button>
              
              <button 
                onClick={() => setIsContinuityOpen(true)}
                className="bg-surface border border-gray-200 dark:border-gray-800 text-foreground px-5 py-2.5 rounded-full text-xs font-semibold hover:bg-surface-hover active:scale-95 transition-all flex items-center gap-2"
              >
                <Smartphone className="w-4 h-4 text-blue-500" />
                Collega iPhone
              </button>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={(e) => e.target.files && handleFiles(e.target.files)} 
              multiple 
              accept="image/*"
              className="hidden" 
            />
            <input 
              type="file" 
              ref={replaceInputRef} 
              onChange={handleReplaceFile} 
              accept="image/*"
              className="hidden" 
            />
          </div>

          {/* Uploaded Photos List */}
          {photos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-2">
                <span className="text-sm font-semibold">Analisi Immagini ({photos.length})</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  photos.length >= 4 
                    ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400" 
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                )}>
                  {photos.length >= 4 
                    ? "✓ Minimo 4 angolazioni caricate" 
                    : `Carica almeno altre ${4 - photos.length} angolazioni`}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {photos.map((photo, index) => (
                  <div 
                    key={photo.id} 
                    className="flex bg-surface border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden group shadow-sm hover:shadow transition-all"
                  >
                    {/* Thumbnail/Edge Preview Toggle */}
                    <div className="relative w-28 h-28 shrink-0 bg-gray-100 dark:bg-gray-900">
                      <Image 
                        src={photo.showEdges ? photo.edgeUrl : photo.url} 
                        alt={photo.name} 
                        fill 
                        className="object-cover"
                        unoptimized
                      />
                      
                      {/* Show edge status overlay */}
                      {photo.showEdges && (
                        <div className="absolute inset-0 bg-blue-900/10 border border-blue-500/50 pointer-events-none" />
                      )}
                    </div>

                    {/* Metadata & Quality Check */}
                    <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-semibold truncate pr-4 text-foreground/90">{photo.name}</h4>
                          <button 
                            onClick={() => removePhoto(photo.id)}
                            className="text-foreground/40 hover:text-red-500 rounded p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-foreground/40 mt-0.5">{photo.size}</p>
                      </div>

                      {/* Quality indicator */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          photo.quality === "eccellente" ? "bg-green-500" :
                          photo.quality === "accettabile" ? "bg-amber-500" : "bg-red-500"
                        )} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/60">
                          {photo.quality}
                        </span>

                        {photo.isDuplicate && (
                          <span className="text-[9px] bg-red-500/10 text-red-600 dark:text-red-400 font-bold px-1.5 py-0.5 rounded">
                            Duplicato
                          </span>
                        )}
                        
                        {/* Detail tooltip */}
                        <div className="relative group/tooltip ml-auto">
                          <Info className="w-3 h-3 text-foreground/30 hover:text-foreground/60 cursor-pointer" />
                          <div className="absolute right-0 bottom-4 w-48 p-2 rounded bg-gray-900 text-white text-[10px] font-normal leading-normal opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity z-20 shadow-md">
                            <span className="font-semibold block mb-0.5">Analisi Locale:</span>
                            {photo.suggestions.map((s, si) => (
                              <span key={si} className="block">• {s}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-900 pt-1.5 mt-1.5">
                        <button 
                          onClick={() => toggleEdges(index)}
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1 border transition-all",
                            photo.showEdges 
                              ? "bg-blue-500/10 border-blue-500/30 text-blue-500" 
                              : "bg-surface-hover/30 border-gray-200 dark:border-gray-800 text-foreground/60 hover:text-foreground"
                          )}
                        >
                          {photo.showEdges ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          Contorni AI
                        </button>

                        <button 
                          onClick={() => triggerReplace(index)}
                          className="text-[10px] text-foreground/60 hover:text-foreground flex items-center gap-1 font-medium transition-colors"
                        >
                          <RefreshCw className="w-2.5 h-2.5" /> Sostituisci
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Guidelines Side */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Come Fotografare Card */}
          <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-500" />
                Guida Fotografica
              </h3>
              <button 
                onClick={() => setShowGuidelines(!showGuidelines)}
                className="text-xs text-foreground/50 hover:text-foreground transition-colors"
              >
                {showGuidelines ? "Nascondi" : "Mostra"}
              </button>
            </div>

            {showGuidelines && (
              <div className="space-y-3.5">
                {guidelines.map((guide, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-surface-hover/30 p-2.5 rounded-xl border border-gray-100/50 dark:border-gray-800/30">
                    <span className="text-xl shrink-0 mt-0.5">{guide.icon}</span>
                    <div>
                      <h4 className="text-xs font-semibold">{guide.title}</h4>
                      <p className="text-[11px] text-foreground/60 leading-normal mt-0.5">{guide.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* pairing link instructions */}
          <div className="bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-transparent border border-blue-500/20 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <SmartphoneIcon className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Pairing iPhone in tempo reale</span>
            </div>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Scatta direttamente con il telefono. Le foto scattate dall'iPhone verranno caricate istantaneamente in questa schermata tramite pairing QR locale.
            </p>
            <button 
              onClick={() => setIsContinuityOpen(true)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-2.5 text-xs font-semibold transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              Connetti iPhone tramite QR
            </button>
          </div>

        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-800">
        <div className="text-xs text-foreground/40">
          * Elaborazione Edge locale. Nessun costo di pipeline o archiviazione cloud.
        </div>
        <button
          onClick={handleNextStep}
          disabled={photos.length === 0}
          className={cn(
            "px-8 py-3 rounded-full text-xs font-semibold transition-all shadow-md flex items-center gap-2",
            photos.length === 0 
              ? "bg-foreground/10 text-foreground/30 cursor-not-allowed"
              : "bg-foreground text-background hover:scale-105 active:scale-95"
          )}
        >
          Salva e Continua <span className="text-[10px] opacity-60">Step 2 di 3</span>
        </button>
      </div>

      {/* Continuity Camera pairing Modal */}
      <AnimatePresence>
        {isContinuityOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsContinuityOpen(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl z-10 p-6 space-y-6"
            >
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-900 pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-500" />
                  <span className="font-bold text-sm">Collegamento Reale iPhone</span>
                </div>
                <button 
                  onClick={() => setIsContinuityOpen(false)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Host settings */}
                <div className="bg-background border border-gray-200 dark:border-gray-800 rounded-xl p-3.5 space-y-3">
                  <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block">Configurazione Rete Locale</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-foreground/60 block mb-1">Indirizzo IP Mac</label>
                      <input 
                        type="text" 
                        value={macIp}
                        onChange={(e) => setMacIp(e.target.value)}
                        placeholder="Es: 192.168.1.52"
                        className="w-full px-3 py-1.5 rounded bg-surface border border-gray-200 dark:border-gray-800 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-foreground/60 block mb-1">Porta Next.js</label>
                      <input 
                        type="text" 
                        value={macPort}
                        onChange={(e) => setMacPort(e.target.value)}
                        placeholder="3000"
                        className="w-full px-3 py-1.5 rounded bg-surface border border-gray-200 dark:border-gray-800 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-foreground/50 leading-relaxed pt-1">
                    ⚠️ Assicurati che l'iPhone e il Mac siano connessi alla <strong>stessa rete Wi-Fi</strong>.
                  </p>
                </div>

                {/* QR Code display */}
                {pairingUrl && (
                  <div className="text-center space-y-4">
                    <div className="bg-white p-3 rounded-2xl inline-block shadow-inner border border-gray-200 mx-auto">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pairingUrl)}`}
                        alt="Scansiona QR Code"
                        width={180}
                        height={180}
                        className="mx-auto"
                      />
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-xs">1. Scansiona il QR Code con l'iPhone</h4>
                      <p className="text-[10px] text-foreground/60 max-w-xs mx-auto">
                        Inquadra il codice per aprire la pagina mobile dedicata all'upload della camera.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-gray-900">
                      <span className="text-[9px] font-bold text-foreground/40 uppercase block mb-1">Oppure apri questo URL su iPhone:</span>
                      <a 
                        href={pairingUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-blue-500 font-mono break-all hover:underline"
                      >
                        {pairingUrl}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Waiting status */}
              <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200/30 p-3 rounded-xl flex items-center justify-center gap-2.5">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold text-blue-500 animate-pulse">In attesa di scatti da iPhone...</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}