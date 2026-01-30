"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // <--- Importante
import { useChurch } from "../../contexts/ChurchContext";
import { memberService, Member } from "../../services/memberService";
import { 
  Users, BarChart3, Cake, HandCoins, HeartHandshake, AlertCircle, Sparkles, 
  PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, Loader2
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function ReportsPage() {
  const router = useRouter();
  const { churchId } = useChurch();
  const [loading, setLoading] = useState(true);
  
  // Estados numéricos
  const [totalMembers, setTotalMembers] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [tithersCount, setTithersCount] = useState(0);
  const [genderStats, setGenderStats] = useState({ male: 0, female: 0 });
  
  // Listas
  const [birthdays, setBirthdays] = useState<Member[]>([]);
  const [needsVisit, setNeedsVisit] = useState<Member[]>([]); 
  const [ageData, setAgeData] = useState<any[]>([]);

  useEffect(() => {
    // --- LÓGICA DE PROTEÇÃO (ANTI-LOOP) ---
    let isMounted = true;
    
    const checkAndLoad = async () => {
        if (churchId) {
            await calculateStats();
            return;
        }
        
        // Verifica backup
        const storedId = localStorage.getItem("churchId");
        if (!storedId) {
            router.push("/login");
        } else {
            if (isMounted) setLoading(true); // Aguarda contexto carregar
        }
    };

    const timer = setTimeout(checkAndLoad, 500);
    return () => { isMounted = false; clearTimeout(timer); };
  }, [churchId, router]);

  const getAge = (dateString: string) => {
    if (!dateString) return 0;
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const calculateStats = async () => {
    try {
        const members = await memberService.listByChurch(churchId);
        setTotalMembers(members.length);

        const activeMembers = members.filter(m => m.status === 'active');
        setActiveCount(activeMembers.length);
        setTithersCount(members.filter(m => m.isTither === true).length);

        const males = members.filter(m => m.gender === 'male').length;
        const females = members.filter(m => m.gender === 'female').length;
        setGenderStats({ male: males, female: females });

        // Gráfico Idade
        let k = 0, y = 0, a = 0, s = 0;
        activeMembers.forEach(m => {
            const age = getAge(m.birthDate || ""); 
            if (age >= 0) { 
                if (age < 12) k++; else if (age < 18) y++; else if (age < 60) a++; else s++;
            }
        });
        
        const chartData = [
            { name: 'Crianças', value: k, color: '#60A5FA' },
            { name: 'Jovens', value: y, color: '#A78BFA' },
            { name: 'Adultos', value: a, color: '#34D399' },
            { name: 'Idosos', value: s, color: '#FBBF24' },
        ].filter(d => d.value > 0);
        
        setAgeData(chartData);

        // Aniversariantes
        const currentMonth = new Date().getMonth();
        const bdays = members.filter(m => {
            if(!m.birthDate) return false;
            const parts = m.birthDate.split('-');
            const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            return d.getMonth() === currentMonth;
        }).sort((a, b) => {
            const dayA = parseInt(a.birthDate!.split('-')[2]);
            const dayB = parseInt(b.birthDate!.split('-')[2]);
            return dayA - dayB;
        });
        setBirthdays(bdays);

        // Pastoral
        const visitList = activeMembers.sort(() => 0.5 - Math.random()).slice(0, 3);
        setNeedsVisit(visitList);

    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const currentMonthName = new Date().toLocaleString('pt-BR', { month: 'long' });

  if (loading) return <div className="flex justify-center p-10 min-h-screen items-center bg-gray-50"><Loader2 className="animate-spin text-blue-600"/></div>;

  // ... (RESTANTE DO CÓDIGO VISUAL MANTIDO IGUAL AO ANTERIOR) ...
  // Vou manter o retorno visual exatamente como estava, só alterei o início (useEffect)
  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <div className="bg-[#1D4ED8] pt-10 pb-24 px-8 shadow-sm">
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3"><BarChart3 className="text-blue-300"/> Relatórios & Estatísticas</h1>
            <p className="text-blue-100 text-lg opacity-90">Visão estratégica do rebanho.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-0 -mt-16 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-5 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex items-center gap-4"><div className="p-3 bg-blue-50 text-blue-600 rounded-full"><Users size={24}/></div><div><p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Membros</p><h3 className="text-2xl font-black text-gray-800">{totalMembers}</h3></div></div>
              <div className="bg-white p-5 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex items-center gap-4"><div className="p-3 bg-green-50 text-green-600 rounded-full"><HandCoins size={24}/></div><div><p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Dizimistas</p><h3 className="text-2xl font-black text-gray-800">{tithersCount}</h3></div></div>
              <div className="bg-white p-5 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex items-center gap-4"><div className="p-3 bg-indigo-50 text-indigo-600 rounded-full"><ArrowUpRight size={24}/></div><div><p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Homens</p><h3 className="text-2xl font-black text-gray-800">{genderStats.male}</h3></div></div>
              <div className="bg-white p-5 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex items-center gap-4"><div className="p-3 bg-pink-50 text-pink-600 rounded-full"><ArrowDownRight size={24}/></div><div><p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Mulheres</p><h3 className="text-2xl font-black text-gray-800">{genderStats.female}</h3></div></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col h-[420px]">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-50"><h3 className="font-bold text-gray-800 flex items-center gap-2"><Cake className="text-pink-500" size={20}/> Aniversariantes</h3><span className="text-xs font-bold bg-pink-50 text-pink-600 px-2 py-1 rounded-lg capitalize">{currentMonthName}</span></div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                      {birthdays.length > 0 ? birthdays.map(m => {
                          const day = m.birthDate ? m.birthDate.split('-')[2] : '??';
                          const isToday = parseInt(day) === new Date().getDate();
                          return (<div key={m.id} className={`flex items-center gap-3 p-3 rounded-xl transition ${isToday ? 'bg-pink-50 border border-pink-100' : 'hover:bg-gray-50 border border-transparent'}`}><div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isToday ? 'bg-pink-500 text-white shadow-lg shadow-pink-200' : 'bg-gray-100 text-gray-500'}`}>{day}</div><div className="flex-1 min-w-0"><p className={`font-bold text-sm truncate ${isToday ? 'text-pink-700' : 'text-gray-700'}`}>{m.fullName}</p><p className="text-[10px] text-gray-400 uppercase">{m.role === 'admin' ? 'Pastor' : 'Membro'}</p></div>{isToday && <Sparkles size={16} className="text-pink-500 animate-pulse"/>}</div>)
                      }) : (<div className="text-center py-10 text-gray-400 flex flex-col items-center"><Cake size={40} className="mb-2 opacity-20"/><p className="text-sm">Nenhum aniversariante.</p></div>)}
                  </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col h-[420px]">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-50"><h3 className="font-bold text-gray-800 flex items-center gap-2"><HeartHandshake className="text-blue-500" size={20}/> Visitas Pastorais</h3></div>
                  <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100"><div className="flex justify-between text-xs font-bold text-blue-700 mb-2"><span>Meta Semanal</span><span>2/5 Visitas</span></div><div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden"><div className="bg-blue-600 h-2 rounded-full w-[40%] transition-all duration-1000"></div></div></div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1"><AlertCircle size={12}/> Sugestão de Visita (Aleatório)</h4>
                  <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                      {needsVisit.map(m => (<div key={m.id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:shadow-sm transition"><div><p className="font-bold text-sm text-gray-700 truncate max-w-[120px]">{m.fullName}</p><p className="text-[10px] text-gray-400">Status: {m.status === 'active' ? 'Ativo' : 'Inativo'}</p></div><button className="text-[10px] bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-bold hover:text-blue-600 hover:border-blue-200 transition">Ver Ficha</button></div>))}
                  </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col h-[420px]">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-50"><h3 className="font-bold text-gray-800 flex items-center gap-2"><PieChartIcon className="text-violet-500" size={20}/> Faixa Etária</h3></div>
                  <div className="flex-1 flex flex-col items-center justify-center relative min-h-[200px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={ageData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{ageData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} itemStyle={{color: '#374151', fontSize: '12px', fontWeight: 'bold'}}/></PieChart></ResponsiveContainer><div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-3xl font-black text-gray-800">{totalMembers}</span><span className="text-[10px] font-bold text-gray-400 uppercase">Membros</span></div></div>
                  <div className="grid grid-cols-2 gap-3 mt-4">{ageData.map((d, i) => (<div key={i} className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded-lg"><div className="w-2 h-2 rounded-full shrink-0" style={{background: d.color}}></div><span className="text-gray-500 font-medium truncate">{d.name}</span><strong className="text-gray-800 ml-auto">{d.value}</strong></div>))}</div>
              </div>
          </div>
      </div>
    </div>
  );
}