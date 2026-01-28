"use client";
import { useChurch } from "../contexts/ChurchContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { memberService } from "../services/memberService";
import { financeService } from "../services/financeService";
import { Users, TrendingUp, ChevronRight, Eye, EyeOff, Calendar, Clock } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { churchName, userName, userRole, formatMoney } = useChurch();
  const router = useRouter();
  const [totalMembers, setTotalMembers] = useState(0);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(false);

  // Agenda Fictícia
  const nextEvents = [
    { id: 1, title: "Culto de Doutrina", date: "Hoje", time: "19:30", location: "Templo Maior" },
    { id: 2, title: "Santa Ceia", date: "Domingo", time: "09:00", location: "Templo Maior" },
  ];

  useEffect(() => {
    const carregarTudo = async () => {
      const id = localStorage.getItem("churchId");
      if (!id) { router.push("/login"); return; }

      try {
        const membersList = await memberService.listByChurch(id);
        setTotalMembers(membersList.length);

        if (["admin", "pastor", "treasurer"].includes(userRole)) {
            const trans = await financeService.listByChurch(id);
            const totalInc = trans.filter(t => t.type === 'income').reduce((acc, c) => acc + Number(c.amount), 0);
            const totalExp = trans.filter(t => t.type === 'expense').reduce((acc, c) => acc + Number(c.amount), 0);
            setBalance(totalInc - totalExp);
        }
      } catch (error) {
        console.error(error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    setTimeout(carregarTudo, 100);
  }, [userRole, router]);

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8 overflow-x-hidden"> {/* Adicionei overflow-x-hidden aqui também */}

      {/* --- CABEÇALHO AZUL (Estilo ADP) --- */}
      {/* MUDANÇA AQUI: Removidas as margens negativas que causavam o 'samba' */}
      <div className="bg-blue-600 pt-8 pb-24 px-6 md:pt-12 md:pb-32 shadow-sm relative print:hidden w-full">
          
          <div className="max-w-6xl mx-auto md:text-center animate-in slide-in-from-bottom-3 fade-in duration-500 relative z-10">
            <h1 className="text-3xl md:text-5xl font-bold text-white flex items-center md:justify-center gap-2">
                Olá, {userName.split(' ')[0]} <span className="animate-wave">👋</span>
            </h1>
            <p className="text-blue-100 text-lg md:text-xl mt-2 opacity-90 font-medium">{churchName}</p>
            
            {/* Atalhos Rápidos PC */}
            <div className="hidden md:flex justify-center gap-6 mt-8">
                 <Link href="/reports" className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white border-2 border-blue-400 group-hover:bg-white group-hover:text-blue-600 transition">
                        <Calendar size={20}/>
                    </div>
                    <span className="text-xs text-blue-100 font-bold uppercase tracking-wider">Agenda</span>
                 </Link>
                 <Link href="/financial" className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white border-2 border-blue-400 group-hover:bg-white group-hover:text-blue-600 transition">
                        <TrendingUp size={20}/>
                    </div>
                    <span className="text-xs text-blue-100 font-bold uppercase tracking-wider">Extrato</span>
                 </Link>
            </div>
          </div>

          {/* Textura de fundo */}
          <div className="absolute right-0 top-0 w-full h-full overflow-hidden pointer-events-none">
             <div className="absolute right-0 top-0 w-96 h-96 bg-white opacity-[0.03] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
             <div className="absolute left-0 bottom-0 w-64 h-64 bg-black opacity-[0.05] rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
          </div>
      </div>

      {/* --- GRID DE CARDS --- */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-16 md:-mt-20 space-y-6 relative z-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* 1. CARD MEMBROS */}
            <Link href="/members" className="block group h-full">
                <div className="bg-white h-full p-6 rounded-3xl shadow-lg md:shadow-md border border-transparent md:border-gray-100 flex flex-col justify-between relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Membresia</p>
                            <h2 className="text-5xl font-extrabold text-gray-800 tracking-tight">{totalMembers}</h2>
                            <span className="inline-block mt-2 text-xs font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-md">
                                Ativos e Comunungantes
                            </span>
                        </div>
                        <div className="bg-blue-50 text-blue-600 p-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Users size={24} />
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-50 flex items-center text-blue-600 text-sm font-bold group-hover:underline">
                        Acessar Lista Completa <ChevronRight size={16}/>
                    </div>
                </div>
            </Link>

            {/* 2. CARD FINANCEIRO */}
            {["admin", "pastor", "treasurer"].includes(userRole) && (
                <div className="bg-white h-full p-0 rounded-3xl shadow-lg md:shadow-md border border-transparent md:border-gray-100 overflow-hidden flex flex-col transition-all hover:shadow-xl">
                    <div className="p-6 pb-2 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Caixa Atual</p>
                                <button onClick={(e) => {e.preventDefault(); setShowBalance(!showBalance)}} className="text-gray-300 hover:text-blue-600">
                                    {showBalance ? <EyeOff size={14}/> : <Eye size={14}/>}
                                </button>
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight truncate">
                                {showBalance ? formatMoney(balance) : '••••••••'}
                            </h2>
                        </div>
                        <div className="bg-green-50 text-green-600 p-3 rounded-xl">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    
                    <div className="mt-auto p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-3">
                         <Link href="/financial" className="bg-white border border-gray-200 text-gray-700 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-gray-50">
                            Extrato
                         </Link>
                         <Link href="/financial" className="bg-blue-600 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-700 shadow-sm">
                            + Lançar
                         </Link>
                    </div>
                </div>
            )}

            {/* 3. CARD AGENDA */}
            <div className="bg-white h-full p-6 rounded-3xl shadow-lg md:shadow-md border border-transparent md:border-gray-100 flex flex-col relative overflow-hidden">
                 <div className="flex justify-between items-start mb-4">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Próximos Compromissos</p>
                    <Calendar size={20} className="text-gray-300"/>
                 </div>
                 
                 <div className="space-y-4 flex-1">
                     {nextEvents.map(event => (
                         <div key={event.id} className="flex gap-3 items-start">
                             <div className="w-10 flex-shrink-0 flex flex-col items-center bg-blue-50 rounded-lg p-1">
                                 <span className="text-[10px] uppercase font-bold text-blue-400">{event.date === 'Hoje' ? 'HJ' : 'DOM'}</span>
                                 <span className="text-sm font-bold text-blue-700">{event.date === 'Hoje' ? new Date().getDate() : new Date().getDate() + 2}</span>
                             </div>
                             <div>
                                 <p className="font-bold text-gray-800 text-sm">{event.title}</p>
                                 <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Clock size={10}/> {event.time} • {event.location}</p>
                             </div>
                         </div>
                     ))}
                 </div>
                 
                 <Link href="/agenda" className="mt-4 pt-3 border-t border-gray-50 text-center text-xs font-bold text-blue-600 block hover:underline">
                    Ver Calendário Completo
                 </Link>
            </div>

        </div>

        {/* BOTÕES GIGANTES MOBILE */}
        <div className="grid grid-cols-2 gap-4 pt-2">
             <Link href="/members" className="bg-blue-600 text-white p-4 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition active:scale-95 text-sm md:text-lg md:py-6">
                 <Users size={20}/> Membresia
             </Link>
             <Link href="/financial" className="bg-white text-blue-600 border-2 border-blue-600 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold hover:bg-blue-50 transition active:scale-95 text-sm md:text-lg md:py-6">
                 <TrendingUp size={20}/> Tesouraria
             </Link>
        </div>

      </div>
    </div>
  );
}