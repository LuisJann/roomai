import Link from "next/link";
import { Sparkles, Menu } from "lucide-react";

export function Header() {
  return (
    <header className="fixed top-0 w-full z-50 glass-panel border-t-0 border-x-0 rounded-none shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[10px] bg-white text-black flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">RoomAI</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <span className="text-white/50 tracking-wide">La tua stanza, il tuo design.</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/workspace/3d-editor" className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold shadow-glow hover:scale-[1.02] active:scale-95 anim-spring">
              Avvia l'App
            </Link>

          </div>
        </div>
      </div>
    </header>
  );
}
