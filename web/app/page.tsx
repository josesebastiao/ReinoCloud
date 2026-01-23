"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { memberService } from "../services/memberService";
import { Member } from "../types/member";
import { Users, UserCheck, UserX, Calendar, ArrowUpRight, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const [churchName, setChurchName] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    newThisMonth: 0
  });
  const [recentMembers, setRecentMembers] = useState<Member[]>([]);

  useEffect(() => {
    const idSalvo = localStorage.getItem("churchId");
    const nomeSalvo = localStorage.getItem("churchName");

    if (!idSalvo) {
      router.push("/login");
      return;
    }

    setChurchName(nomeSalvo || "Minha Igreja");
    carregarDados(idSalvo);
  }, [router]);

  const carregarDados = async (churchId: string) => {
    try {
      // Buscamos todos para calcular as métricas localmente
      // (No futuro, com milhares de membros, faremos essa conta no servidor para ser mais rápido)
      const lista = await memberService.listByChurch(churchId);
      
      const active = lista.filter(m => m.status === 'active').length;
      const inactive = lista.filter(m => m.status !== 'active').length;
      
      // Simulação de "Novos no mês" (Baseado na data de criação se tiver, ou fake por enquanto)
      // Como não salvamos created_at em todos, vamos assumir os 5 ultimos como recentes
      const recents = lista.slice(0, 5); 

      setStats({
        total: lista.length,
        active,
        inactive,
        newThisMonth: lista.length // Por enquanto é o total, depois filtramos por data
      });

      setRecentMembers(recents);

    } catch (error) {
      console.error("Erro ao carregar dashboard", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Olá, Pastor! 👋</h1>
        <p className="text-gray-500">Aqui está o resumo da {churchName} hoje.</p>
      </div>

      {/* Grid de Cards (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Card 1: Total */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total de Membros</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Users size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600 gap-1">
            <ArrowUpRight size={16} />
            <span className="font-medium">Base atualizada</span>
          </div>
        </div>

        {/* Card 2: Ativos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Membros Ativos</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.active}</h3>
            </div>
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <UserCheck size={24} />
            </div>
          </div>
          <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(stats.active / (stats.total || 1)) * 100}%` }}></div>
          </div>
        </div>

        {/* Card 3: Inativos (Oportunidade de Resgate) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Inativos / Afastados</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.inactive}</h3>
            </div>
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <UserX size={24} />
            </div>
          </div>
          <p className="mt-4 text-xs text-red-500 font-medium">Necessitam de visita</p>
        </div>

        {/* Card 4: Aniversariantes (Placeholder) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition opacity-70">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Aniversariantes (Mês)</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">0</h3>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <Calendar size={24} />
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-400">Em breve...</p>
        </div>
      </div>

      {/* Seção Inferior: Últimos Cadastrados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista Recente (Ocupa 2 colunas) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800">Últimos Cadastros</h2>
            <Link href="/members" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
              Ver todos <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentMembers.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition border border-transparent hover:border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                    {member.fullName.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.fullName}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded-full">Novo</span>
                </div>
              </div>
            ))}
            {recentMembers.length === 0 && <p className="text-gray-400 text-sm">Nenhum registro recente.</p>}
          </div>
        </div>

        {/* Card de Ação Rápida (Atalhos) */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
          <h2 className="text-xl font-bold mb-2">Atalhos Rápidos</h2>
          <p className="text-blue-100 text-sm mb-6">Acesse as funções mais usadas da secretaria.</p>
          
          <div className="space-y-3">
            <Link href="/members" className="block w-full bg-white/10 hover:bg-white/20 p-3 rounded-lg flex items-center gap-3 transition backdrop-blur-sm">
              <Users size={20} />
              <span className="font-medium">Cadastrar Novo Membro</span>
            </Link>
            <button className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-lg flex items-center gap-3 transition backdrop-blur-sm opacity-50 cursor-not-allowed">
              <Calendar size={20} />
              <span className="font-medium">Agendar Evento (Em breve)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}