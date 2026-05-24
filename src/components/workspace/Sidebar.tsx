"use client";

import { Home, Image as ImageIcon, History, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Sparkles, label: "Nuovo Progetto", href: "/workspace" },
  { icon: ImageIcon, label: "I Miei Render", href: "/workspace/gallery" },
  { icon: History, label: "Storico", href: "/workspace/history" },
  { icon: Settings, label: "Impostazioni", href: "/workspace/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen border-r border-gray-200 dark:border-gray-800 bg-surface flex flex-col fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-semibold text-lg tracking-tight">RoomAI</span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-foreground text-background"
                  : "text-foreground/70 hover:bg-surface-hover hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 text-xs text-foreground/50 text-center">
        Dati salvati localmente sul browser. Nessun account richiesto.
      </div>
    </aside>
  );
}
