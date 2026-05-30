"use client";

import { Home, Image as ImageIcon, History, Settings, Sparkles, Lightbulb, Box, X, Shield } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";

const baseNavItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Sparkles, label: "Modifica foto con AI", href: "/workspace", badge: "BETA" },
  { icon: ImageIcon, label: "I Miei Render", href: "/workspace/gallery" },
  { icon: Box, label: "Editor 3D", href: "/workspace/3d-editor" },
  { icon: Lightbulb, label: "Ispirazione AI", href: "/workspace/inspiration" },
  { icon: History, label: "Progetti 3D salvati", href: "/workspace/history" },
  { icon: Settings, label: "Impostazioni", href: "/workspace/settings" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobileMenu?: boolean;
}

export function Sidebar({ isOpen, onClose, isMobileMenu }: SidebarProps) {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [permissions, setPermissions] = useState<any>({});

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? null);
        const { data: roleData } = await supabase.from('users_roles').select('role, permissions').eq('id', user.id).single();
        if (roleData) {
          setIsAdmin(roleData.role === 'admin');
          setPermissions(roleData.permissions || {});
        }
      }
    }
    loadUser();
  }, []);
  
  // Close sidebar on mobile ONLY when route actually changes
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  const navGroups = [];

  // Home is standalone
  if (isAdmin || permissions.canAccessLanding) {
    navGroups.push({
      isStandalone: true,
      items: [{ icon: Home, label: "Home", href: "/" }]
    });
  }

  // Generazione AI
  const aiItems = [];
  if (isAdmin || permissions.canAccessModificaAI) {
    aiItems.push({ icon: Sparkles, label: "Modifica foto", href: "/workspace", badge: "BETA" });
  }
  if (isAdmin || permissions.canAccessIspirazione) {
    aiItems.push({ icon: Lightbulb, label: "Ispirazione AI", href: "/workspace/inspiration" });
  }
  if (isAdmin || permissions.canAccessModificaAI || permissions.canAccessIspirazione) {
    aiItems.push({ icon: ImageIcon, label: "I Miei Render", href: "/workspace/gallery" });
  }
  if (aiItems.length > 0) {
    navGroups.push({ title: "Intelligenza Artificiale", items: aiItems });
  }

  // Progettazione 3D
  const designItems = [];
  if (isAdmin || permissions.canAccess3DEditor) {
    designItems.push({ icon: Box, label: "Editor 3D", href: "/workspace/3d-editor" });
  }
  if (isAdmin || permissions.canAccessStorico) {
    designItems.push({ icon: History, label: "Progetti Salvati", href: "/workspace/history" });
  }
  if (designItems.length > 0) {
    navGroups.push({ title: "Progettazione 3D", items: designItems });
  }

  // Sistema
  const systemItems = [];
  systemItems.push({ icon: Settings, label: "Impostazioni", href: "/workspace/settings" });
  if (isAdmin) {
    systemItems.push({ icon: Shield, label: "Pannello Admin", href: "/workspace/admin" });
  }
  navGroups.push({ title: "Sistema", items: systemItems });

  const SidebarContent = (
    <aside className={cn(
      "w-full h-full flex flex-col pointer-events-auto",
      !isMobileMenu && "glass-panel rounded-r-[32px] overflow-hidden shadow-premium border-l-0"
    )}>
      {!isMobileMenu && (
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[10px] bg-white text-black flex items-center justify-center shadow-glow">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight">RoomAI</span>
          </div>
          <button className="md:hidden p-1.5 glass-button" onClick={onClose}>
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>
      )}
      
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {navGroups.map((group, groupIdx) => {
          if (group.isStandalone) {
            return (
              <div key="standalone" className="space-y-1">
                {group.items.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-3 md:py-2.5 rounded-2xl text-sm font-medium anim-spring",
                      pathname === item.href
                        ? "bg-white text-black shadow-[0_8px_16px_rgba(255,255,255,0.15)] scale-[1.04] border border-white/20 z-10 relative"
                        : "text-white/70 hover:bg-white/10 hover:text-white hover:translate-x-1"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </div>
                  </Link>
                ))}
              </div>
            );
          }

          return (
            <div key={group.title} className="space-y-1">
              <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-foreground/40">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 md:py-2 rounded-2xl text-sm font-medium anim-spring",
                        isActive
                          ? "bg-white text-black shadow-[0_8px_16px_rgba(255,255,255,0.15)] scale-[1.04] border border-white/20 z-10 relative"
                          : "text-white/70 hover:bg-white/10 hover:text-white hover:translate-x-1"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 uppercase tracking-widest border border-blue-500/30">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-white/5 flex flex-col gap-2 text-xs text-white/50 text-center shrink-0 bg-white/5">
        {userEmail ? (
          <div className="flex flex-col items-center gap-1.5">
            <span className="font-semibold text-white/90">{userEmail}</span>
            <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/10 bg-white/5">{isAdmin ? 'Amministratore' : 'Utente Standard'}</span>
            <button onClick={async () => { await supabase.auth.signOut(); window.location.href='/login'; }} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1.5 rounded-full transition-colors mt-1 anim-spring">Esci</button>
          </div>
        ) : (
          <>
            Dati salvati localmente sul browser. Nessun account richiesto.
            <Link href="/login" className="text-blue-500 hover:underline mt-1 block">Accedi / Registrati</Link>
          </>
        )}
      </div>
    </aside>
  );

  if (isMobileMenu) {
    return <>{SidebarContent}</>;
  }

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <div className="hidden md:block fixed left-0 top-0 h-[100dvh] z-30 w-72">
        {SidebarContent}
      </div>
    </>
  );
}
