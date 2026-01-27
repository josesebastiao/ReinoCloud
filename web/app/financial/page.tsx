"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { financeService } from "../../services/financeService";
import { memberService } from "../../services/memberService"; 
import { useChurch } from "../../contexts/ChurchContext";
import { Transaction } from "../../types/finance";
import { Member } from "../../types/member";
import { 
  TrendingUp, TrendingDown, Printer, PlusCircle, Trash2, User, PieChart as PieIcon 
} from "lucide-react";

// Importando a biblioteca de Gráficos
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

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

      if (newTrans.type === 'income' && newTrans.category === "Dízimo" && newTrans.memberId) {
          const selectedMember = members.find(m => m.id === newTrans.memberId);
          if (selectedMember) {
              memberName = selectedMember.fullName;
              if (!finalDesc) finalDesc = `Dízimo - ${selectedMember.fullName}`;
          }
      } else if (!finalDesc) {
          finalDesc = newTrans.category; 
      }

      await financeService.create({
        churchId,
        amount: Number(newTrans.amount),
        type: newTrans.type as 'income' | 'expense',
        date: newTrans.date,
        category: newTrans.category,
        description: finalDesc,
        memberId: newTrans.memberId || null,
        memberName: memberName || null
      });

      setIsModalOpen(false);
      setNewTrans({ 
          amount: "", type: "income", date: new Date().toISOString().split('T')[0], 
          category: "Dízimo", memberId: "", description: "" 
      });
      carregarDados(churchId);
    } catch (error) { console.error(error); alert("Erro ao salvar."); } finally { setLoading(false); }
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

  // DADOS DO GRÁFICO
  const chartData = [
    { name: 'Entradas', value: totalIncome },
    { name: 'Saídas', value: totalExpense },
  ];
  const COLORS = ['#16a34a', '#dc2626']; // Verde e Vermelho

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 print:p-0 print:bg-white pb-24">
      
      {/* HEADER CORRIGIDO (Mobile: Coluna / Desktop: Linha) */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Financeiro</h1>
          <p className="text-sm text-gray-500">Gestão de Dízimos e Despesas</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button onClick={printExtract} className="flex-1 md:flex-none justify-center bg-white border text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 flex items-center gap-2 text-sm font-bold shadow-sm">
                <Printer size={18}/> <span className="hidden md:inline">Imprimir</span>
            </button>
            <button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg text-sm font-bold">
                <PlusCircle size={18} /> Novo <span className="hidden md:inline">Lançamento</span>
            </button>
        </div>
      </div>

      <div className="hidden print:block text-center mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold uppercase">{churchName}</h1>
          <p className="text-sm text-gray-500">Relatório Financeiro</p>
          <p className="text-xs text-gray-400 mt-1">Gerado em {new Date().toLocaleDateString()}</p>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 print:grid-cols-3 print:gap-2">
         <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1"><TrendingUp size={12}/> Entradas</p>
            <p className="text-xl font-bold text-green-600 mt-1">{formatMoney(totalIncome)}</p>
         </div>
         <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1"><TrendingDown size={12}/> Saídas</p>
            <p className="text-xl font-bold text-red-600 mt-1">{formatMoney(totalExpense)}</p>
         </div>
         <div className={`bg-white p-4 rounded-2xl border border-gray-100 shadow-sm ${balance < 0 ? 'border-red-200 bg-red-50' : ''}`}>
            <p className="text-[10px] text-gray-500 font-bold uppercase">Saldo Atual</p>
            <p className={`text-xl font-bold mt-1 ${balance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>{formatMoney(balance)}</p>
         </div>
      </div>

      {/* ÁREA DO GRÁFICO (Só aparece se tiver dados) */}
      {(totalIncome > 0 || totalExpense > 0) && (
        <div className="max-w-5xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row items-center justify-around print:hidden">
            <div className="text-center md:text-left mb-4 md:mb-0">
                <h3 className="text-lg font-bold text-gray-700 flex items-center justify-center md:justify-start gap-2">
                    <PieIcon size={20} className="text-blue-500"/> Visão Geral
                </h3>
                <p className="text-xs text-gray-400">Proporção de Entradas vs Saídas</p>
            </div>
            
            <div className="w-full h-48 md:h-40 md:w-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                            formatter={(value: number) => formatMoney(value)}
                            contentStyle={{backgroundColor: '#fff', borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      )}

      {/* FILTROS */}
      <div className="max-w-5xl mx-auto mb-4 flex gap-2 print:hidden overflow-x-auto pb-2">
         <button onClick={() => setFilterType('all')} className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition ${filterType === 'all' ? 'bg-gray-800 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200'}`}>Todos</button>
         <button onClick={() => setFilterType('income')} className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition ${filterType === 'income' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'bg-white text-gray-500 border border-gray-200'}`}>Entradas</button>
         <button onClick={() => setFilterType('expense')} className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition ${filterType === 'expense' ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-white text-gray-500 border border-gray-200'}`}>Saídas</button>
      </div>

      {/* TABELA */}
      <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden print:shadow-none print:border-0">
          <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold border-b tracking-wider">
                  <tr>
                      <th className="p-4">Dia</th>
                      <th className="p-4">Descrição</th>
                      <th className="p-4 text-right">Valor</th>
                      <th className="p-4 w-8 print:hidden"></th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                  {filteredTransactions.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50 transition">
                          <td className="p-4 text-gray-500 w-16 text-xs">
                              <div className="font-bold text-gray-700">{t.date.split('-')[2]}</div>
                              <div className="text-[10px] uppercase">{new Date(t.date).toLocaleDateString('pt-BR', {month:'short'}).slice(0,3)}</div>
                          </td>
                          <td className="p-4 font-medium text-gray-800">
                              <p className="line-clamp-1">{t.description}</p>
                              {t.category && <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase font-bold tracking-wide">{t.category}</span>}
                          </td>
                          <td className={`p-4 text-right font-bold whitespace-nowrap ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {t.type === 'income' ? '+' : '-'} {formatMoney(t.amount)}
                          </td>
                          <td className="p-4 text-right print:hidden">
                              <button onClick={() => handleDelete(t.id!)} className="text-gray-300 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>

      {/* MODAL (Mantido igual) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm print:hidden">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Novo Lançamento</h2>
              <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
                      <button type="button" onClick={() => setNewTrans({...newTrans, type: 'income', category: 'Dízimo'})} className={`py-2 rounded-lg text-sm font-bold transition ${newTrans.type === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Entrada</button>
                      <button type="button" onClick={() => setNewTrans({...newTrans, type: 'expense', category: 'Outros'})} className={`py-2 rounded-lg text-sm font-bold transition ${newTrans.type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Saída</button>
                  </div>
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Fonte / Categoria</label>
                      <select value={newTrans.category} onChange={e => setNewTrans({...newTrans, category: e.target.value})} className="w-full p-3 border rounded-xl bg-white mt-1">
                          {newTrans.type === 'income' ? INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>) : EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                  </div>
                  {newTrans.type === 'income' && newTrans.category === 'Dízimo' && (
                      <div className="animate-in fade-in slide-in-from-top-2">
                          <label className="text-xs font-bold text-blue-600 uppercase flex items-center gap-1"><User size={12}/> Selecione o Irmão(ã)</label>
                          <select value={newTrans.memberId} onChange={e => setNewTrans({...newTrans, memberId: e.target.value})} className="w-full p-3 border border-blue-200 rounded-xl bg-blue-50 mt-1" required>
                              <option value="">-- Selecione na lista --</option>
                              {members.map(m => (<option key={m.id} value={m.id}>{m.fullName}</option>))}
                          </select>
                      </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs font-bold text-gray-500 uppercase">Valor</label><input required type="number" step="0.01" value={newTrans.amount} onChange={e => setNewTrans({...newTrans, amount: e.target.value})} className="w-full p-3 border rounded-xl mt-1 text-lg font-bold" placeholder="0,00"/></div>
                      <div><label className="text-xs font-bold text-gray-500 uppercase">Data</label><input required type="date" value={newTrans.date} onChange={e => setNewTrans({...newTrans, date: e.target.value})} className="w-full p-3 border rounded-xl mt-1"/></div>
                  </div>
                  <div><label className="text-xs font-bold text-gray-500 uppercase">Observação</label><input type="text" value={newTrans.description} onChange={e => setNewTrans({...newTrans, description: e.target.value})} className="w-full p-3 border rounded-xl mt-1" placeholder="Detalhes opcionais..."/></div>
                  <div className="flex gap-2 mt-4 pt-2">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200">Cancelar</button>
                      <button type="submit" disabled={loading} className={`flex-1 py-3 text-white rounded-xl font-bold shadow-lg ${newTrans.type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>{loading ? 'Salvando...' : 'Confirmar'}</button>
                  </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}