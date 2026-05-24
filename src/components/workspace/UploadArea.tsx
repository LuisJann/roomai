"use client";

import { motion } from "framer-motion";
import { Upload, Image as ImageIcon } from "lucide-react";
import { useState } from "react";

export function UploadArea() {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
        isDragging
          ? "border-blue-500 bg-blue-500/5"
          : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 bg-surface-hover/50"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        // Handle file upload here
      }}
    >
      <div className="mx-auto w-16 h-16 rounded-full bg-surface shadow-sm border border-gray-200 dark:border-gray-800 flex items-center justify-center mb-4">
        <Upload className="w-8 h-8 text-foreground/70" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Trascina le foto della tua stanza qui</h3>
      <p className="text-foreground/60 mb-6 max-w-md mx-auto">
        Supporta file JPG e PNG fino a 10MB. Carica una foto ben illuminata che mostri la maggior parte dell'ambiente.
      </p>
      <div className="flex justify-center gap-4">
        <button className="bg-foreground text-background px-6 py-3 rounded-full text-sm font-medium hover:scale-105 transition-transform active:scale-95">
          Scegli un file
        </button>
        <button className="bg-surface text-foreground border border-gray-200 dark:border-gray-800 px-6 py-3 rounded-full text-sm font-medium hover:bg-surface-hover transition-colors flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Scatta foto
        </button>
      </div>
    </motion.div>
  );
}
