"use client"; // <--- OBRIGATÓRIO
import { useState, useEffect } from "react";
import Link from "next/link";
import { useChurch } from "../contexts/ChurchContext";
import { memberService } from "../services/memberService";
import { financeService } from "../services/financeService";
import { db } from "../lib/firebase";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { 
  Users, Calendar, TrendingUp, ArrowRight, 
  MapPin, Clock, Loader2, AlertCircle, Eye, EyeOff, Building2 
} from "lucide-react";

export default function Dashboard() {
  const { churchId, churchName, userName, userRole, formatMoney, logoUrl } = useChurch(); // <--- Peguei a logoUrl
  const [loading, setLoading] = useState(true);
  
  const [showBalance, setShowBalance] = useState(false);
  const [stats, setStats] = useState({ active: 0, inactive: 0, total: 0 });
  const [balance, setBalance] = useState(0);
  const [nextEvents, setNextEvents] = useState<any[]>([]);

  useEffect(() => {
    if (churchId) loadDashboardData();
  }, [churchId]);

  const loadDashboardData = async () => {
    try {
        setLoading(true);
        const [allMembers, allTransactions] = await Promise.all([
            memberService.listByChurch(churchId),
            financeService.listByChurch(churchId)
        ]);

        const activeCount = allMembers.filter(m => m.status === 'active').length;
        const inactiveCount = allMembers.length - activeCount;
        setStats({ active: activeCount, inactive: inactiveCount, total: allMembers.length });

        const totalIncome = allTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
        const totalExpense = allTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
        setBalance(totalIncome - totalExpense);

        const today = new Date().toISOString().split('T')[0]; 
        const qEvents = query(collection(db, "events"), where("churchId", "==", churchId), where("date", ">=", today), orderBy("date", "asc"), limit(3));
        const eventSnap = await getDocs(qEvents);
        setNextEvents(eventSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    } catch (error) { console.error("Erro:", error); } finally { setLoading(false); }
  };

  const canSee = (allowedRoles: string[]) => {
      if (!userRole) return false;
      if (userRole === 'admin') return true;
      return allowedRoles.includes(userRole);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* CABEÇALHO AZUL COM LOGO */}
      <div className="bg-[#1D4ED8] pt-12 pb-24 px-6 md:px-10 rounded-b-[3rem] shadow-sm relative z-0">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            
            {/* Título e Logo */}
            <div className="flex items-center gap-4">
                {logoUrl ? (
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-2xl p-1.5 backdrop-blur-sm border border-white/20 shadow-inner">
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                    </div>
                ) : (
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-2xl flex items-center justify-center text-blue-100 border border-white/20">
                        <Building2 size={32}/>
                    </div>
                )}
                <div>
                    <p className="text-blue-200 font-medium mb-1">Bem-vindo, {userName}</p>
                    <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight leading-tight">{churchName}</h1>
                </div>
            </div>
            
            {/* Atalhos Rápidos */}
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

      {/* CARDS FLUTUANTES */}
      <div className="max-w-6xl mx-auto px-4 -mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        
        {/* CARD 1: MEMBRESIA */}
        {canSee(['secretary']) && (
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col justify-between h-full min-h-[220px]">
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Membresia</span>
                        <div className="bg-blue-50 text-blue-600 p-2 rounded-xl"><Users size={20}/></div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-5xl font-extrabold text-gray-800">{stats.active}</h2>
                        <span className="text-sm font-bold text-gray-400">Ativos</span>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    {stats.inactive > 0 ? (
                        <div className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                            <AlertCircle size={12}/> {stats.inactive} Inativos
                        </div>
                    ) : <span className="text-xs text-green-500 font-bold">100% Ativos</span>}
                    <Link href="/members" className="text-blue-600 text-xs font-bold hover:underline">Ver Lista</Link>
                </div>
            </div>
        )}

        {/* CARD 2: CAIXA */}
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

        {/* CARD 3: AGENDA */}
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
                    Ver Calendário <ArrowRight size={12}/>
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}