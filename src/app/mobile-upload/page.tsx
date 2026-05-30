"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Camera, Upload, CheckCircle2, AlertCircle, Smartphone, Sparkles, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

function MobileUploadInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");

  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{ id: string; name: string; url: string }>>([]);
  const [captureSupported, setCaptureSupported] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load already uploaded photos for this session
  useEffect(() => {
    if (!sessionId) return;

    const fetchPhotos = async () => {
      try {
        const res = await fetch(`/api/session/poll?sessionId=${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setUploadedPhotos(data.photos || []);
        }
      } catch (err) {
        console.error("Errore caricamento foto della sessione:", err);
      }
    };

    fetchPhotos();
    // Poll every 4 seconds on mobile to keep lists in sync
    const interval = setInterval(fetchPhotos, 4000);
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const input = document.createElement("input");
    input.type = "file";
    setCaptureSupported("capture" in input && !!navigator.mediaDevices);
  }, []);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !sessionId) return;
    
    setStatus("uploading");
    const file = e.target.files[0];
    
    try {
      // Compress image before sending to avoid Next.js payload limits and speed up local network
      const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const img = new window.Image();
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const MAX_WIDTH = 1920;
              let width = img.width;
              let height = img.height;

              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              ctx?.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL("image/jpeg", 0.7)); // 70% quality JPEG
            };
            img.onerror = reject;
            img.src = ev.target?.result as string;
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      const base64Data = await compressImage(file);
      
      // Calculate new size (approx)
      const sizeMB = (base64Data.length * 0.75 / (1024 * 1024)).toFixed(1) + " MB";
      
      const response = await fetch(`/api/session/upload?sessionId=${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Data,
          name: file.name || `photo-${Date.now()}.jpg`,
          size: sizeMB,
        }),
      });

      if (response.ok) {
        setStatus("success");
        const resData = await response.json();
        setUploadedPhotos(prev => [
          { id: resData.photoId, name: file.name, url: base64Data },
          ...prev
        ]);
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = "";
        setTimeout(() => setStatus("idle"), 2500);
      } else {
        const errData = await response.json();
        throw new Error(errData.error || "Impossibile caricare il file");
      }
      
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Qualcosa è andato storto.");
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h1 className="text-xl font-bold">Sessione non valida</h1>
        <p className="text-sm text-foreground/60 max-w-xs">
          Il link o QR Code scansionato non contiene un codice di sessione valido. Riprova scansionando il codice sul tuo Mac.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col justify-between max-w-md mx-auto">
      
      {/* Header */}
      <div className="space-y-4 text-center mt-4">
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-blue-500" />
          </div>
          <span className="font-bold text-lg">RoomAI Mobile</span>
        </div>
        
        <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-2xl p-3 inline-flex items-center gap-2 text-xs">
          <Smartphone className="w-4 h-4 text-green-500 animate-pulse" />
          <span>Collegato alla sessione: <strong className="font-mono text-blue-500">{sessionId}</strong></span>
        </div>
      </div>

      {/* Main Upload Box */}
      <div className="my-8 space-y-6">
        <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl p-8 text-center shadow-sm space-y-6">
          <h2 className="font-bold text-lg">Scatta foto della stanza</h2>
          <p className="text-xs text-foreground/60 leading-relaxed">
            Premi il bottone qui sotto per avviare la fotocamera del tuo iPhone. Le foto caricate compariranno istantaneamente sul tuo Mac.
          </p>

          <div className="flex flex-col items-center justify-center relative">
            <div
              className="w-20 h-20 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg transition-all"
            >
              <Camera className="w-8 h-8" />
            </div>
            <span className="text-xs font-bold text-blue-500 mt-3 uppercase tracking-wider">
              {status === "uploading" ? "Invio in corso..." : "Avvia Fotocamera"}
            </span>

            {!captureSupported && (
              <p className="text-[11px] text-foreground/60 mt-2 max-w-xs mx-auto">
                Se la fotocamera non si apre, prova a selezionare manualmente una foto dalla libreria o a usare un browser diverso.
              </p>
            )}

            {/* Native capture input - Absolute overlay to guarantee click on iOS */}
            <input
              id="mobile-photo-input"
              type="file"
              ref={fileInputRef}
              onChange={handleCapture}
              accept="image/jpeg, image/png, image/jpg"
              capture="environment"
              disabled={status === "uploading"}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
          </div>

          {/* Feedback states */}
          {status === "uploading" && (
            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-medium flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Trasferimento foto al Mac...</span>
            </div>
          )}

          {status === "success" && (
            <div className="p-3 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 rounded-xl text-xs font-medium flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Foto inviata al Mac con successo!</span>
            </div>
          )}

          {status === "error" && (
            <div className="p-3 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 rounded-xl text-xs font-medium flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded History */}
      <div className="flex-1 space-y-3 overflow-y-auto max-h-[220px] mb-6">
        <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Foto caricate in questa sessione ({uploadedPhotos.length})</h3>
        
        {uploadedPhotos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {uploadedPhotos.map((photo) => (
              <div key={photo.id} className="relative aspect-square bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
                <Image
                  src={photo.url}
                  alt={photo.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-gray-200 dark:border-gray-800 p-6 text-center rounded-xl text-xs text-foreground/40">
            Nessuna foto inviata ancora. Scatta la prima!
          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="text-center text-[10px] text-foreground/40 border-t border-gray-100 dark:border-gray-900 pt-4">
        RoomAI Mobile • Connessione locale protetta
      </div>
    </div>
  );
}

export default function MobileUploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MobileUploadInner />
    </Suspense>
  );
}
