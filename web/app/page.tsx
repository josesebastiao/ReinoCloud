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
  const [showBalance, setShowBalance] = useState(false); // Começa oculto por padrão (segurança)

  useEffect(() => {
    const carregarTudo = async () => {
      const id = localStorage.getItem("churchId");
      if (!id) return;
      try {
        // Busca Membros
        const membersList = await memberService.listByChurch(id);
        setTotalMembers(membersList.length);

        // Busca Finanças (apenas se tiver permissão)
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
      } finally {
        setLoading(false);
      }
    };
    carregarTudo();
  }, [userRole]);

  // Função para "abrir o menu" (simula o clique no botão do layout)
  const openSidebar = () => {
    const menuBtn = document.querySelector('header button svg.lucide-menu')?.parentElement;
    if (menuBtn) menuBtn.click();
  };

  return (
    // Tirei o padding padrão (p-4 md:p-8) daqui para controlar manualmente
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">

      {/* --- CABEÇALHO AZUL "ESTILO ADP" --- */}
      {/* Cria um fundo azul grande no topo */}
      <div className="bg-blue-600 -mt-4 -mx-4 md:-mt-8 md:-mx-8 pt-8 pb-24 px-6 md:px-10 shadow-sm relative print:hidden">
          
          {/* Barra Superior Mobile (Menu e Perfil) - Agora em BRANCO */}
          <div className="md:hidden flex justify-between items-center mb-6">
              <button onClick={openSidebar} className="text-blue-100 hover:bg-blue-500 p-2 rounded-lg transition">
                 <Menu size={24}/>
              </button>
              <div className="w-9 h-9 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm border-2 border-blue-400">
                  {userName.substring(0,2).toUpperCase()}
              </div>
          </div>

          {/* Saudação e Nome da Igreja (Texto Branco) */}
          <div className="animate-in slide-in-from-bottom-3 fade-in duration-500">
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-2">
                Olá, {userName.split(' ')[0]}! <span className="animate-wave">👋</span>
            </h1>
            <p className="text-blue-100 text-lg mt-1 opacity-90">{churchName}</p>
            
            {/* Cargo (Badge Transparente) */}
            {userRole !== 'member' && (
                <div className="inline-block mt-3 px-3 py-1 rounded-full bg-blue-700/50 text-blue-100 text-xs font-bold uppercase tracking-wider shadow-sm border border-blue-500/30">
                    {userRole === 'admin' ? 'Pastor Titular' : userRole}
                </div>
            )}
          </div>

          {/* Efeito de Fundo (opcional, para dar textura) */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-[0.03] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
      </div>

      {/* --- CONTEÚDO DOS CARDS (COM OVERLAP) --- */}
      {/* Margem negativa (-mt-16) puxa os cards para cima do azul */}
      <div className="px-4 md:px-8 -mt-16 space-y-6 relative z-10">

        {/* CARD MEMBROS (Mais robusto e largo) */}
        <Link href="/members" className="block group">
            <div className="bg-white p-6 rounded-3xl shadow-lg md:shadow-sm border border-transparent md:border-gray-100 flex items-center justify-between relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Total de Membros</p>
                    <div className="flex items-baseline gap-2">
                        {loading ? (
                            <div className="h-10 w-16 bg-gray-200 rounded animate-pulse"/>
                        ) : (
                            <h2 className="text-4xl font-extrabold text-gray-800">{totalMembers}</h2>
                        )}
                        <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                             Ativos
                        </span>
                    </div>
                </div>
                <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Users size={28} />
                </div>
                {/* Decoração de fundo */}
                <div className="absolute -right-6 -bottom-6 text-gray-50 opacity-50 group-hover:text-blue-50 transition-colors">
                    <Users size={100} strokeWidth={1.5}/>
                </div>
            </div>
        </Link>

        {/* CARD FINANCEIRO (Estilo "Batida" da ADP - Grande e Inponente) */}
        {["admin", "pastor", "treasurer"].includes(userRole) && (
             <div className="bg-white rounded-3xl shadow-lg md:shadow-sm border border-transparent md:border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl relative">
                
                {/* Cabeçalho do Card */}
                <div className="p-6 pb-4 flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            Saldo em Caixa
                            <button onClick={() => setShowBalance(!showBalance)} className="text-gray-300 hover:text-blue-600 transition">
                                {showBalance ? <EyeOff size={16}/> : <Eye size={16}/>}
                            </button>
                        </p>
                        {loading ? (
                            <div className="h-12 w-48 bg-gray-200 rounded animate-pulse mt-2"/>
                        ) : (
                            <h2 className="text-4xl font-extrabold text-gray-900 mt-1 tracking-tight">
                                {showBalance ? formatMoney(balance) : 'R$ ••••••'}
                            </h2>
                        )}
                    </div>
                    <Link href="/financial" className="bg-blue-50 text-blue-600 p-4 rounded-2xl hover:bg-blue-600 hover:text-white transition-colors">
                        <TrendingUp size={28} />
                    </Link>
                </div>

                {/* Resumo de Entradas e Saídas (Bloco Colorido) */}
                {showBalance && !loading && (
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

                {/* Botão de Ação no Rodapé */}
                <Link href="/financial" className="block bg-gray-50 hover:bg-blue-50 p-4 text-center text-sm font-bold text-blue-600 transition border-t border-gray-100 flex items-center justify-center gap-1 group">
                     Ver Tesouraria Completa <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                </Link>
             </div>
        )}

        {/* Atalhos Rápidos (Opcional, para preencher o espaço estilo ADP) */}
        <div className="grid grid-cols-2 gap-4 pt-4">
             <Link href="/members" className="bg-blue-600 text-white p-4 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition active:scale-95">
                 <Users size={20}/> Novo Membro
             </Link>
             <Link href="/financial" className="bg-white text-blue-600 border-2 border-blue-600 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold hover:bg-blue-50 transition active:scale-95">
                 <TrendingUp size={20}/> Lançar Oferta
             </Link>
        </div>

      </div>
    </div>
  );
}