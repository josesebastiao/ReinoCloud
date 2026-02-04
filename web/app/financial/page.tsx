"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { financeService } from "../../services/financeService";
import { memberService } from "../../services/memberService"; 
import { useChurch } from "../../contexts/ChurchContext";
import { Transaction } from "../../types/finance";
import { Member } from "../../types/member";
import { 
  TrendingUp, TrendingDown, Printer, PlusCircle, Trash2, User, 
  PieChart as PieIcon, Calendar, Filter, X, DollarSign, Loader2, Edit 
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function FinancialPage() {
  const router = useRouter();
  
  // 1. Contexto e Segurança
  const { formatMoney, churchName, logoUrl, userRole, hasPermission, loading: authLoading } = useChurch();
  
  const [churchId, setChurchId] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]); 
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // 2. Trava de Segurança
  useEffect(() => {
    if (!authLoading) {
        if (userRole !== 'admin' && !hasPermission('financial') && userRole !== 'treasurer') {
            router.push('/'); 
        }
    }
  }, [authLoading, userRole, hasPermission, router]);

  // FILTROS
  const [filterType, setFilterType] = useState<'all'|'income'|'expense'>('all');
  
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  
  // MODAL E EDIÇÃO
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // ID do lançamento em edição
  
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

  // 3. Carregar Dados Seguro
  useEffect(() => {
    const idSalvo = localStorage.getItem("churchId");
    if (!idSalvo) {
        if (!authLoading) router.push("/login");
        return; 
    }
    setChurchId(idSalvo);
    carregarDados(idSalvo);
  }, [authLoading, router]);

  const carregarDados = async (id: string) => {
    setDataLoading(true);
    try {
      const [listaFinancas, listaMembros] = await Promise.all([
         financeService.listByChurch(id),
         memberService.listByChurch(id)
      ]);
      listaFinancas.sort((a: any,b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(listaFinancas);
      setMembers(listaMembros);
    } catch (e) { console.error(e); } finally { setDataLoading(false); }
  };

  const filteredTransactions = transactions.filter(t => {
      const matchesType = filterType === 'all' ? true : t.type === filterType;
      const tDate = t.date; 
      const matchesDate = (!startDate || tDate >= startDate) && (!endDate || tDate <= endDate);
      return matchesType && matchesDate;
  });

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, c) => acc + Number(c.amount), 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, c) => acc + Number(c.amount), 0);
  const balance = totalIncome - totalExpense;

  const setFilterPeriod = (period: 'thisMonth' | 'lastMonth' | 'last7' | 'all') => {
      const now = new Date();
      if (period === 'thisMonth') {
          setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
          setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
      } else if (period === 'lastMonth') {
          setStartDate(new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]);
          setEndDate(new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]);
      } else if (period === 'last7') {
          const past = new Date();
          past.setDate(now.getDate() - 7);
          setStartDate(past.toISOString().split('T')[0]);
          setEndDate(now.toISOString().split('T')[0]);
      } else {
          setStartDate("");
          setEndDate("");
      }
  };

  // --- ABRIR MODAL (NOVO OU EDIÇÃO) ---
  const handleOpenModal = (trans?: Transaction) => {
      if (trans) {
          // Modo Edição
          setEditingId(trans.id || null);
          setNewTrans({
              amount: trans.amount.toString(),
              type: trans.type,
              date: trans.date,
              category: trans.category || "Outros",
              memberId: trans.memberId || "",
              description: trans.description || ""
          });
      } else {
          // Modo Novo
          setEditingId(null);
          setNewTrans({ 
            amount: "", type: "income", date: new Date().toISOString().split('T')[0], 
            category: "Dízimo", memberId: "", description: "" 
          });
      }
      setIsModalOpen(true);
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
              
              if (!selectedMember.isTither) {
                  await memberService.update(selectedMember.id!, { isTither: true });
                  setMembers(prev => prev.map(m => m.id === selectedMember.id ? {...m, isTither: true} : m));
              }
          }
      } else if (!finalDesc) {
          finalDesc = newTrans.category; 
      }

      const payload: any = {
        churchId,
        amount: Number(newTrans.amount),
        type: newTrans.type as 'income' | 'expense',
        date: newTrans.date,
        category: newTrans.category,
        description: finalDesc,
        memberId: newTrans.memberId || null,
        memberName: memberName || null
      };

      if (!navigator.onLine) {
         if (editingId) {
             alert("Edição não disponível offline.");
         } else {
             financeService.create(payload);
             alert("Salvo no dispositivo! Será enviado quando a internet voltar.");
         }
         setIsModalOpen(false);
         setLoading(false);
         setTimeout(() => carregarDados(churchId), 500);
         return; 
      }

      if (editingId) {
          await financeService.update(editingId, payload);
      } else {
          await financeService.create(payload);
      }

      setIsModalOpen(false);
      carregarDados(churchId);

    } catch (error) { 
        console.error(error); 
        alert("Erro ao salvar."); 
    } finally { 
        if(navigator.onLine) setLoading(false); 
    }
  };

  const handleDelete = async (id: string) => {
    if(confirm("Excluir este lançamento permanentemente?")) {
      if (!navigator.onLine) {
          financeService.delete(id);
          alert("Exclusão agendada (Offline).");
          setTimeout(() => carregarDados(churchId), 500);
      } else {
          await financeService.delete(id);
          carregarDados(churchId);
      }
    }
  };

  const toDataURL = async (url: string) => {
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    } catch (e) { return ""; }
  };

  const handlePrint = async () => {
      let finalLogo = "";
      if (logoUrl) finalLogo = await toDataURL(logoUrl);

      const printWindow = window.open('', '', 'width=900,height=600');
      if (!printWindow) return;

      const rows = filteredTransactions.map(t => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px;">${new Date(t.date).toLocaleDateString('pt-BR')}</td>
            <td style="padding: 8px;">
                <strong>${t.description}</strong><br/>
                <span style="font-size: 10px; color: #666;">${t.category}</span>
            </td>
            <td style="padding: 8px; text-align: right; color: ${t.type === 'income' ? 'green' : 'red'}; font-weight: bold;">
                ${t.type === 'income' ? '+' : '-'} ${formatMoney(t.amount)}
            </td>
        </tr>
      `).join('');

      const html = `
        <html>
            <head>
                <title>Relatório Financeiro</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
                    .logo { height: 60px; margin-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; font-size: 12px; }
                    th { text-align: left; background: #f9fafb; padding: 8px; }
                    .summary { display: flex; justify-content: space-between; margin-bottom: 20px; gap: 10px; }
                    .card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; flex: 1; text-align: center; }
                </style>
            </head>
            <body>
                <div class="header">
                    ${finalLogo ? `<img src="${finalLogo}" class="logo" />` : ''}
                    <h1 style="margin:0; font-size: 20px; text-transform: uppercase;">${churchName}</h1>
                    <p style="margin:5px 0; font-size: 12px; color: #666;">Relatório Financeiro • ${startDate ? new Date(startDate).toLocaleDateString() : 'Início'} até ${endDate ? new Date(endDate).toLocaleDateString() : 'Hoje'}</p>
                </div>

                <div class="summary">
                    <div class="card" style="background: #f0fdf4; border-color: #bbf7d0;">
                        <span style="font-size: 10px; color: green; font-weight: bold;">ENTRADAS</span><br/>
                        <strong style="font-size: 18px; color: green;">${formatMoney(totalIncome)}</strong>
                    </div>
                    <div class="card" style="background: #fef2f2; border-color: #fecaca;">
                        <span style="font-size: 10px; color: red; font-weight: bold;">SAÍDAS</span><br/>
                        <strong style="font-size: 18px; color: red;">${formatMoney(totalExpense)}</strong>
                    </div>
                    <div class="card" style="background: #f8fafc; border-color: #e2e8f0;">
                        <span style="font-size: 10px; color: #475569; font-weight: bold;">SALDO</span><br/>
                        <strong style="font-size: 18px; color: ${balance >= 0 ? '#333' : 'red'};">${formatMoney(balance)}</strong>
                    </div>
                </div>

                <table>
                    <thead><tr><th>Data</th><th>Descrição</th><th style="text-align: right;">Valor</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
                <script>setTimeout(() => window.print(), 500);</script>
            </body>
        </html>
      `;
      
      printWindow.document.write(html);
      printWindow.document.close();
  };

  const chartData = [
    { name: 'Entradas', value: totalIncome },
    { name: 'Saídas', value: totalExpense },
  ];
  const COLORS = ['#10b981', '#ef4444']; 

  // Loading Inicial
  if (authLoading || (dataLoading && transactions.length === 0)) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><Loader2 className="animate-spin text-blue-600"/></div>;

  if (userRole !== 'admin' && !hasPermission('financial') && userRole !== 'treasurer') return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans print:p-0 print:bg-white">
      
      {/* --- CABEÇALHO AZUL --- */}
      <div className="bg-[#1D4ED8] pt-10 pb-24 px-8 shadow-sm print:hidden">
        <div className="max-w-6xl mx-auto flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  <DollarSign className="text-blue-300"/> Tesouraria
                </h1>
                <p className="text-blue-100 text-lg opacity-90">Controle de dízimos, ofertas e despesas.</p>
            </div>
             <div className="hidden md:flex gap-3">
                <button onClick={handlePrint} className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition">
                    <Printer size={18}/> Imprimir
                </button>
                <button onClick={() => handleOpenModal()} className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg transition">
                    <PlusCircle size={18} /> Novo Lançamento
                </button>
            </div>
        </div>
      </div>
      
      {/* Botões Mobile */}
      <div className="md:hidden px-4 -mt-6 mb-6 flex gap-2 relative z-20 print:hidden">
            <button onClick={() => handleOpenModal()} className="flex-1 bg-white text-blue-600 py-3 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 border border-blue-100">
                <PlusCircle size={20}/> Novo
            </button>
            <button onClick={handlePrint} className="bg-white text-gray-600 px-4 py-3 rounded-xl font-bold shadow-lg flex justify-center items-center border border-gray-100">
                <Printer size={20}/>
            </button>
      </div>

      <div className="hidden print:block text-center mb-8 border-b pb-4 pt-8">
          <h1 className="text-2xl font-bold uppercase">{churchName}</h1>
          <p className="text-sm text-gray-500">Relatório Financeiro ({startDate ? new Date(startDate).toLocaleDateString() : 'Início'} até {endDate ? new Date(endDate).toLocaleDateString() : 'Hoje'})</p>
      </div>

      {/* --- CONTEÚDO FLUTUANTE --- */}
      <div className="max-w-6xl mx-auto px-4 md:px-0 -mt-16 relative z-10 print:mt-0">

          {/* BARRA DE FILTROS DE DATA */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 print:hidden">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 scrollbar-hide">
                      <button onClick={() => setFilterPeriod('thisMonth')} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold border transition ${startDate === firstDay ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>Este Mês</button>
                      <button onClick={() => setFilterPeriod('lastMonth')} className="whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition">Mês Passado</button>
                      <button onClick={() => setFilterPeriod('last7')} className="whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition">7 Dias</button>
                      <button onClick={() => setFilterPeriod('all')} className="whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition">Tudo</button>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                      <div className="relative flex-1">
                          <div className="absolute left-2 top-2 text-gray-400"><Calendar size={14}/></div>
                          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="pl-7 pr-2 py-1.5 text-xs font-bold border rounded-lg w-full bg-gray-50 outline-none focus:ring-2 ring-blue-100"/>
                      </div>
                      <span className="text-gray-400 text-xs font-medium">até</span>
                      <div className="relative flex-1">
                          <div className="absolute left-2 top-2 text-gray-400"><Calendar size={14}/></div>
                          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="pl-7 pr-2 py-1.5 text-xs font-bold border rounded-lg w-full bg-gray-50 outline-none focus:ring-2 ring-blue-100"/>
                      </div>
                  </div>
              </div>
          </div>

          {/* CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 print:grid-cols-3 print:gap-2">
             <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xl shadow-blue-900/5 flex flex-col justify-between min-h-[100px]">
                <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1 tracking-wider"><TrendingUp size={14} className="text-green-500"/> Entradas ({filteredTransactions.filter(t => t.type === 'income').length})</p>
                <p className="text-2xl font-black text-green-600 mt-1">{formatMoney(totalIncome)}</p>
             </div>
             <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xl shadow-blue-900/5 flex flex-col justify-between min-h-[100px]">
                <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1 tracking-wider"><TrendingDown size={14} className="text-red-500"/> Saídas ({filteredTransactions.filter(t => t.type === 'expense').length})</p>
                <p className="text-2xl font-black text-red-600 mt-1">{formatMoney(totalExpense)}</p>
             </div>
             <div className={`bg-white p-5 rounded-3xl border border-gray-100 shadow-xl shadow-blue-900/5 flex flex-col justify-between min-h-[100px] ${balance < 0 ? 'bg-red-50 border-red-100' : ''}`}>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Saldo do Período</p>
                <p className={`text-2xl font-black mt-1 ${balance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>{formatMoney(balance)}</p>
             </div>
          </div>

          {/* GRÁFICO ESTILO ROSQUINHA (DONUT) */}
          {(totalIncome > 0 || totalExpense > 0) && (
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 mb-6 flex flex-col md:flex-row items-center justify-around print:hidden animate-in fade-in zoom-in-95">
                <div className="text-center md:text-left mb-4 md:mb-0">
                    <h3 className="text-lg font-bold text-gray-700 flex items-center justify-center md:justify-start gap-2">
                        <PieIcon size={20} className="text-blue-500"/> Visão do Período
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Proporção de Entradas vs Saídas</p>
                </div>
                
                {/* ÁREA DO GRÁFICO COM OVERLAY */}
                <div className="w-full h-48 md:h-40 md:w-64 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            {/* Aumentei os raios para caber o texto no meio */}
                            <Pie data={chartData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                            </Pie>
                            <Tooltip formatter={(value: any) => formatMoney(Number(value))} contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                        </PieChart>
                    </ResponsiveContainer>
                    
                    {/* TEXTO FLUTUANTE NO CENTRO DO DONUT */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                        <span className="text-[9px] text-gray-400 font-bold uppercase">Saldo</span>
                        <span className={`text-xs font-black ${balance >= 0 ? 'text-gray-700' : 'text-red-600'}`}>
                            {formatMoney(balance)}
                        </span>
                    </div>
                </div>
            </div>
          )}

          {/* EXTRATO */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-blue-900/5 overflow-hidden p-6 print:shadow-none print:border-0">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                     <Filter size={14}/> Extrato Detalhado
                 </h3>
                 <div className="flex bg-gray-100 rounded-lg p-1 print:hidden">
                     <button onClick={() => setFilterType('all')} className={`px-3 py-1 rounded-md text-[10px] font-bold transition ${filterType === 'all' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>Tudo</button>
                     <button onClick={() => setFilterType('income')} className={`px-3 py-1 rounded-md text-[10px] font-bold transition ${filterType === 'income' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`}>Ent</button>
                     <button onClick={() => setFilterType('expense')} className={`px-3 py-1 rounded-md text-[10px] font-bold transition ${filterType === 'expense' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500'}`}>Sai</button>
                 </div>
              </div>
              
              <div className="relative border-l-2 border-gray-100 ml-3 space-y-8 pb-4">
                  {filteredTransactions.length > 0 ? filteredTransactions.map((t, index) => (
                      <div key={t.id} className="relative pl-8 animate-in slide-in-from-bottom-2 fade-in duration-300" style={{animationDelay: `${Math.min(index * 50, 500)}ms`}}>
                          <div className={`
                              absolute -left-[9px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-sm ring-1 ring-gray-100
                              ${t.type === 'income' ? 'bg-green-500' : 'bg-red-500'}
                          `}></div>

                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-4 rounded-2xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100 group">
                              <div>
                                  <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 tracking-wider">
                                      {new Date(t.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                                  </span>
                                  <p className="font-bold text-gray-800 text-base mt-0.5">{t.description}</p>
                                  {t.category && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 mt-1 border border-gray-200">
                                          {t.category} {t.memberName ? `• ${t.memberName}` : ''}
                                      </span>
                                  )}
                              </div>

                              <div className="flex items-center justify-between md:justify-end gap-3 mt-2 md:mt-0">
                                  <span className={`text-lg font-black ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                      {t.type === 'income' ? '+' : '-'} {formatMoney(t.amount)}
                                  </span>
                                  
                                  <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
                                      <button onClick={() => handleOpenModal(t)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg print:hidden">
                                          <Edit size={16}/>
                                      </button>
                                      <button onClick={() => handleDelete(t.id!)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg print:hidden">
                                          <Trash2 size={16}/>
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )) : (
                    <div className="pl-8 py-8 text-center text-gray-400">
                        <p className="italic">Nenhum lançamento encontrado neste período.</p>
                        <button onClick={() => setFilterPeriod('all')} className="mt-2 text-blue-600 font-bold text-sm hover:underline">Limpar filtros</button>
                    </div>
                  )}
              </div>
          </div>
      </div>

      {/* --- MODAL NOVO/EDITAR LANÇAMENTO --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm print:hidden animate-in fade-in">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Editar Lançamento' : 'Novo Lançamento'}</h2>
                  <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition"><X size={18} className="text-gray-500"/></button>
              </div>
              
              <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
                      <button type="button" onClick={() => setNewTrans({...newTrans, type: 'income', category: 'Dízimo'})} className={`py-2 rounded-lg text-sm font-bold transition ${newTrans.type === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Entrada</button>
                      <button type="button" onClick={() => setNewTrans({...newTrans, type: 'expense', category: 'Outros'})} className={`py-2 rounded-lg text-sm font-bold transition ${newTrans.type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Saída</button>
                  </div>
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Categoria</label>
                      <select value={newTrans.category} onChange={e => setNewTrans({...newTrans, category: e.target.value})} className="w-full p-3 border rounded-xl bg-white mt-1 outline-none focus:ring-2 ring-blue-100">
                          {newTrans.type === 'income' ? INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>) : EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                  </div>
                  {newTrans.type === 'income' && newTrans.category === 'Dízimo' && (
                      <div className="animate-in fade-in slide-in-from-top-2">
                          <label className="text-xs font-bold text-blue-600 uppercase flex items-center gap-1 ml-1"><User size={12}/> Selecione o Irmão(ã)</label>
                          <select value={newTrans.memberId} onChange={e => setNewTrans({...newTrans, memberId: e.target.value})} className="w-full p-3 border border-blue-200 rounded-xl bg-blue-50 mt-1 outline-none focus:ring-2 ring-blue-100" required={!editingId}>
                              <option value="">-- Selecione na lista --</option>
                              {members.map(m => (<option key={m.id} value={m.id}>{m.fullName}</option>))}
                          </select>
                      </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Valor</label>
                          <input required type="number" step="0.01" value={newTrans.amount} onChange={e => setNewTrans({...newTrans, amount: e.target.value})} className="w-full p-3 border rounded-xl mt-1 text-lg font-bold outline-none focus:ring-2 ring-blue-100" placeholder="0,00"/>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Data</label>
                          <input required type="date" value={newTrans.date} onChange={e => setNewTrans({...newTrans, date: e.target.value})} className="w-full p-3 border rounded-xl mt-1 outline-none focus:ring-2 ring-blue-100"/>
                      </div>
                  </div>
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Observação</label>
                      <input type="text" value={newTrans.description} onChange={e => setNewTrans({...newTrans, description: e.target.value})} className="w-full p-3 border rounded-xl mt-1 outline-none focus:ring-2 ring-blue-100" placeholder="Detalhes opcionais..."/>
                  </div>
                  <div className="flex gap-3 mt-6 pt-2">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition">Cancelar</button>
                      <button type="submit" disabled={loading} className={`flex-1 py-3 text-white rounded-xl font-bold shadow-lg transition ${newTrans.type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>{loading ? 'Salvando...' : 'Confirmar'}</button>
                  </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}