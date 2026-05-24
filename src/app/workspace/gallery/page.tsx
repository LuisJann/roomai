"use client";

import Link from "next/link";
import Image from "next/image";
import { Sparkles, Eye, Download, Calendar } from "lucide-react";

export default function GalleryPage() {
  const renders = [
    {
      id: "soggiorno-moderno",
      title: "Soggiorno Moderno",
      style: "Modern Minimalist",
      date: "Oggi",
      image: "/modern_living_room_after.png",
      href: "/workspace/results"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">I Miei Render 3D</h1>
        <p className="text-xs text-foreground/50 mt-1">
          Visualizza e scarica i render 3D generati dall'AI per le tue stanze. I dati sono salvati localmente sul tuo browser.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renders.map((render) => (
          <div 
            key={render.id} 
            className="group bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
          >
            {/* Image container */}
            <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-900 overflow-hidden">
              <Image 
                src={render.image} 
                alt={render.title} 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Link 
                  href={render.href}
                  className="bg-white text-gray-900 p-3 rounded-full shadow hover:scale-110 active:scale-95 transition-transform"
                  title="Visualizza Dettagli"
                >
                  <Eye className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {render.style}
                </span>
                <h3 className="font-bold text-base mt-2.5 text-foreground/90">{render.title}</h3>
                
                <div className="flex items-center gap-1.5 text-[11px] text-foreground/40 mt-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Creato: {render.date}</span>
                </div>
              </div>

              <div className="flex gap-2.5 mt-6 border-t border-gray-100 dark:border-gray-900 pt-4">
                <Link 
                  href={render.href}
                  className="flex-1 text-center bg-foreground text-background py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  Apri Progetto
                </Link>
                <a 
                  href={render.image} 
                  download 
                  className="bg-surface border border-gray-200 dark:border-gray-800 text-foreground p-2 rounded-xl hover:bg-surface-hover transition-colors flex items-center justify-center"
                  title="Scarica HD"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        ))}

        {/* Create new room card */}
        <Link 
          href="/workspace" 
          className="border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 rounded-3xl p-8 flex flex-col items-center justify-center text-center min-h-[300px] bg-surface-hover/10 hover:bg-surface-hover/30 transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-surface border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="font-semibold text-sm mb-1">Nuovo Progetto Stanza</h3>
          <p className="text-xs text-foreground/50 max-w-xs">
            Aggiungi foto e misure di una nuova stanza per generare un altro render 3D personalizzato.
          </p>
        </Link>
      </div>
    </div>
  );
}
