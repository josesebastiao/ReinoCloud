"use client";
import { useChurch } from "../contexts/ChurchContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { memberService } from "../services/memberService";
import { financeService } from "../services/financeService";
import { Users, TrendingUp, TrendingDown, ChevronRight, Eye, EyeOff, Menu } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { churchName, userName, userRole, formatMoney } = useChurch();
  const router = useRouter();
  const [totalMembers, setTotalMembers] = useState(0);
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(false);

  useEffect(() => {
    const carregarTudo = async () => {
      // 1. Verifica se tem ID salvo
      const id = localStorage.getItem("churchId");
      
      // 🚨 CORREÇÃO DE SEGURANÇA AQUI:
      // Se não tiver ID, chuta para o Login e para de carregar
      if (!id) {
          router.push("/login");
          return;
      }

      try {
        const membersList = await memberService.listByChurch(id);
        setTotalMembers(membersList.length);

        if (["admin", "pastor", "treasurer"].includes(userRole)) {
            const trans = await financeService.listByChurch(id);
            const totalInc = trans.filter(t => t.type === 'income').reduce((acc, c) => acc + Number(c.amount), 0);
            const totalExp = trans.filter(t => t.type === 'expense').reduce((acc, c) => acc + Number(c.amount), 0);
            setIncome(totalInc);
            setExpense(totalExp);
            setBalance(totalInc - totalExp);
        }
      } catch (error) {
        console.error(error);
        // Se der erro (ex: ID inválido), manda pro login também
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    
    // Pequeno delay para garantir que o localStorage carregou
    setTimeout(carregarTudo, 100);
    
  }, [userRole, router]); // Adicionei router nas dependências

  const openSidebar = () => {
    const menuBtn = document.querySelector('header button svg.lucide-menu')?.parentElement;
    if (menuBtn) menuBtn.click();
  };

  // TELA DE CARREGAMENTO (Agora não trava mais)
  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-500 font-medium animate-pulse">Carregando painel...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">

      {/* --- CABEÇALHO AZUL "ADP STYLE" --- */}
      <div className="bg-blue-600 -mt-4 -mx-4 md:-mt-8 md:-mx-8 pt-8 pb-24 px-6 md:px-10 shadow-sm relative print:hidden">
          
          <div className="md:hidden flex justify-between items-center mb-6">
              <button onClick={openSidebar} className="text-blue-100 hover:bg-blue-500 p-2 rounded-lg transition">
                 <Menu size={24}/>
              </button>
              <div className="w-9 h-9 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm border-2 border-blue-400">
                  {userName ? userName.substring(0,2).toUpperCase() : 'RC'}
              </div>
          </div>

          <div className="animate-in slide-in-from-bottom-3 fade-in duration-500">
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-2">
                Olá, {userName.split(' ')[0]}! <span className="animate-wave">👋</span>
            </h1>
            <p className="text-blue-100 text-lg mt-1 opacity-90">{churchName}</p>
            
            {userRole !== 'member' && (
                <div className="inline-block mt-3 px-3 py-1 rounded-full bg-blue-700/50 text-blue-100 text-xs font-bold uppercase tracking-wider shadow-sm border border-blue-500/30">
                    {userRole === 'admin' ? 'Pastor Titular' : userRole}
                </div>
            )}
          </div>
          
          <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-[0.03] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
      </div>

      {/* --- CARDS COM OVERLAP --- */}
      <div className="px-4 md:px-8 -mt-16 space-y-6 relative z-10">

        {/* CARD MEMBROS */}
        <Link href="/members" className="block group">
            <div className="bg-white p-6 rounded-3xl shadow-lg md:shadow-sm border border-transparent md:border-gray-100 flex items-center justify-between relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Total de Membros</p>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-4xl font-extrabold text-gray-800">{totalMembers}</h2>
                        <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Ativos</span>
                    </div>
                </div>
                <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Users size={28} />
                </div>
                <div className="absolute -right-6 -bottom-6 text-gray-50 opacity-50 group-hover:text-blue-50 transition-colors">
                    <Users size={100} strokeWidth={1.5}/>
                </div>
            </div>
        </Link>

        {/* CARD FINANCEIRO */}
        {["admin", "pastor", "treasurer"].includes(userRole) && (
             <div className="bg-white rounded-3xl shadow-lg md:shadow-sm border border-transparent md:border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl relative">
                <div className="p-6 pb-4 flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            Saldo em Caixa
                            <button onClick={() => setShowBalance(!showBalance)} className="text-gray-300 hover:text-blue-600 transition">
                                {showBalance ? <EyeOff size={16}/> : <Eye size={16}/>}
                            </button>
                        </p>
                        <h2 className="text-4xl font-extrabold text-gray-900 mt-1 tracking-tight">
                            {showBalance ? formatMoney(balance) : 'R$ ••••••'}
                        </h2>
                    </div>
                    <Link href="/financial" className="bg-blue-50 text-blue-600 p-4 rounded-2xl hover:bg-blue-600 hover:text-white transition-colors">
                        <TrendingUp size={28} />
                    </Link>
                </div>

                {showBalance && (
                    <div className="bg-gray-50 p-4 grid grid-cols-2 gap-4 border-t border-gray-100">
                        <div className="bg-green-50 p-3 rounded-xl border border-green-100 animate-in fade-in">
                             <p className="text-xs text-green-700 font-bold uppercase flex items-center gap-1 mb-1"><TrendingUp size={10}/> Entradas</p>
                             <p className="font-bold text-green-700 text-lg truncate">{formatMoney(income)}</p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-xl border border-red-100 animate-in fade-in">
                             <p className="text-xs text-red-700 font-bold uppercase flex items-center gap-1 mb-1"><TrendingDown size={10}/> Saídas</p>
                             <p className="font-bold text-red-700 text-lg truncate">{formatMoney(expense)}</p>
                        </div>
                    </div>
                )}

                <Link href="/financial" className="block bg-gray-50 hover:bg-blue-50 p-4 text-center text-sm font-bold text-blue-600 transition border-t border-gray-100 flex items-center justify-center gap-1 group">
                     Ver Tesouraria Completa <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                </Link>
             </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-4">
             <Link href="/members" className="bg-blue-600 text-white p-4 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition active:scale-95 text-sm md:text-base">
                 <Users size={20}/> <span className="hidden md:inline">Novo Membro</span> <span className="md:hidden">Membro</span>
             </Link>
             <Link href="/financial" className="bg-white text-blue-600 border-2 border-blue-600 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold hover:bg-blue-50 transition active:scale-95 text-sm md:text-base">
                 <TrendingUp size={20}/> <span className="hidden md:inline">Lançar Oferta</span> <span className="md:hidden">Ofertar</span>
             </Link>
        </div>

      </div>
    </div>
  );
}