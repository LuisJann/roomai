"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, ArrowLeft, AlertTriangle, MessageCircle, CheckCircle, XCircle, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

export default function ModerationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    async function checkAuthAndLoadReports() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || user.user_metadata?.email !== 'giannoneluigi10@gmail.com') {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      setIsAdmin(true);
      await fetchReports(10);
    }

    checkAuthAndLoadReports();
  }, [router]);

  const fetchReports = async (currentLimit: number) => {
    setLoading(true);
    const supabase = createClient();
    
    // Fetch total count
    const { count } = await supabase
      .from('reported_comments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
      
    if (count !== null) setTotalCount(count);

    // Fetch reports
    const { data, error } = await supabase
      .from('reported_comments')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(currentLimit);

    if (data && !error) {
      setReports(data);
    }
    setLoading(false);
  };

  const handleLoadMore = () => {
    const newLimit = limit + 10;
    setLimit(newLimit);
    fetchReports(newLimit);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const supabase = createClient();
    await supabase.from('reported_comments').update({ status: newStatus }).eq('id', id);
    setReports(reports.filter(r => r.id !== id));
    setTotalCount(prev => prev - 1);
  };

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <div className="max-w-md w-full glass-panel rounded-3xl p-8 text-center border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Accesso Negato</h2>
          <p className="text-white/60 mb-8">
            Questa sezione è di massima sicurezza ed è riservata esclusivamente all'Amministratore del sistema. I tuoi tentativi di accesso sono stati registrati.
          </p>
          <Link 
            href="/workspace/explore"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna al sicuro
          </Link>
        </div>
      </div>
    );
  }

  if (loading && reports.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-12 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-10">
          <div className="flex items-center gap-4">
            <Link href="/workspace/explore" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
                Centro Moderazione
              </h1>
              <p className="text-sm text-white/50 mt-1">Gestione segnalazioni commenti</p>
            </div>
          </div>
          <div className="glass-panel px-4 py-2 rounded-full text-sm font-medium">
            <span className="text-yellow-500">{totalCount}</span> Segnalazioni in attesa
          </div>
        </header>

        <div className="glass-panel rounded-3xl p-6 border border-white/5">
          {reports.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Tutto pulito!</h3>
              <p className="text-white/50">Non ci sono nuove segnalazioni da gestire al momento.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map(report => (
                <div key={report.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 sm:gap-6 md:items-center hover:bg-white/10 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 text-[10px] font-bold rounded uppercase tracking-wider">Segnalato</span>
                      <span className="text-xs text-white/40">{formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: it })}</span>
                    </div>
                    <p className="text-sm text-white/70 mb-1">
                      Progetto: <span className="font-mono text-xs text-white/50">{report.project_id}</span>
                    </p>
                    <p className="text-sm text-white/70 mb-3">
                      Motivo: <span className="text-white font-medium">{report.reason}</span>
                    </p>
                    <Link 
                      href={`/workspace/explore/${report.project_id}?highlightCommentId=${report.comment_id}`} 
                      className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Vai al Thread del progetto
                    </Link>
                  </div>
                  <div className="flex flex-row sm:flex-col md:flex-row items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t border-white/5 md:border-none">
                    <button 
                      onClick={() => handleUpdateStatus(report.id, 'ignored')}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-bold text-white/50 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Ignora
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(report.id, 'resolved')}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-bold bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2 border border-green-500/30"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Risolto
                    </button>
                  </div>
                </div>
              ))}

              {reports.length < totalCount && (
                <div className="pt-6 text-center">
                  <button 
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="glass-button w-full sm:w-auto px-6 py-3 rounded-full text-sm font-bold hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Caricamento...' : `Mostra altre segnalazioni (Rimaste: ${totalCount - reports.length})`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
