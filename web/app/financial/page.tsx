"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { financeService } from "../../services/financeService";
import { memberService } from "../../services/memberService";
import { Transaction } from "../../types/finance";
import { Member } from "../../types/member";
import { 
  DollarSign, TrendingUp, TrendingDown, Plus, 
  Trash2, Calendar, User, ArrowUpCircle, ArrowDownCircle, X 
} from "lucide-react";

export default function FinancialPage() {
  const router = useRouter();
  const [churchId, setChurchId] = useState("");
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

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
    
    // Data de hoje padrão para o formulário
    const hoje = new Date().toISOString().split('T')[0];
    setDate(hoje);

    carregarDados(idSalvo);
  }, [router]);

  const carregarDados = async (id: string) => {
    const [listaTransacoes, listaMembros] = await Promise.all([
      financeService.listByChurch(id),
      memberService.listByChurch(id)
    ]);
    setTransactions(listaTransacoes);
    setMembers(listaMembros);
  };

  // --- CÁLCULOS DOS TOTAIS ---
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const balance = totalIncome - totalExpense;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Se for dízimo e tiver membro selecionado, ajusta a descrição
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
        memberId: selectedMember || undefined
      });

      setIsModalOpen(false);
      resetForm();
      carregarDados(churchId);
      alert("✅ Lançamento salvo!");
    } catch (error: any) { // <--- Adicione : any para o typescript deixar ler o erro
      
      // ESTE CÓDIGO VAI MOSTRAR O ERRO REAL NO CONSOLE
      console.error("🔥 ERRO DETALHADO FIREBASE 🔥");
      console.error("Código:", error.code);
      console.error("Mensagem:", error.message);
      console.error("Objeto completo:", error);

      alert(`Erro ao salvar: ${error.message}`); // Mostra na tela tbm
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

  // Formata moeda (Simples)
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    // Para Angola trocar 'BRL' por 'AOA' e 'pt-BR' por 'pt-AO' futuramente
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tesouraria</h1>
          <p className="text-gray-500">Controle de Dízimos, Ofertas e Despesas</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
        >
          <Plus size={20} /> Novo Lançamento
        </button>
      </div>

      {/* --- CARDS DE RESUMO --- */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Entrada */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Entradas</p>
              <h3 className="text-2xl font-bold text-green-600">{formatMoney(totalIncome)}</h3>
            </div>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        {/* Saída */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Saídas</p>
              <h3 className="text-2xl font-bold text-red-600">{formatMoney(totalExpense)}</h3>
            </div>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <TrendingDown size={24} />
            </div>
          </div>
        </div>

        {/* Saldo */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-blue-100">Saldo Atual</p>
              <h3 className="text-3xl font-bold">{formatMoney(balance)}</h3>
            </div>
            <div className="p-2 bg-white/20 rounded-lg">
              <DollarSign size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* --- TABELA DE LANÇAMENTOS --- */}
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Nenhum lançamento financeiro ainda.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
              <tr>
                <th className="p-4 font-medium">Data</th>
                <th className="p-4 font-medium">Descrição / Categoria</th>
                <th className="p-4 font-medium">Valor</th>
                <th className="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-gray-900">{t.description}</p>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border">
                      {t.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'} {formatMoney(t.amount)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(t.id!)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- MODAL DE LANÇAMENTO --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Novo Lançamento</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Tipo: Entrada ou Saída */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => { setType('income'); setCategory('Dízimo'); }}
                  className={`py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition ${type === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}
                >
                  <ArrowUpCircle size={16} /> Entrada
                </button>
                <button
                  type="button"
                  onClick={() => { setType('expense'); setCategory('Despesa'); }}
                  className={`py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition ${type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}
                >
                  <ArrowDownCircle size={16} /> Saída
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Valor</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  className="w-full p-2 border rounded-lg text-lg font-bold text-gray-800" 
                  placeholder="0,00" 
                  required 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Data</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  className="w-full p-2 border rounded-lg" 
                  required 
                />
              </div>

              {/* Se for Entrada, mostra opções de Dízimo/Oferta */}
              {type === 'income' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-gray-500">Categoria</label>
                    <select 
                      value={category} 
                      onChange={e => setCategory(e.target.value)} 
                      className="w-full p-2 border rounded-lg bg-white"
                    >
                      <option>Dízimo</option>
                      <option>Oferta</option>
                      <option>Venda de Bazar</option>
                      <option>Outros</option>
                    </select>
                  </div>

                  {/* Se for Dízimo, mostra a lista de membros */}
                  {category === 'Dízimo' && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <label className="text-xs font-bold text-gray-500">Membro Dizimista</label>
                      <select 
                        value={selectedMember} 
                        onChange={e => setSelectedMember(e.target.value)} 
                        className="w-full p-2 border rounded-lg bg-white"
                        required
                      >
                        <option value="">Selecione o irmão...</option>
                        {members.map(m => (
                          <option key={m.id} value={m.id}>{m.fullName}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Se for Saída ou Oferta (sem membro), mostra campo de descrição manual */}
              {(type === 'expense' || category !== 'Dízimo') && (
                <div>
                  <label className="text-xs font-bold text-gray-500">Descrição</label>
                  <input 
                    type="text" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    className="w-full p-2 border rounded-lg" 
                    placeholder={type === 'expense' ? "Ex: Conta de Luz" : "Ex: Oferta do Culto"} 
                    required 
                  />
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className={`w-full py-3 text-white rounded-lg font-bold mt-4 ${type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {loading ? 'Salvando...' : 'Confirmar Lançamento'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}