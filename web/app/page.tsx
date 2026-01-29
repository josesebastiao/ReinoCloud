"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
// IMPORTANTE: Caminhos ajustados para a raiz do app (../)
import { useChurch } from "../contexts/ChurchContext";
import { memberService } from "../services/memberService";
import { db } from "../lib/firebase";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { 
  Users, Calendar, TrendingUp, ArrowRight, 
  MapPin, Clock, Loader2, AlertCircle 
} from "lucide-react";

export default function Dashboard() {
  const { churchId, churchName, userName } = useChurch();
  const [loading, setLoading] = useState(true);

  // Estados dos Dados
  const [stats, setStats] = useState({ 
      active: 0, 
      inactive: 0, 
      total: 0 
  });
  
  const [nextEvents, setNextEvents] = useState<any[]>([]);

  useEffect(() => {
    // Só carrega se tivermos o ID da igreja (evita erros de permissão)
    if (churchId) {
        loadDashboardData();
    }
  }, [churchId]);

  const loadDashboardData = async () => {
    try {
        setLoading(true);

        // --- 1. CARREGAR MEMBROS (Contagem Real) ---
        // Buscamos todos para filtrar na memória (mais rápido e barato que múltiplos counts)
        const allMembers = await memberService.listByChurch(churchId);
        
        // Filtra considerando que status pode ser undefined
        const activeCount = allMembers.filter(m => m.status === 'active').length;
        // Qualquer coisa que não seja 'active' conta como inativo/disciplina
        const inactiveCount = allMembers.length - activeCount;

        setStats({
            active: activeCount,
            inactive: inactiveCount,
            total: allMembers.length
        });

        // --- 2. CARREGAR AGENDA ---
        // Data de hoje formato YYYY-MM-DD para comparar strings
        const today = new Date().toISOString().split('T')[0]; 
        
        const eventsRef = collection(db, "events");
        const qEvents = query(
            eventsRef,
            where("churchId", "==", churchId),
            where("date", ">=", today), // Apenas eventos futuros ou de hoje
            orderBy("date", "asc"),
            limit(3) // Top 3 próximos
        );
        
        const eventSnap = await getDocs(qEvents);
        const eventsList = eventSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNextEvents(eventsList);

    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
    } finally {
        setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={40}/>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* CABEÇALHO AZUL */}
      <div className="bg-[#1D4ED8] pt-12 pb-24 px-6 md:px-10 rounded-b-[3rem] shadow-sm relative">
        <div className="max-w-6xl mx-auto flex justify-between items-end">
            <div>
                <p className="text-blue-200 font-medium mb-1">Bem-vindo, {userName}</p>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{churchName}</h1>
            </div>
            
            <div className="flex gap-4">
                <Link href="/agenda" className="hidden md:flex flex-col items-center gap-1 text-white opacity-80 hover:opacity-100 transition">
                    <div className="bg-white/10 p-3 rounded-2xl"><Calendar size={20}/></div>
                    <span className="text-[10px] font-bold">AGENDA</span>
                </Link>
                <Link href="/reports" className="hidden md:flex flex-col items-center gap-1 text-white opacity-80 hover:opacity-100 transition">
                    <div className="bg-white/10 p-3 rounded-2xl"><TrendingUp size={20}/></div>
                    <span className="text-[10px] font-bold">EXTRATO</span>
                </Link>
            </div>
        </div>
      </div>

      {/* CARDS FLUTUANTES */}
      <div className="max-w-6xl mx-auto px-4 -mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: MEMBRESIA */}
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Membresia</span>
                <div className="bg-blue-50 text-blue-600 p-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition"><Users size={20}/></div>
            </div>
            
            <div className="flex items-baseline gap-2">
                <h2 className="text-5xl font-extrabold text-gray-800">{stats.active}</h2>
                <span className="text-sm font-bold text-gray-400">Ativos</span>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                {stats.inactive > 0 ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                        <AlertCircle size={12}/> {stats.inactive} Inativos/Disciplina
                    </div>
                ) : (
                    <span className="text-xs text-green-500 font-bold">100% Ativos</span>
                )}
                <Link href="/members" className="text-blue-600 text-xs font-bold hover:underline">Ver Lista</Link>
            </div>
        </div>

        {/* CARD 2: CAIXA (Placeholder por enquanto) */}
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Caixa Atual</span>
                <div className="bg-green-50 text-green-600 p-2 rounded-xl group-hover:bg-green-600 group-hover:text-white transition"><TrendingUp size={20}/></div>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
                 <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">••••••••</h2>
            </div>
            <p className="text-xs text-gray-400 mb-4">Saldo disponível em conta</p>

            <div className="mt-auto flex gap-2">
                <button className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50">Extrato</button>
                <button className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-200">+ Lançar</button>
            </div>
        </div>

        {/* CARD 3: PRÓXIMOS COMPROMISSOS (AGENDA) */}
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Próximos Eventos</span>
                <Calendar size={18} className="text-gray-300"/>
            </div>

            <div className="flex-1 space-y-4">
                {nextEvents.length === 0 ? (
                    <div className="text-center py-6 text-gray-300">
                        <Calendar size={32} className="mx-auto mb-2 opacity-20"/>
                        <p className="text-xs">Nenhum evento futuro.</p>
                        <Link href="/agenda" className="text-blue-500 text-xs font-bold mt-2 block hover:underline">Agendar Agora</Link>
                    </div>
                ) : (
                    nextEvents.map((evt) => (
                        <div key={evt.id} className="flex gap-3 items-start group">
                            {/* Data Box */}
                            <div className="bg-blue-50 text-blue-700 rounded-xl p-2 text-center min-w-[50px]">
                                <span className="block text-[10px] font-bold uppercase">{new Date(evt.date).toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0,3)}</span>
                                <span className="block text-xl font-black leading-none">{new Date(evt.date).getDate() + 1}</span> 
                                {/* +1 dia no visual pois o JS as vezes subtrai fuso horário ao exibir apenas a data */}
                            </div>
                            
                            {/* Info */}
                            <div>
                                <h4 className="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition">{evt.title}</h4>
                                <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-1">
                                    <span className="flex items-center gap-1"><Clock size={10}/> {evt.time || '19:30'}</span>
                                    <span className="flex items-center gap-1 truncate max-w-[100px]"><MapPin size={10}/> {evt.location || 'Templo'}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                <Link href="/agenda" className="text-blue-600 text-xs font-bold hover:underline flex items-center justify-center gap-1">
                    Ver Calendário Completo <ArrowRight size={12}/>
                </Link>
            </div>
        </div>

      </div>

    </div>
  );
}