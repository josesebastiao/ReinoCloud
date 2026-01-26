"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { financeService } from "../../services/financeService";
import { memberService } from "../../services/memberService";
import { Transaction } from "../../types/finance";
import { Member } from "../../types/member";
import { useChurch } from "../../contexts/ChurchContext";
import { 
  DollarSign, TrendingUp, TrendingDown, Plus, 
  Trash2, ArrowUpCircle, ArrowDownCircle, X,
  Calendar, PieChart, Users
} from "lucide-react";

export default function FinancialPage() {
  const router = useRouter();
  const [churchId, setChurchId] = useState("");
  const { formatMoney } = useChurch();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtro de Data (Padrão: Mês atual)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Dízimo");
  const [date, setDate] = useState("");
  const [selectedMember, setSelectedMember] = useState("");

  useEffect(() => {
    const idSalvo = localStorage.getItem("churchId");
    if (!idSalvo) {
      router.push("/login");
      return;
    }
    setChurchId(idSalvo);
    setDate(new Date().toISOString().split('T')[0]);
    carregarDados(idSalvo);
  }, [router]);

  const carregarDados = async (id: string) => {
    try {
      const [listaTransacoes, listaMembros] = await Promise.all([
        financeService.listByChurch(id),
        memberService.listByChurch(id)
      ]);
      setTransactions(listaTransacoes);
      setMembers(listaMembros);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  // --- LÓGICA DO RELATÓRIO MENSAL ---
  
  // 1. Filtrar transações pelo mês selecionado
  const monthlyTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));

  // 2. Totais do Mês
  const income = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const expense = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const balance = income - expense;

  // 3. Agrupar por Categoria (Ex: Quanto foi só de Oferta?)
  const categoryStats = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
      return acc;
    }, {} as Record<string, number>);

  // 4. Contar Dizimistas Únicos no Mês
  const uniqueTithers = new Set(
    monthlyTransactions
      .filter(t => t.category === 'Dízimo' && t.memberId)
      .map(t => t.memberId)
  ).size;

  // --- FIM DA LÓGICA ---

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalDesc = description;
      if (category === 'Dízimo' && selectedMember) {
        const memberName = members.find(m => m.id === selectedMember)?.fullName;
        finalDesc = `Dízimo - ${memberName}`;
      }

      await financeService.create({
        churchId,
        description: finalDesc,
        amount: Number(amount),
        type,
        category,
        date,
        memberId: selectedMember || null 
      });

      setIsModalOpen(false);
      resetForm();
      carregarDados(churchId);
    } catch (error: any) {
      alert(`Erro ao salvar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setSelectedMember("");
    setCategory("Dízimo");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Excluir este lançamento financeiro?")) {
      await financeService.delete(id);
      carregarDados(churchId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* CABEÇALHO COM FILTRO DE MÊS */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tesouraria Inteligente</h1>
          <p className="text-gray-500">Gestão financeira detalhada</p>
        </div>
        
        <div className="flex gap-3">
            <div className="bg-white border rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm">
                <Calendar size={18} className="text-gray-400"/>
                <input 
                    type="month" 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="text-gray-700 font-medium outline-none bg-transparent"
                />
            </div>
            
            <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm font-medium"
            >
            <Plus size={20} /> Lançar
            </button>
        </div>
      </div>

      {/* --- BLOCO 1: RESUMO DO MÊS --- */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Entradas em {selectedMonth.split('-')[1]}/{selectedMonth.split('-')[0]}</p>
          <h3 className="text-2xl font-bold text-green-600">{formatMoney(income)}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Saídas em {selectedMonth.split('-')[1]}/{selectedMonth.split('-')[0]}</p>
          <h3 className="text-2xl font-bold text-red-600">{formatMoney(expense)}</h3>
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-xl shadow-lg">
          <p className="text-sm font-medium text-blue-100 mb-1">Saldo do Mês</p>
          <h3 className="text-3xl font-bold">{formatMoney(balance)}</h3>
        </div>
      </div>

      {/* --- BLOCO 2: DETALHAMENTO DE ENTRADAS --- */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* CARD DE DIZIMISTAS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">Dizimistas neste mês</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">{uniqueTithers} <span className="text-sm font-normal text-gray-400">pessoas</span></h3>
            </div>
            <div className="bg-orange-50 p-3 rounded-full text-orange-600">
                <Users size={24} />
            </div>
        </div>

        {/* DETALHAMENTO POR CATEGORIA (OFERTAS, ETC) */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <PieChart size={16} /> Origem das Entradas
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(categoryStats).map(([cat, val]) => (
                    <div key={cat} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase font-bold">{cat}</p>
                        <p className="text-lg font-bold text-blue-600">{formatMoney(val)}</p>
                    </div>
                ))}
                {Object.keys(categoryStats).length === 0 && <p className="text-gray-400 text-sm">Sem entradas neste mês.</p>}
            </div>
        </div>
      </div>

      {/* --- BLOCO 3: EXTRATO COMPLETO --- */}
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-700">Extrato de {selectedMonth}</h3>
            <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600">{monthlyTransactions.length} lançamentos</span>
        </div>

        {monthlyTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Nenhuma movimentação neste mês.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-white text-gray-500 text-sm border-b border-gray-100">
              <tr>
                <th className="p-4 font-medium">Dia</th>
                <th className="p-4 font-medium">Descrição</th>
                <th className="p-4 font-medium">Categoria</th>
                <th className="p-4 font-medium">Valor</th>
                <th className="p-4 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {monthlyTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 text-gray-600">
                    {t.date.split('-')[2]} {/* Mostra só o dia */}
                  </td>
                  <td className="p-4 font-medium text-gray-900">{t.description}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full text-xs border bg-gray-50 text-gray-600">
                        {t.category}
                    </span>
                  </td>
                  <td className={`p-4 font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'} {formatMoney(t.amount)}
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(t.id!)} className="text-gray-300 hover:text-red-500 transition">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL DE LANÇAMENTO (MANTIDO IGUAL) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Novo Lançamento</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                <button type="button" onClick={() => { setType('income'); setCategory('Dízimo'); }} className={`py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition ${type === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}><ArrowUpCircle size={16} /> Entrada</button>
                <button type="button" onClick={() => { setType('expense'); setCategory('Despesa'); }} className={`py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition ${type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}><ArrowDownCircle size={16} /> Saída</button>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Valor</label>
                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2 border rounded-lg text-lg font-bold text-gray-800" placeholder="0,00" required />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Data</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded-lg" required />
              </div>

              {type === 'income' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-gray-500">Categoria</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 border rounded-lg bg-white">
                      <option>Dízimo</option>
                      <option>Oferta</option>
                      <option>Venda de Bazar</option>
                      <option>Outros</option>
                    </select>
                  </div>
                  {category === 'Dízimo' && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <label className="text-xs font-bold text-gray-500">Membro Dizimista</label>
                      <select value={selectedMember} onChange={e => setSelectedMember(e.target.value)} className="w-full p-2 border rounded-lg bg-white" required>
                        <option value="">Selecione o irmão...</option>
                        {members.map(m => (<option key={m.id} value={m.id}>{m.fullName}</option>))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {(type === 'expense' || category !== 'Dízimo') && (
                <div>
                  <label className="text-xs font-bold text-gray-500">Descrição</label>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded-lg" placeholder={type === 'expense' ? "Ex: Conta de Luz" : "Ex: Oferta do Culto"} required />
                </div>
              )}

              <button type="submit" disabled={loading} className={`w-full py-3 text-white rounded-lg font-bold mt-4 ${type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>{loading ? 'Salvando...' : 'Confirmar Lançamento'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}