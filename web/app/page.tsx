"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { memberService } from "../services/memberService";
import { financeService } from "../services/financeService";
import { Member } from "../types/member";
import { Transaction } from "../types/finance";
import { useChurch } from "../contexts/ChurchContext";
import { Users, UserCheck, UserX, DollarSign, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const { formatMoney } = useChurch();
  const [churchName, setChurchName] = useState("");
  const [userName, setUserName] = useState("Pastor");
  const [userRole, setUserRole] = useState("admin"); // <--- Guardamos o cargo
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    inactiveMembers: 0,
    balance: 0,
    income: 0,
    expense: 0
  });

  useEffect(() => {
    const idSalvo = localStorage.getItem("churchId");
    const nomeUsuario = localStorage.getItem("userName");
    const role = localStorage.getItem("userRole") || "admin";
    
    setUserRole(role); // Define o cargo

    if (nomeUsuario) setUserName(nomeUsuario.split(' ')[0]);
    if (!idSalvo) return; 

    setChurchName(localStorage.getItem("churchName") || "Minha Igreja");
    carregarDados(idSalvo);
  }, []);

  const carregarDados = async (churchId: string) => {
    try {
      setLoading(true);
      // Carrega membros e finanças... (Mantido igual)
      // Obs: Se o usuário não tiver permissão no Firebase Rules no futuro, aqui daria erro,
      // mas por enquanto no front escondemos os dados.
      let members: Member[] = [];
      try { members = await memberService.listByChurch(churchId); } catch (e) {}

      let transactions: Transaction[] = [];
      try { transactions = await financeService.listByChurch(churchId); } catch (e) {}

      const active = members.filter(m => m.status === 'active').length;
      const inactive = members.filter(m => m.status !== 'active').length;
      const income = transactions.filter(t => t.type === 'income').reduce((acc, c) => acc + Number(c.amount), 0);
      const expense = transactions.filter(t => t.type === 'expense').reduce((acc, c) => acc + Number(c.amount), 0);

      setStats({
        totalMembers: members.length,
        activeMembers: active,
        inactiveMembers: inactive,
        balance: income - expense,
        income,
        expense
      });
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  // Funções auxiliares de permissão
  const canSeeMembers = ['admin', 'pastor', 'secretary'].includes(userRole);
  const canSeeFinance = ['admin', 'pastor', 'treasurer'].includes(userRole);

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando painel...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Olá, {userName}! 👋</h1>
        <p className="text-gray-500">Resumo da {churchName}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        {/* SÓ MOSTRA SE TIVER PERMISSÃO DE MEMBROS */}
        {canSeeMembers && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total de Membros</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.totalMembers}</h3>
                <div className="flex gap-3 mt-2 text-xs">
                  <span className="text-green-600 flex items-center gap-1"><UserCheck size={12}/> {stats.activeMembers} Ativos</span>
                  <span className="text-red-500 flex items-center gap-1"><UserX size={12}/> {stats.inactiveMembers} Inativos</span>
                </div>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Users size={24} /></div>
            </div>
          </div>
        )}

        {/* SÓ MOSTRA SE TIVER PERMISSÃO DE FINANCEIRO */}
        {canSeeFinance && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Saldo em Caixa</p>
                <h3 className={`text-3xl font-bold mt-2 ${stats.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                  {formatMoney(stats.balance)}
                </h3>
              </div>
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><DollarSign size={24} /></div>
            </div>
          </div>
        )}

        {/* FLUXO (Só Financeiro vê) */}
        {canSeeFinance && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-green-600"><TrendingUp size={16} /> <span className="text-sm font-medium">Entradas</span></div>
                <span className="font-bold text-gray-700">{formatMoney(stats.income)}</span>
              </div>
              <div className="w-full bg-gray-100 h-1 rounded-full"><div className="bg-green-500 h-1 rounded-full" style={{width: '100%'}}></div></div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-red-600"><TrendingDown size={16} /> <span className="text-sm font-medium">Saídas</span></div>
                <span className="font-bold text-gray-700">{formatMoney(stats.expense)}</span>
              </div>
              <div className="w-full bg-gray-100 h-1 rounded-full"><div className="bg-red-500 h-1 rounded-full" style={{width: `${stats.income > 0 ? (stats.expense/stats.income)*100 : 0}%`}}></div></div>
            </div>
          </div>
        )}
      </div>

      {/* ATALHOS INTELIGENTES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {canSeeFinance && (
          <Link href="/financial" className="block p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg"><DollarSign size={20}/></div>
                  <div>
                      <h3 className="font-bold">Ir para Tesouraria</h3>
                      <p className="text-blue-100 text-sm">Lançar dízimos e ofertas</p>
                  </div>
              </div>
              <ArrowRight />
          </Link>
        )}
        
        {canSeeMembers && (
          <Link href="/members" className="block p-4 bg-white border border-gray-200 text-gray-800 rounded-xl hover:bg-gray-50 transition flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-lg"><Users size={20}/></div>
                  <div>
                      <h3 className="font-bold">Gerenciar Membros</h3>
                      <p className="text-gray-500 text-sm">Cadastrar ou editar fichas</p>
                  </div>
              </div>
              <ArrowRight className="text-gray-400" />
          </Link>
        )}
      </div>
    </div>
  );
}