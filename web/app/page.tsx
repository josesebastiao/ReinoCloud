"use client";
import { useState, useEffect } from "react";
import { memberService } from "../services/memberService";
import { financeService } from "../services/financeService";
import { agendaService } from "../services/agendaService"; 
import { useChurch } from "../contexts/ChurchContext";
import { Users, UserCheck, DollarSign, TrendingUp, TrendingDown, ArrowRight, Calendar, Clock } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { formatMoney } = useChurch();
  const [churchName, setChurchName] = useState("Minha Igreja");
  const [userName, setUserName] = useState("Carregando...");
  const [userRole, setUserRole] = useState("admin");
  const [loading, setLoading] = useState(true);
  
  // Estado para Agenda
  const [nextEvents, setNextEvents] = useState<any[]>([]);

  const [stats, setStats] = useState({
    totalMembers: 0, activeMembers: 0, inactiveMembers: 0,
    balance: 0, income: 0, expense: 0
  });

  useEffect(() => {
    const idSalvo = localStorage.getItem("churchId");
    const roleSalvo = localStorage.getItem("userRole") || "admin";
    const nomeSalvo = localStorage.getItem("userName");
    
    // NOME DA IGREJA REAL
    const nomeIgrejaSalvo = localStorage.getItem("churchName");
    if (nomeIgrejaSalvo) setChurchName(nomeIgrejaSalvo);

    if (nomeSalvo) setUserName(nomeSalvo.split(' ')[0]);
    setUserRole(roleSalvo);

    if (idSalvo) carregarDados(idSalvo);
  }, []);

  const carregarDados = async (churchId: string) => {
    try {
      setLoading(true);
      
      // Carrega Membros e Finanças
      const [members, transactions] = await Promise.all([
        memberService.listByChurch(churchId).catch(() => []),
        financeService.listByChurch(churchId).catch(() => [])
      ]);

      // --- CARREGA AGENDA ---
      const todayStr = new Date().toISOString().split('T')[0];
      const allEvents = await agendaService.listByChurch(churchId);
      
      // Filtra e Ordena aqui no código para não precisar de índice no Firebase agora
      const upcoming = allEvents
        .filter((e:any) => e.date >= todayStr) // Só eventos futuros ou de hoje
        .sort((a:any, b:any) => a.date.localeCompare(b.date)) // Ordena por data
        .slice(0, 2); // Pega só os 2 primeiros
        
      setNextEvents(upcoming);

      // Cálculos Financeiros
      const income = transactions.filter(t => t.type === 'income').reduce((acc, c) => acc + Number(c.amount), 0);
      const expense = transactions.filter(t => t.type === 'expense').reduce((acc, c) => acc + Number(c.amount), 0);

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

  if (loading) return <div className="p-8 text-gray-500">Carregando painel...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Olá, {userName}! 👋</h1>
        <p className="text-gray-500 text-lg">{churchName}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Card Membros */}
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

        {/* Card Financeiro */}
        {canSeeFinance && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Saldo em Caixa</p>
                <h3 className={`text-3xl font-bold mt-2 ${stats.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                  {formatMoney(stats.balance)}
                </h3>
                <div className="flex gap-3 mt-2 text-xs text-gray-400">
                   <span className="flex items-center gap-1"><TrendingUp size={12} className="text-green-500"/> Entradas</span>
                   <span className="flex items-center gap-1"><TrendingDown size={12} className="text-red-500"/> Saídas</span>
                </div>
              </div>
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><DollarSign size={24} /></div>
            </div>
          </div>
        )}

        {/* Card Agenda */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-medium text-gray-500">Próximos Compromissos</p>
                <Calendar size={18} className="text-orange-500"/>
            </div>
            
            {nextEvents.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Nenhum evento agendado.</p>
            ) : (
                <div className="space-y-3">
                    {nextEvents.map((evt) => (
                        <div key={evt.id} className="flex gap-3 items-center pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                            <div className="bg-orange-50 text-orange-600 text-xs font-bold px-2 py-1 rounded text-center min-w-[40px]">
                                {new Date(evt.date).getDate()}<br/>
                                {new Date(evt.date).toLocaleDateString('pt-BR', {month:'short'}).slice(0,3)}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800 line-clamp-1">{evt.title}</p>
                                <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10}/> {evt.time}</p>
                            </div>
                        </div>
                    ))}
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