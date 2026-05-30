"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Shield, Users, HardDrive, Loader2, Check } from "lucide-react";

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbStats, setDbStats] = useState({ totalProjects: 0, estimatedSize: 0 });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push("/login");
        return;
      }

      // Check admin
      const { data: roleData } = await supabase.from('users_roles').select('role').eq('id', authData.user.id).single();
      if (!roleData || roleData.role !== 'admin') {
        router.push("/workspace/3d-editor");
        return;
      }

      // Load users
      const { data: usersData } = await supabase.from('users_roles').select('*').order('created_at', { ascending: false });
      if (usersData) {
        setUsers(usersData);
      }

      // Load stats
      const { count } = await supabase.from('projects').select('*', { count: 'exact', head: true });
      // We do a rough estimation: say each project JSON is about 50KB on average
      const estimatedMB = ((count || 0) * 50) / 1024;
      
      // Load user images size
      const { data: imagesData } = await supabase.from('user_images').select('size_bytes');
      const totalImagesSizeMB = (imagesData || []).reduce((acc, curr) => acc + Number(curr.size_bytes || 0), 0) / (1024 * 1024);
      
      setDbStats({ totalProjects: count || 0, estimatedSize: estimatedMB + totalImagesSizeMB, imagesSize: totalImagesSizeMB });
      setLoading(false);
    }
    loadData();
  }, [router, supabase]);

  const togglePermission = async (userId: string, currentPermissions: any, permKey: string) => {
    const updatedPerms = { ...currentPermissions, [permKey]: !currentPermissions[permKey] };
    setUsers(users.map(u => u.id === userId ? { ...u, permissions: updatedPerms } : u));
    const { error } = await supabase.from('users_roles').update({ permissions: updatedPerms }).eq('id', userId);
    if (error) alert("Errore nell'aggiornamento dei permessi.");
  };

  if (loading) return <div className="flex-1 flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  const dbPercentage = Math.min((dbStats.estimatedSize / 500) * 100, 100);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl shrink-0">
          <Shield className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pannello Amministratore</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gestisci gli accessi degli utenti e monitora i consumi del Database.</p>
        </div>
      </div>

      {/* Stats Widget */}
      <div className="bg-surface border border-border rounded-3xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <HardDrive className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg sm:text-xl font-semibold">Stato Database Supabase (Free Tier)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1 sm:gap-0">
              <span className="text-muted-foreground leading-tight">Spazio Occupato (Reale + Stima JSON)</span>
              <span className="font-mono font-bold text-blue-400">{dbStats.estimatedSize.toFixed(2)} MB / 500 MB</span>
            </div>
            <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${dbPercentage > 80 ? 'bg-red-500' : 'bg-blue-500'}`} 
                style={{ width: `${dbPercentage}%` }} 
              />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
              File Render ({dbStats.imagesSize?.toFixed(2)} MB) + Progetti 3D (~{((dbStats.totalProjects * 50) / 1024).toFixed(2)} MB).
            </p>
          </div>
          <div className="bg-background rounded-2xl p-4 flex flex-col justify-center items-center border border-border">
            <span className="text-3xl font-black">{dbStats.totalProjects}</span>
            <span className="text-xs text-muted-foreground text-center uppercase tracking-widest mt-1">Progetti 3D Totali Salvati</span>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-surface border border-border rounded-3xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg sm:text-xl font-semibold">Gestione Utenti & Permessi</h2>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden space-y-4">
          {users.map((user) => (
            <div key={user.id} className="bg-background rounded-2xl border border-border p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <span className="font-medium text-sm truncate pr-2">{user.email}</span>
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {user.role}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'canAccessLanding', label: 'Landing' },
                  { key: 'canAccess3DEditor', label: '3D Editor' },
                  { key: 'canAccessIspirazione', label: 'Ispirazione' },
                  { key: 'canAccessStorico', label: 'Storico' },
                  { key: 'canAccessModificaAI', label: 'Modifica AI' }
                ].map((perm) => (
                  <div key={perm.key} className="flex justify-between items-center bg-surface p-2 rounded-xl">
                    <span className="text-xs text-muted-foreground">{perm.label}</span>
                    {user.role === 'admin' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <button
                        onClick={() => togglePermission(user.id, user.permissions, perm.key)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${user.permissions?.[perm.key] ? 'bg-green-500' : 'bg-secondary border border-border'}`}
                      >
                        <span className={`absolute top-0.5 left-1 bg-white w-4 h-4 rounded-full transition-transform ${user.permissions?.[perm.key] ? 'translate-x-4' : ''}`} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Utente</th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Ruolo</th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Landing Page</th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Editor 3D</th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Ispirazione</th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Storico</th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Modifica AI</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                  <td className="py-4 px-4 font-medium text-sm">{user.email}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {user.role}
                    </span>
                  </td>
                  {[
                    { key: 'canAccessLanding', label: 'Landing' },
                    { key: 'canAccess3DEditor', label: '3D' },
                    { key: 'canAccessIspirazione', label: 'Ispirazione' },
                    { key: 'canAccessStorico', label: 'Storico' },
                    { key: 'canAccessModificaAI', label: 'Modifica AI' }
                  ].map((perm) => (
                    <td key={perm.key} className="py-4 px-4">
                      {user.role === 'admin' ? (
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Check className="w-3 h-3 text-green-500" />
                        </div>
                      ) : (
                        <button
                          onClick={() => togglePermission(user.id, user.permissions, perm.key)}
                          className={`w-11 h-6 rounded-full relative transition-colors ${user.permissions?.[perm.key] ? 'bg-green-500' : 'bg-secondary border border-border'}`}
                        >
                          <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${user.permissions?.[perm.key] ? 'translate-x-5' : ''}`} />
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
