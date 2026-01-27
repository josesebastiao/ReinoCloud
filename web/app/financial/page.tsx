"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { financeService } from "../../services/financeService";
import { useChurch } from "../../contexts/ChurchContext";
import { Transaction } from "../../types/finance";
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, Search, 
  Trash2, PlusCircle, Printer, Filter 
} from "lucide-react";

export default function FinancialPage() {
  const router = useRouter();
  const { formatMoney } = useChurch();
  const [churchId, setChurchId] = useState("");
  const [churchName, setChurchName] = useState("Igreja");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all'|'income'|'expense'>('all');
  
  // Modal Novo Lançamento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTrans, setNewTrans] = useState({
    description: "", amount: "", type: "income", date: ""
  });

  useEffect(() => {
    const idSalvo = localStorage.getItem("churchId");
    const nomeIgreja = localStorage.getItem("churchName");
    if (!idSalvo) { router.push("/login"); return; }
    setChurchId(idSalvo);
    if(nomeIgreja) setChurchName(nomeIgreja);
    carregarDados(idSalvo);
  }, [router]);

  const carregarDados = async (id: string) => {
    try {
      const lista = await financeService.listByChurch(id);
      // Ordena por data (mais recente primeiro)
      lista.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(lista);
    } catch (e) { console.error(e); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await financeService.create({
        churchId,
        description: newTrans.description,
        amount: Number(newTrans.amount),
        type: newTrans.type as 'income' | 'expense',
        date: newTrans.date
      });
      setIsModalOpen(false);
      setNewTrans({ description: "", amount: "", type: "income", date: "" });
      carregarDados(churchId);
    } catch (error) { alert("Erro ao salvar."); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if(confirm("Excluir este lançamento?")) {
      await financeService.delete(id);
      carregarDados(churchId);
    }
  };

  // Filtragem
  const filteredTransactions = transactions.filter(t => 
    filterType === 'all' ? true : t.type === filterType
  );

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, c) => acc + Number(c.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, c) => acc + Number(c.amount), 0);
  const balance = totalIncome - totalExpense;

  const printExtract = () => window.print();

  return (
    <div className="min-h-screen bg-gray-50 p-8 print:p-0 print:bg-white">
      
      {/* HEADER TELA */}
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-8 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Financeiro</h1>
          <p className="text-gray-500">Controle de dízimos, ofertas e despesas</p>
        </div>
        <div className="flex gap-2">
            <button onClick={printExtract} className="bg-white border text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Printer size={20}/> <span className="hidden md:inline">Imprimir Extrato</span>
            </button>
            <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
                <PlusCircle size={20} /> Novo Lançamento
            </button>
        </div>
      </div>

      {/* HEADER IMPRESSÃO */}
      <div className="hidden print:block text-center mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold uppercase">{churchName}</h1>
          <p className="text-sm text-gray-500">Extrato Financeiro / Balancete</p>
          <p className="text-xs text-gray-400 mt-1">Gerado em {new Date().toLocaleDateString()}</p>
      </div>

      {/* CARDS RESUMO */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 print:grid-cols-3 print:gap-2">
         <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm print:border print:shadow-none">
            <p className="text-xs text-gray-500 font-bold uppercase">Entradas</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{formatMoney(totalIncome)}</p>
         </div>
         <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm print:border print:shadow-none">
            <p className="text-xs text-gray-500 font-bold uppercase">Saídas</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{formatMoney(totalExpense)}</p>
         </div>
         <div className={`bg-white p-5 rounded-xl border border-gray-100 shadow-sm print:border print:shadow-none ${balance < 0 ? 'border-red-200 bg-red-50' : ''}`}>
            <p className="text-xs text-gray-500 font-bold uppercase">Saldo Atual</p>
            <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>{formatMoney(balance)}</p>
         </div>
      </div>

      {/* FILTROS (Esconde na impressão) */}
      <div className="max-w-5xl mx-auto mb-4 flex gap-2 print:hidden">
         <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filterType === 'all' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600'}`}>Todos</button>
         <button onClick={() => setFilterType('income')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filterType === 'income' ? 'bg-green-600 text-white' : 'bg-white text-gray-600'}`}>Entradas</button>
         <button onClick={() => setFilterType('expense')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filterType === 'expense' ? 'bg-red-600 text-white' : 'bg-white text-gray-600'}`}>Saídas</button>
      </div>

      {/* TABELA */}
      <div className="max-w-5xl mx-auto bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden print:shadow-none print:border-0">
          <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b">
                  <tr>
                      <th className="p-4">Data</th>
                      <th className="p-4">Descrição</th>
                      <th className="p-4">Tipo</th>
                      <th className="p-4 text-right">Valor</th>
                      <th className="p-4 w-10 print:hidden"></th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredTransactions.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50">
                          <td className="p-4 text-gray-500 w-32">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                          <td className="p-4 font-medium text-gray-800">{t.description}</td>
                          <td className="p-4">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} print:bg-transparent print:p-0`}>
                                  {t.type === 'income' ? 'Entrada' : 'Saída'}
                              </span>
                          </td>
                          <td className={`p-4 text-right font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {t.type === 'income' ? '+' : '-'} {formatMoney(t.amount)}
                          </td>
                          <td className="p-4 text-right print:hidden">
                              <button onClick={() => handleDelete(t.id!)} className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>

      {/* MODAL (Mantido) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm print:hidden">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Novo Lançamento</h2>
              <form onSubmit={handleSave} className="space-y-4">
                  <div><label className="text-xs font-bold text-gray-500">Descrição</label><input required type="text" value={newTrans.description} onChange={e => setNewTrans({...newTrans, description: e.target.value})} className="w-full p-3 border rounded-lg"/></div>
                  <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs font-bold text-gray-500">Valor</label><input required type="number" step="0.01" value={newTrans.amount} onChange={e => setNewTrans({...newTrans, amount: e.target.value})} className="w-full p-3 border rounded-lg"/></div>
                      <div><label className="text-xs font-bold text-gray-500">Data</label><input required type="date" value={newTrans.date} onChange={e => setNewTrans({...newTrans, date: e.target.value})} className="w-full p-3 border rounded-lg"/></div>
                  </div>
                  <div>
                      <label className="text-xs font-bold text-gray-500">Tipo</label>
                      <div className="grid grid-cols-2 gap-2">
                          <button type="button" onClick={() => setNewTrans({...newTrans, type: 'income'})} className={`p-3 rounded-lg border font-bold text-sm ${newTrans.type === 'income' ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-200 text-gray-500'}`}>Entrada</button>
                          <button type="button" onClick={() => setNewTrans({...newTrans, type: 'expense'})} className={`p-3 rounded-lg border font-bold text-sm ${newTrans.type === 'expense' ? 'bg-red-50 border-red-500 text-red-700' : 'border-gray-200 text-gray-500'}`}>Saída</button>
                      </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-lg font-bold">Cancelar</button>
                      <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold">{loading ? 'Salvando...' : 'Salvar'}</button>
                  </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}