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
    <aside className="w-full h-full border-r border-gray-200 dark:border-gray-800 bg-surface flex flex-col pointer-events-auto shadow-2xl md:shadow-none">
      {!isMobileMenu && (
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-foreground text-background flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-semibold text-lg tracking-tight">RoomAI</span>
          </div>
          <button className="md:hidden p-1 bg-secondary rounded-lg" onClick={onClose}>
            <X className="w-5 h-5 text-foreground/70" />
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
                      "flex items-center justify-between px-3 py-3 md:py-2.5 rounded-xl text-sm font-medium transition-all",
                      pathname === item.href
                        ? "bg-foreground text-background shadow-md scale-[1.02]"
                        : "text-foreground/70 hover:bg-surface-hover hover:text-foreground hover:scale-[1.02]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
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
                        "flex items-center justify-between px-3 py-2.5 md:py-2 rounded-xl text-sm font-medium transition-all",
                        isActive
                          ? "bg-foreground text-background shadow-md scale-[1.02]"
                          : "text-foreground/70 hover:bg-surface-hover hover:text-foreground hover:scale-[1.02]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-500 uppercase tracking-widest">
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
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-2 text-xs text-foreground/50 text-center shrink-0">
        {userEmail ? (
          <div className="flex flex-col items-center gap-1">
            <span className="font-semibold text-foreground/80">{userEmail}</span>
            <span className="text-[10px] uppercase tracking-widest">{isAdmin ? 'Amministratore' : 'Utente Standard'}</span>
            <button onClick={async () => { await supabase.auth.signOut(); window.location.href='/login'; }} className="text-red-500 hover:text-red-600 mt-2">Esci</button>
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
      <div className="hidden md:block fixed left-0 top-0 h-screen z-30 w-64">
        {SidebarContent}
      </div>
    </>
  );
}
