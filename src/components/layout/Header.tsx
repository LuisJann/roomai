import Link from "next/link";
import { Sparkles, Menu } from "lucide-react";

export function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight">RoomAI</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#features" className="text-foreground/70 hover:text-foreground transition-colors">Funzionalità</Link>
            <Link href="#styles" className="text-foreground/70 hover:text-foreground transition-colors">Stili</Link>
            <Link href="#pricing" className="text-foreground/70 hover:text-foreground transition-colors">Prezzi</Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link href="/workspace" className="bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium hover:scale-105 transition-transform active:scale-95 shadow-sm">
              Inizia il Progetto
            </Link>
            <button className="md:hidden p-2">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
