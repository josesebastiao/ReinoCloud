"use client";
import { useState, useEffect } from "react";
import { memberService } from "../services/memberService";
import { financeService } from "../services/financeService";
import { agendaService } from "../services/agendaService"; 
import { useChurch } from "../contexts/ChurchContext";
import { 
  Users, UserCheck, DollarSign, TrendingUp, TrendingDown, ArrowRight, 
  Calendar, Clock, Eye, EyeOff, ChevronDown, ChevronUp, FileText 
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { formatMoney } = useChurch();
  const [churchName, setChurchName] = useState("Minha Igreja");
  const [userName, setUserName] = useState("Carregando...");
  const [userRole, setUserRole] = useState("admin");
  const [loading, setLoading] = useState(true);
  
  // Controle de Visibilidade (Olhinho) e Expansão
  const [showValues, setShowValues] = useState(true);
  const [expandFinance, setExpandFinance] = useState(false);
  
  const [nextEvents, setNextEvents] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  const [stats, setStats] = useState({
    totalMembers: 0, activeMembers: 0, inactiveMembers: 0,
    balance: 0, income: 0, expense: 0
  });

  useEffect(() => {
    const idSalvo = localStorage.getItem("churchId");
    const roleSalvo = localStorage.getItem("userRole") || "admin";
    const nomeSalvo = localStorage.getItem("userName");
    
    const nomeIgrejaSalvo = localStorage.getItem("churchName");
    if (nomeIgrejaSalvo) setChurchName(nomeIgrejaSalvo);

    if (nomeSalvo) setUserName(nomeSalvo.split(' ')[0]);
    setUserRole(roleSalvo);

    if (idSalvo) carregarDados(idSalvo);
  }, []);

  const carregarDados = async (churchId: string) => {
    try {
      setLoading(true);
      
      const [members, transactions] = await Promise.all([
        memberService.listByChurch(churchId).catch(() => []),
        financeService.listByChurch(churchId).catch(() => [])
      ]);

      // --- CORREÇÃO DA DATA DA AGENDA (DATA LOCAL) ---
      const today = new Date();
      // Ajusta para YYYY-MM-DD local (evita erro de fuso horário)
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const allEvents = await agendaService.listByChurch(churchId);
      
      const upcoming = allEvents
        .filter((e:any) => e.date >= todayStr) // Pega hoje e futuro
        .sort((a:any, b:any) => a.date.localeCompare(b.date))
        .slice(0, 3); // Aumentei para 3 eventos
        
      setNextEvents(upcoming);

      // --- CÁLCULOS E EXTRATO ---
      const income = transactions.filter(t => t.type === 'income').reduce((acc, c) => acc + Number(c.amount), 0);
      const expense = transactions.filter(t => t.type === 'expense').reduce((acc, c) => acc + Number(c.amount), 0);
      
      // Pega os últimos 3 lançamentos para o "Mini Extrato"
      const recent = transactions
        .sort((a:any, b:any) => b.date.localeCompare(a.date)) // Mais recentes primeiro
        .slice(0, 4);
      setRecentTransactions(recent);

      setStats({
        totalMembers: members.length,
        activeMembers: members.filter(m => m.status === 'active').length,
        inactiveMembers: members.filter(m => m.status !== 'active').length,
        balance: income - expense,
        income, expense
      });

    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const canSeeFinance = ['admin', 'pastor', 'treasurer'].includes(userRole);

  if (loading) return <div className="p-8 text-gray-500">Atualizando painel...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Olá, {userName}! 👋</h1>
        <p className="text-gray-500 text-lg">{churchName}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        {/* 1. CARD MEMBROS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total de Membros</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.totalMembers}</h3>
                <div className="flex gap-3 mt-2 text-xs">
                  <span className="text-green-600 flex items-center gap-1"><UserCheck size={12}/> {stats.activeMembers} Ativos</span>
                </div>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Users size={24} /></div>
            </div>
        </div>

        {/* 2. CARD FINANCEIRO INTELIGENTE */}
        {canSeeFinance && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative group transition-all">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-gray-500">Saldo em Caixa</p>
              {/* BOTÃO OLHO (VISIBILIDADE) */}
              <button onClick={() => setShowValues(!showValues)} className="text-gray-400 hover:text-blue-600 transition">
                 {showValues ? <Eye size={20}/> : <EyeOff size={20}/>}
              </button>
            </div>
            
            <h3 className={`text-3xl font-bold mb-4 ${stats.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              {showValues ? formatMoney(stats.balance) : "----"}
            </h3>

            {/* BARRA DE ENTRADAS/SAÍDAS */}
            <div className="flex items-center gap-2 text-xs mb-4">
                <div className="flex-1 bg-green-50 text-green-700 px-2 py-1 rounded flex justify-between items-center">
                    <span className="flex items-center gap-1"><TrendingUp size={12}/> Entradas</span>
                    <span className="font-bold">{showValues ? formatMoney(stats.income) : "..."}</span>
                </div>
                <div className="flex-1 bg-red-50 text-red-700 px-2 py-1 rounded flex justify-between items-center">
                    <span className="flex items-center gap-1"><TrendingDown size={12}/> Saídas</span>
                    <span className="font-bold">{showValues ? formatMoney(stats.expense) : "..."}</span>
                </div>
            </div>

            {/* BOTÃO EXPANDIR MINI EXTRATO */}
            <button 
                onClick={() => setExpandFinance(!expandFinance)}
                className="w-full text-xs flex items-center justify-center gap-1 text-gray-400 hover:text-gray-600 border-t pt-2 mt-2"
            >
                {expandFinance ? "Ocultar detalhes" : "Ver últimas movimentações"} 
                {expandFinance ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            </button>

            {/* MINI EXTRATO (EXPANDÍVEL) */}
            {expandFinance && (
                <div className="mt-3 space-y-2 border-t border-gray-50 pt-2 animate-in slide-in-from-top-2">
                    {recentTransactions.length === 0 ? (
                        <p className="text-xs text-center text-gray-400 py-2">Sem movimentações.</p>
                    ) : (
                        recentTransactions.map((t) => (
                            <div key={t.id} className="flex justify-between items-center text-xs">
                                <span className="text-gray-600 truncate max-w-[120px]">{t.description}</span>
                                <span className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                                    {t.type === 'income' ? '+' : '-'} {showValues ? formatMoney(t.amount) : "..."}
                                </span>
                            </div>
                        ))
                    )}
                     <Link href="/financial" className="block text-center text-xs font-bold text-blue-600 mt-2 hover:underline">
                        Ir para Financeiro Completo →
                    </Link>
                </div>
            )}
          </div>
        )}

        {/* 3. CARD AGENDA (CORRIGIDO) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-medium text-gray-500">Próximos Compromissos</p>
                <Calendar size={18} className="text-orange-500"/>
            </div>
            
            {nextEvents.length === 0 ? (
                <div className="text-center py-4">
                    <p className="text-sm text-gray-400 italic mb-2">Agenda livre hoje.</p>
                    <Link href="/agenda" className="text-xs text-blue-600 font-bold hover:underline">
                        + Agendar Evento
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {nextEvents.map((evt) => (
                        <div key={evt.id} className="flex gap-3 items-center pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                            <div className="bg-orange-50 text-orange-600 text-xs font-bold px-2 py-1 rounded text-center min-w-[40px]">
                                {new Date(evt.date).getDate()}<br/>
                                {new Date(evt.date).toLocaleDateString('pt-BR', {month:'short'}).slice(0,3)}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-gray-800 truncate">{evt.title}</p>
                                <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10}/> {evt.time}</p>
                            </div>
                        </div>
                    ))}
                    <Link href="/agenda" className="block text-right text-xs text-gray-400 hover:text-blue-600 mt-2">
                        Ver agenda completa →
                    </Link>
                </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {canSeeFinance && (
          <Link href="/financial" className="block p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center justify-between shadow-lg shadow-blue-900/20">
              <div className="flex items-center gap-3"><div className="bg-white/20 p-2 rounded-lg"><DollarSign size={20}/></div><div><h3 className="font-bold">Ir para Tesouraria</h3><p className="text-blue-100 text-sm">Lançar dízimos e ofertas</p></div></div><ArrowRight />
          </Link>
        )}
        <Link href="/members" className="block p-4 bg-white border border-gray-200 text-gray-800 rounded-xl hover:bg-gray-50 transition flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="bg-gray-100 p-2 rounded-lg"><Users size={20}/></div><div><h3 className="font-bold">Gerenciar Membros</h3><p className="text-gray-500 text-sm">Cadastrar ou editar fichas</p></div></div><ArrowRight className="text-gray-400" />
        </Link>
      </div>
    </div>
  );
}