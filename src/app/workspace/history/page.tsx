"use client";

import Link from "next/link";
import { History, LayoutGrid, ArrowRight, Calendar, Info, Trash2, FolderOpen, Cloud, Users, Shield } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function HistoryPage() {
  const router = useRouter();
  const supabase = createClient();
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [otherProjects, setOtherProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ isOpen: boolean, projectId: string | null }>({ isOpen: false, projectId: null });

  const fetchProjects = async () => {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    
    if (!authData.user) {
      router.push("/login");
      return;
    }
    
    setUserId(authData.user.id);
    const uId = authData.user.id;

    const { data: roleData } = await supabase.from('users_roles').select('role').eq('id', uId).single();
    const adminMode = roleData?.role === 'admin';
    setIsAdmin(adminMode);

    // Fetch projects
    const { data: projData } = await supabase
      .from('projects')
      .select('*, users_roles(email)')
      .order('created_at', { ascending: false });

    if (projData) {
      const mine = projData.filter(p => p.user_id === uId);
      const others = projData.filter(p => p.user_id !== uId);
      setMyProjects(mine);
      setOtherProjects(others);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const requestDeleteProject = (id: string) => {
    setDeleteConfirmDialog({ isOpen: true, projectId: id });
  };

  const confirmDeleteProject = async () => {
    if (deleteConfirmDialog.projectId) {
      await supabase.from('projects').delete().eq('id', deleteConfirmDialog.projectId);
      setDeleteConfirmDialog({ isOpen: false, projectId: null });
      fetchProjects();
    }
  };

  const cancelDeleteProject = () => {
    setDeleteConfirmDialog({ isOpen: false, projectId: null });
  };

  const loadProject = (projectData: any, ownerEmail: string | null = null) => {
    // Sanitize legacy projects
    let safeCustomUrl = projectData.custom3DModelUrl;
    if (typeof safeCustomUrl === 'string' && safeCustomUrl.startsWith('blob:')) {
      safeCustomUrl = null;
    }

    let safeAddedObjects = projectData.addedObjects || [];
    if (Array.isArray(safeAddedObjects)) {
      safeAddedObjects = safeAddedObjects.map((obj: any) => {
        if (typeof obj.modelUrl === 'string' && obj.modelUrl.startsWith('blob:')) {
          return { ...obj, modelUrl: undefined, type: 'cube' };
        }
        return obj;
      });
    }

    useWorkspaceStore.setState({
      addedObjects: safeAddedObjects,
      nodeTransformations: projectData.nodeTransformations || {},
      custom3DModelUrl: safeCustomUrl,
      cloudModelUrl: projectData.cloudModelUrl || null,
      customRoomConfig: projectData.customRoomConfig || {
        shape: 'rectangular',
        width: 4,
        length: 5,
        height: 2.8,
        doorsCount: 1,
        windowsCount: 1
      },
      history: [], 
      loadedProjectOwner: ownerEmail,
    });
    router.push("/workspace/3d-editor");
  };

  const renderProjectList = (list: any[], title: string, icon: any, emptyMsg: string) => (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-foreground/5 rounded-xl text-foreground/80">
          {icon}
        </div>
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>

      <div className="glass-card rounded-[32px] overflow-hidden shadow-sm">
        {list.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-900">
            {list.map((item, index) => {
              const dateObj = new Date(item.created_at);
              const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();
              const wsData = item.data?.workspaceData || item.data || {};

              return (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-glow">
                      <LayoutGrid className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">{item.name}</h3>
                      {item.users_roles?.email && item.user_id !== userId && (
                        <div className="text-[10px] uppercase font-bold text-purple-400 tracking-wider mt-1">
                          Proprietario: {item.users_roles.email}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/50 mt-1">
                        <span>Oggetti: {wsData.addedObjects?.length || 0}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {dateStr}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button 
                      onClick={() => requestDeleteProject(item.id)}
                      className="p-2.5 text-red-500 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all"
                      title="Elimina Progetto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <button 
                      onClick={() => loadProject(wsData, item.user_id !== userId ? item.users_roles?.email : null)}
                      className="bg-white text-black px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 anim-spring hover:scale-[1.02] shadow-glow"
                    >
                      <FolderOpen className="w-4 h-4" /> Apri
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center space-y-4">
            <h3 className="font-bold text-base text-white/70">{emptyMsg}</h3>
            {title === "I Tuoi Progetti" && (
              <Link 
                href="/workspace/3d-editor"
                className="bg-white text-black px-6 py-3 rounded-full text-xs font-bold inline-block shadow-glow hover:scale-[1.02] anim-spring"
              >
                Vai all'Editor 3D
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return <div className="max-w-5xl mx-auto py-12 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="max-w-5xl mx-auto py-6 relative"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">Progetti 3D Salvati</h1>
        <p className="text-xs text-white/50 mt-1 flex items-center gap-1">
          <Cloud className="w-3 h-3" />
          I progetti sono sincronizzati nel tuo Cloud Supabase.
        </p>
      </div>

      {renderProjectList(myProjects, "I Tuoi Progetti", <History className="w-5 h-5" />, "Non hai ancora salvato nessun progetto.")}

      {isAdmin && renderProjectList(otherProjects, "Progetti degli Altri Utenti (Vista Admin)", <Users className="w-5 h-5" />, "Nessun altro utente ha salvato progetti.")}

      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-[11px] text-blue-500 leading-relaxed flex items-start gap-2 max-w-3xl mt-8">
        <Shield className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          <strong>Sincronizzazione Cloud Attiva:</strong> Tutti i salvataggi sono sicuri sul database. Le tue modifiche sono visibili ovunque effettui il login. {isAdmin && "Essendo Admin, hai anche il diritto di vedere e modificare i progetti creati dagli altri."}
        </span>
      </div>

      <AnimatePresence>
        {deleteConfirmDialog.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelDeleteProject}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm glass-card rounded-[32px] shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="p-8">
                <h3 className="text-xl font-bold tracking-tight mb-2 text-white">Elimina Progetto</h3>
                <p className="text-white/70 text-sm mb-8 leading-relaxed">Sei sicuro di voler eliminare definitivamente questo progetto? Questa azione è irreversibile.</p>
                <div className="flex gap-3 justify-end">
                  <button 
                    onClick={cancelDeleteProject}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-colors"
                  >
                    Annulla
                  </button>
                  <button 
                    onClick={confirmDeleteProject}
                    className="bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30 px-5 py-2.5 rounded-xl text-sm font-bold anim-spring active:scale-95 hover:scale-[1.02]"
                  >
                    Elimina Definitivamente
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
