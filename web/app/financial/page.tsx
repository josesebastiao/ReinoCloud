"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { financeService } from "../../services/financeService";
import { memberService } from "../../services/memberService"; 
import { useChurch } from "../../contexts/ChurchContext";
import { Transaction } from "../../types/finance";
import { Member } from "../../types/member";
import { 
  TrendingUp, TrendingDown, Printer, PlusCircle, Trash2, User 
} from "lucide-react";

export default function FinancialPage() {
  const router = useRouter();
  const { formatMoney } = useChurch();
  const [churchId, setChurchId] = useState("");
  const [churchName, setChurchName] = useState("Igreja");
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]); 
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all'|'income'|'expense'>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado do Formulário
  const [newTrans, setNewTrans] = useState({
    amount: "", 
    type: "income", 
    date: new Date().toISOString().split('T')[0],
    category: "Dízimo",
    memberId: "",
    description: "" 
  });

  const INCOME_CATEGORIES = ["Dízimo", "Oferta de Culto", "Oferta Especial", "Voto", "Bazar", "Cantina", "Doação Externa", "Outros"];
  const EXPENSE_CATEGORIES = ["Aluguel", "Energia", "Água", "Internet", "Manutenção", "Material de Limpeza", "Ajuda Social", "Salário Pastoral", "Equipamentos", "Outros"];

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
      const [listaFinancas, listaMembros] = await Promise.all([
         financeService.listByChurch(id),
         memberService.listByChurch(id)
      ]);
      listaFinancas.sort((a: any,b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(listaFinancas);
      setMembers(listaMembros);
    } catch (e) { console.error(e); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalDesc = newTrans.description;
      let memberName = "";

      // Se for Dízimo, pega o nome do membro
      if (newTrans.type === 'income' && newTrans.category === "Dízimo" && newTrans.memberId) {
          const selectedMember = members.find(m => m.id === newTrans.memberId);
          if (selectedMember) {
              memberName = selectedMember.fullName;
              if (!finalDesc) finalDesc = `Dízimo - ${selectedMember.fullName}`;
          }
      } else if (!finalDesc) {
          finalDesc = newTrans.category; 
      }

      // CORREÇÃO AQUI: Trocamos undefined por null
      await financeService.create({
        churchId,
        amount: Number(newTrans.amount),
        type: newTrans.type as 'income' | 'expense',
        date: newTrans.date,
        category: newTrans.category,
        description: finalDesc,
        memberId: newTrans.memberId || null,   // <--- AGORA É NULL (O BANCO ACEITA)
        memberName: memberName || null         // <--- AGORA É NULL
      });

      setIsModalOpen(false);
      setNewTrans({ 
          amount: "", type: "income", date: new Date().toISOString().split('T')[0], 
          category: "Dízimo", memberId: "", description: "" 
      });
      carregarDados(churchId);
    } catch (error) { 
        console.error(error); // Ajuda a ver o erro real no F12
        alert("Erro ao salvar. Verifique os dados."); 
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if(confirm("Excluir este lançamento?")) {
      await financeService.delete(id);
      carregarDados(churchId);
    }
  };

  const filteredTransactions = transactions.filter(t => filterType === 'all' ? true : t.type === filterType);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, c) => acc + Number(c.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, c) => acc + Number(c.amount), 0);
  const balance = totalIncome - totalExpense;
  const printExtract = () => window.print();

  return (
    <div className="min-h-screen bg-gray-50 p-8 print:p-0 print:bg-white">
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-8 print:hidden">
        <div><h1 className="text-2xl font-bold text-gray-800">Financeiro Detalhado</h1><p className="text-gray-500">Gestão de Dízimos, Ofertas e Despesas</p></div>
        <div className="flex gap-2">
            <button onClick={printExtract} className="bg-white border text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2"><Printer size={20}/> <span className="hidden md:inline">Imprimir Extrato</span></button>
            <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg"><PlusCircle size={20} /> Novo Lançamento</button>
        </div>
      </div>

      <div className="hidden print:block text-center mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold uppercase">{churchName}</h1>
          <p className="text-sm text-gray-500">Relatório Financeiro</p>
          <p className="text-xs text-gray-400 mt-1">Gerado em {new Date().toLocaleDateString()}</p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 print:grid-cols-3 print:gap-2">
         <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm print:border print:shadow-none"><p className="text-xs text-gray-500 font-bold uppercase flex items-center gap-1"><TrendingUp size={14}/> Entradas</p><p className="text-2xl font-bold text-green-600 mt-1">{formatMoney(totalIncome)}</p></div>
         <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm print:border print:shadow-none"><p className="text-xs text-gray-500 font-bold uppercase flex items-center gap-1"><TrendingDown size={14}/> Saídas</p><p className="text-2xl font-bold text-red-600 mt-1">{formatMoney(totalExpense)}</p></div>
         <div className={`bg-white p-5 rounded-xl border border-gray-100 shadow-sm print:border print:shadow-none ${balance < 0 ? 'border-red-200 bg-red-50' : ''}`}><p className="text-xs text-gray-500 font-bold uppercase">Saldo Atual</p><p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>{formatMoney(balance)}</p></div>
      </div>

      <div className="max-w-5xl mx-auto mb-4 flex gap-2 print:hidden">
         <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filterType === 'all' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600'}`}>Todos</button>
         <button onClick={() => setFilterType('income')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filterType === 'income' ? 'bg-green-600 text-white' : 'bg-white text-gray-600'}`}>Entradas</button>
         <button onClick={() => setFilterType('expense')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filterType === 'expense' ? 'bg-red-600 text-white' : 'bg-white text-gray-600'}`}>Saídas</button>
      </div>

      <div className="max-w-5xl mx-auto bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden print:shadow-none print:border-0">
          <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b">
                  <tr>
                      <th className="p-4">Data</th>
                      <th className="p-4">Descrição / Membro</th>
                      <th className="p-4">Categoria</th>
                      <th className="p-4 text-right">Valor</th>
                      <th className="p-4 w-10 print:hidden"></th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredTransactions.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50">
                          <td className="p-4 text-gray-500 w-32">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                          <td className="p-4 font-medium text-gray-800"><p>{t.description}</p>{t.category === 'Dízimo' && t.memberName && (<span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><User size={10}/> {t.memberName}</span>)}</td>
                          <td className="p-4"><span className={`text-[10px] font-bold px-2 py-1 rounded uppercase border ${t.type === 'income' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'} print:border-0 print:p-0`}>{t.category || (t.type === 'income' ? 'Entrada' : 'Saída')}</span></td>
                          <td className={`p-4 text-right font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'} {formatMoney(t.amount)}</td>
                          <td className="p-4 text-right print:hidden"><button onClick={() => handleDelete(t.id!)} className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button></td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm print:hidden">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Novo Lançamento</h2>
              <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg">
                      <button type="button" onClick={() => setNewTrans({...newTrans, type: 'income', category: 'Dízimo'})} className={`py-2 rounded-md text-sm font-bold transition ${newTrans.type === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Entrada</button>
                      <button type="button" onClick={() => setNewTrans({...newTrans, type: 'expense', category: 'Outros'})} className={`py-2 rounded-md text-sm font-bold transition ${newTrans.type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Saída</button>
                  </div>
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Fonte / Categoria</label>
                      <select value={newTrans.category} onChange={e => setNewTrans({...newTrans, category: e.target.value})} className="w-full p-3 border rounded-lg bg-white mt-1">
                          {newTrans.type === 'income' ? INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>) : EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                  </div>
                  {newTrans.type === 'income' && newTrans.category === 'Dízimo' && (
                      <div className="animate-in fade-in slide-in-from-top-2">
                          <label className="text-xs font-bold text-blue-600 uppercase flex items-center gap-1"><User size={12}/> Selecione o Irmão(ã)</label>
                          <select value={newTrans.memberId} onChange={e => setNewTrans({...newTrans, memberId: e.target.value})} className="w-full p-3 border border-blue-200 rounded-lg bg-blue-50 mt-1" required>
                              <option value="">-- Selecione na lista --</option>
                              {members.map(m => (<option key={m.id} value={m.id}>{m.fullName}</option>))}
                          </select>
                      </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs font-bold text-gray-500 uppercase">Valor</label><input required type="number" step="0.01" value={newTrans.amount} onChange={e => setNewTrans({...newTrans, amount: e.target.value})} className="w-full p-3 border rounded-lg mt-1 text-lg font-bold" placeholder="0,00"/></div>
                      <div><label className="text-xs font-bold text-gray-500 uppercase">Data</label><input required type="date" value={newTrans.date} onChange={e => setNewTrans({...newTrans, date: e.target.value})} className="w-full p-3 border rounded-lg mt-1"/></div>
                  </div>
                  <div><label className="text-xs font-bold text-gray-500 uppercase">Observação (Opcional)</label><input type="text" value={newTrans.description} onChange={e => setNewTrans({...newTrans, description: e.target.value})} className="w-full p-3 border rounded-lg mt-1" placeholder="Detalhes adicionais..."/></div>
                  <div className="flex gap-2 mt-4 pt-2">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200">Cancelar</button>
                      <button type="submit" disabled={loading} className={`flex-1 py-3 text-white rounded-lg font-bold shadow-lg ${newTrans.type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>{loading ? 'Salvando...' : 'Confirmar'}</button>
                  </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}