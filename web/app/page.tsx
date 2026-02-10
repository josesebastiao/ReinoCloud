"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useChurch } from "../contexts/ChurchContext";
import { memberService } from "../services/memberService";
import { financeService } from "../services/financeService";
import { db } from "../lib/firebase";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { MemberDashboard } from "../components/MemberDashboard"; 
import { 
  Users, Calendar, TrendingUp, ArrowRight, 
  Clock, Loader2, Eye, EyeOff, Building2, UserCheck, UserX, Smartphone, LayoutDashboard 
} from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const { churchId, churchName, userName, userRole, formatMoney, logoUrl, loading: authLoading } = useChurch();
  
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(false);
  const [stats, setStats] = useState({ active: 0, inactive: 0, total: 0 });
  const [balance, setBalance] = useState(0);
  const [nextEvents, setNextEvents] = useState<any[]>([]);
  
  // Controle de Visão (Gestão vs Membro)
  const [viewMode, setViewMode] = useState<'management' | 'member'>('management');

  useEffect(() => {
    let isMounted = true;
    const checkAndLoad = async () => {
        if (authLoading) return;

        if (!churchId) { 
            const storedId = localStorage.getItem("churchId");
            if (!storedId) { 
                router.push("/login"); 
                return;
            }
        }

        if (userRole === 'member') {
            setViewMode('member');
            setLoading(false);
            return;
        }

        await loadDashboardData();
    };
    
    checkAndLoad();
    return () => { isMounted = false; };
  }, [churchId, router, userRole, authLoading]);

  const loadDashboardData = async () => {
    if(!churchId) return;
    try {
        setLoading(true);
        const [allMembers, allTransactions] = await Promise.all([
            memberService.listByChurch(churchId),
            financeService.listByChurch(churchId)
        ]);
        const activeCount = allMembers.filter(m => m.status === 'active').length;
        setStats({ active: activeCount, inactive: allMembers.length - activeCount, total: allMembers.length });
        
        let bal = 0;
        if (userRole === 'admin' || userRole === 'treasurer') {
            const totalIncome = allTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
            const totalExpense = allTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
            bal = totalIncome - totalExpense;
        }
        setBalance(bal);

        const today = new Date().toISOString().split('T')[0]; 
        const qEvents = query(collection(db, "events"), where("churchId", "==", churchId), where("date", ">=", today), orderBy("date", "asc"), limit(3));
        const eventSnap = await getDocs(qEvents);
        setNextEvents(eventSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) { console.error("Erro dashboard:", error); } finally { setLoading(false); }
  };

  const canSee = (allowedRoles: string[]) => {
      if (!userRole) return false;
      if (userRole === 'admin') return true; 
      return allowedRoles.includes(userRole);
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  // --- MODO VISÃO DO MEMBRO ---
  if (viewMode === 'member') {
      return (
        <>
            {userRole !== 'member' && (
                <button 
                    onClick={() => setViewMode('management')}
                    // AQUI: Botão de voltar ajustado para topo também, se preferir, ou manter no canto inferior esquerdo que é padrão
                    className="fixed bottom-6 left-6 z-[100] bg-slate-800 text-white px-5 py-3 rounded-full shadow-2xl font-bold text-xs flex items-center gap-2 hover:bg-slate-900 transition border border-slate-700 animate-in fade-in slide-in-from-bottom-4"
                >
                    <LayoutDashboard size={16}/> Voltar para Gestão
                </button>
            )}
            <MemberDashboard />
        </>
      );
  }

  // --- MODO VISÃO DE GESTÃO ---
  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans relative">
      
      {/* BOTÃO FLUTUANTE PARA IR PARA O APP (REPOSICIONADO NO TOPO DIREITO) */}
      <button 
          onClick={() => setViewMode('member')}
          className="fixed top-24 right-4 z-50 bg-white text-blue-600 px-4 py-2 rounded-full shadow-lg font-bold text-[10px] flex items-center gap-2 hover:bg-blue-50 transition hover:scale-105 border border-blue-100 animate-in zoom-in"
      >
          <Smartphone size={14}/> Ver App Membro
      </button>

      {/* BANNER AZUL */}
      <div className="md:static fixed top-28 left-0 right-0 bg-[#1D4ED8] pt-6 pb-10 px-6 md:px-10 shadow-lg rounded-b-[2.5rem] z-40 md:min-h-[200px] md:h-auto h-[180px]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6 h-full">
            <div className="flex items-center gap-4">
                {logoUrl ? (
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-2xl p-1.5 backdrop-blur-sm border border-white/20 shadow-inner shrink-0">
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                    </div>
                ) : (
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-2xl flex items-center justify-center text-blue-100 border border-white/20 shrink-0">
                        <Building2 size={32}/>
                    </div>
                )}
                <div className="flex flex-col items-start">
                    <p className="text-blue-200 font-medium mb-1 text-sm md:text-base">Bem-vindo, {userName}</p>
                    <h1 className="text-xl md:text-4xl font-bold text-white tracking-tight leading-tight max-w-[200px] md:max-w-none truncate">{churchName}</h1>
                </div>
            </div>
            
            <div className="flex gap-4 self-end">
                <Link href="/agenda" className="hidden md:flex flex-col items-center gap-1 text-white opacity-80 hover:opacity-100 transition">
                    <div className="bg-white/10 p-3 rounded-2xl"><Calendar size={20}/></div>
                    <span className="text-[10px] font-bold">AGENDA</span>
                </Link>
                {canSee(['treasurer']) && (
                    <Link href="/financial" className="hidden md:flex flex-col items-center gap-1 text-white opacity-80 hover:opacity-100 transition">
                        <div className="bg-white/10 p-3 rounded-2xl"><TrendingUp size={20}/></div>
                        <span className="text-[10px] font-bold">EXTRATO</span>
                    </Link>
                )}
            </div>
        </div>
      </div>

      {/* CARDS */}
      <div className="max-w-6xl mx-auto px-4 pt-[165px] md:pt-8 md:mt-0 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        
        {/* CARD MEMBRESIA */}
        {canSee(['secretary']) && (
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col justify-between h-full min-h-[220px]">
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Membresia Total</span>
                        <div className="bg-blue-50 text-blue-600 p-2 rounded-xl"><Users size={20}/></div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-5xl font-extrabold text-gray-800">{stats.total}</h2>
                        <span className="text-sm font-bold text-gray-400">Membros</span>
                    </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex gap-3">
                        <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg" title="Membros Ativos">
                            <UserCheck size={12}/> {stats.active}
                        </div>
                        {stats.inactive > 0 && (
                            <div className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg" title="Membros Inativos">
                                <UserX size={12}/> {stats.inactive}
                            </div>
                        )}
                    </div>
                    <Link href="/members" className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1">
                        Ver Lista <ArrowRight size={12}/>
                    </Link>
                </div>
            </div>
        )}

        {/* CARD CAIXA */}
        {canSee(['treasurer']) && (
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col justify-between h-full min-h-[220px]">
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Caixa Atual</span>
                        <div className="bg-green-50 text-green-600 p-2 rounded-xl"><TrendingUp size={20}/></div>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className={`text-3xl font-extrabold tracking-tight ${balance < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                            {showBalance ? formatMoney(balance) : "••••••••"}
                        </h2>
                        <button onClick={() => setShowBalance(!showBalance)} className="text-gray-400 hover:text-blue-600 transition">
                            {showBalance ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                    </div>
                    <p className="text-xs text-gray-400">Saldo disponível</p>
                </div>
                <div className="mt-auto flex gap-2 pt-4">
                    <Link href="/financial" className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition text-center flex items-center justify-center">Extrato</Link>
                    <Link href="/financial" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-200 transition text-center flex items-center justify-center">+ Lançar</Link>
                </div>
            </div>
        )}

        {/* CARD AGENDA */}
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col h-full min-h-[220px]">
            <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Próximos Eventos</span>
                <Calendar size={18} className="text-gray-300"/>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[140px] pr-2 custom-scrollbar">
                {nextEvents.length === 0 ? (
                    <div className="text-center py-4 text-gray-300">
                        <p className="text-xs">Nenhum evento futuro.</p>
                        <Link href="/agenda" className="text-blue-500 text-xs font-bold mt-1 block hover:underline">Agendar</Link>
                    </div>
                ) : (
                    nextEvents.map((evt) => (
                        <div key={evt.id} className="flex gap-3 items-start group">
                            <div className="bg-blue-50 text-blue-700 rounded-lg p-1.5 text-center min-w-[45px]">
                                <span className="block text-[9px] font-bold uppercase">{new Date(evt.date).toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0,3)}</span>
                                <span className="block text-lg font-black leading-none">{new Date(evt.date).getDate() + 1}</span>
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-gray-800 text-sm truncate group-hover:text-blue-600 transition">{evt.title}</h4>
                                <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                                    <span className="flex items-center gap-1"><Clock size={10}/> {evt.time}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                <Link href="/agenda" className="text-blue-600 text-xs font-bold hover:underline flex items-center justify-center gap-1">
                    Calendário <ArrowRight size={12}/>
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}