"use client";
import { useState, useEffect } from "react";
import { useChurch } from "../../contexts/ChurchContext";
import { memberService } from "../../services/memberService";
import { 
  PieChart, Users, TrendingUp, Calendar, 
  ArrowUpRight, ArrowDownRight, Loader2, BarChart3,
  Baby, Smile, User, UserCheck, HandCoins 
} from "lucide-react";

export default function ReportsPage() {
  const { churchId } = useChurch();
  const [loading, setLoading] = useState(true);
  
  // Estados numéricos
  const [totalMembers, setTotalMembers] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [tithersCount, setTithersCount] = useState(0);
  const [genderStats, setGenderStats] = useState({ male: 0, female: 0 });
  const [demographics, setDemographics] = useState({ kids: 0, youth: 0, adults: 0, seniors: 0 });

  useEffect(() => {
    if (churchId) calculateStats();
  }, [churchId]);

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

        // Conta Dizimistas
        const tithers = members.filter(m => m.isTither === true).length;
        setTithersCount(tithers);

        const males = members.filter(m => m.gender === 'male').length;
        const females = members.filter(m => m.gender === 'female').length;
        setGenderStats({ male: males, female: females });

        let k = 0, y = 0, a = 0, s = 0;
        activeMembers.forEach(m => {
            const age = getAge(m.birthDate || ""); 
            if (age >= 0) { 
                if (age < 12) k++;
                else if (age < 18) y++;
                else if (age < 60) a++;
                else s++;
            }
        });

        setDemographics({ kids: k, youth: y, adults: a, seniors: s });
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const totalDemo = demographics.kids + demographics.youth + demographics.adults + demographics.seniors || 1;
  const pKids = (demographics.kids / totalDemo) * 100;
  const pYouth = (demographics.youth / totalDemo) * 100;
  const pAdults = (demographics.adults / totalDemo) * 100;
  const pSeniors = (demographics.seniors / totalDemo) * 100;

  const chartGradient = `conic-gradient(
    #60A5FA 0% ${pKids}%, 
    #A78BFA ${pKids}% ${pKids + pYouth}%, 
    #34D399 ${pKids + pYouth}% ${pKids + pYouth + pAdults}%, 
    #FBBF24 ${pKids + pYouth + pAdults}% 100%
  )`;

  if (loading) return <div className="flex justify-center p-10 min-h-screen items-center bg-gray-50"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* --- CABEÇALHO AZUL --- */}
      <div className="bg-[#1D4ED8] pt-10 pb-24 px-8 shadow-sm">
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <BarChart3 className="text-blue-300"/> Relatórios & Estatísticas
            </h1>
            <p className="text-blue-100 text-lg opacity-90">Visão geral do crescimento da igreja.</p>
        </div>
      </div>

      {/* --- CONTEÚDO FLUTUANTE --- */}
      <div className="max-w-6xl mx-auto px-4 md:px-0 -mt-16 relative z-10">
          
          {/* KPI CARDS (TOPO) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              
              <div className="bg-white p-5 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex items-center gap-4 hover:-translate-y-1 transition duration-300">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-full"><Users size={24}/></div>
                  <div><p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Membros</p><h3 className="text-2xl font-black text-gray-800">{totalMembers}</h3></div>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex items-center gap-4 hover:-translate-y-1 transition duration-300">
                  <div className="p-3 bg-green-50 text-green-600 rounded-full"><UserCheck size={24}/></div>
                  <div><p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Ativos</p><h3 className="text-2xl font-black text-gray-800">{activeCount}</h3></div>
              </div>

              {/* CARD DIZIMISTAS */}
              <div className="bg-white p-5 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex items-center gap-4 hover:-translate-y-1 transition duration-300">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-full"><HandCoins size={24}/></div>
                  <div><p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Dizimistas</p><h3 className="text-2xl font-black text-gray-800">{tithersCount}</h3></div>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex items-center gap-4 hover:-translate-y-1 transition duration-300">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full"><ArrowUpRight size={24}/></div>
                  <div><p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Homens</p><h3 className="text-2xl font-black text-gray-800">{genderStats.male}</h3></div>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex items-center gap-4 hover:-translate-y-1 transition duration-300">
                  <div className="p-3 bg-pink-50 text-pink-600 rounded-full"><ArrowDownRight size={24}/></div>
                  <div><p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Mulheres</p><h3 className="text-2xl font-black text-gray-800">{genderStats.female}</h3></div>
              </div>
          </div>

          {/* GRÁFICOS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* --- COLUNA 1: GRÁFICO DE IDADE (PIZZA/DONUT) --- */}
              <div className="md:col-span-1 bg-white p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col items-center justify-center relative">
                  <h3 className="text-lg font-bold text-gray-800 mb-8 w-full flex items-center gap-2"><PieChart size={20} className="text-gray-400"/> Faixa Etária</h3>
                  
                  {/* O GRÁFICO PURO CSS */}
                  <div className="relative w-56 h-56 rounded-full shadow-inner mb-6" style={{ background: chartGradient }}>
                      {/* Círculo branco no meio */}
                      <div className="absolute inset-0 m-auto w-40 h-40 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                          <span className="text-4xl font-black text-gray-800">{totalMembers}</span>
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Pessoas</span>
                      </div>
                  </div>

                  {/* Legenda */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 w-full">
                      <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                          <div><p className="text-[10px] uppercase font-bold text-gray-400">Crianças</p><p className="font-bold text-gray-700">{demographics.kids}</p></div>
                      </div>
                      <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-violet-400"></div>
                          <div><p className="text-[10px] uppercase font-bold text-gray-400">Jovens</p><p className="font-bold text-gray-700">{demographics.youth}</p></div>
                      </div>
                      <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                          <div><p className="text-[10px] uppercase font-bold text-gray-400">Adultos</p><p className="font-bold text-gray-700">{demographics.adults}</p></div>
                      </div>
                      <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                          <div><p className="text-[10px] uppercase font-bold text-gray-400">Idosos</p><p className="font-bold text-gray-700">{demographics.seniors}</p></div>
                      </div>
                  </div>
              </div>

              {/* --- COLUNA 2: DETALHAMENTO VISUAL (BARRAS MODERNAS) --- */}
              <div className="md:col-span-2 bg-white p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-8 flex items-center gap-2"><TrendingUp size={20} className="text-gray-400"/> Detalhamento Demográfico</h3>

                  <div className="space-y-8">
                      {/* KIDS */}
                      <div className="group">
                          <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                                  <div className="p-2 bg-blue-50 rounded-xl"><Baby size={18}/></div> Crianças (0-11)
                              </div>
                              <span className="text-sm font-bold text-gray-600">{demographics.kids} <span className="text-xs text-gray-400 font-normal">({pKids.toFixed(0)}%)</span></span>
                          </div>
                          <div className="w-full bg-gray-50 rounded-full h-3 overflow-hidden">
                              <div className="bg-blue-400 h-3 rounded-full transition-all duration-1000 group-hover:bg-blue-500 shadow-sm" style={{ width: `${pKids}%` }}></div>
                          </div>
                      </div>

                      {/* YOUTH */}
                      <div className="group">
                          <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2 text-violet-600 font-bold text-sm">
                                  <div className="p-2 bg-violet-50 rounded-xl"><Smile size={18}/></div> Adolescentes (12-17)
                              </div>
                              <span className="text-sm font-bold text-gray-600">{demographics.youth} <span className="text-xs text-gray-400 font-normal">({pYouth.toFixed(0)}%)</span></span>
                          </div>
                          <div className="w-full bg-gray-50 rounded-full h-3 overflow-hidden">
                              <div className="bg-violet-400 h-3 rounded-full transition-all duration-1000 group-hover:bg-violet-500 shadow-sm" style={{ width: `${pYouth}%` }}></div>
                          </div>
                      </div>

                      {/* ADULTS */}
                      <div className="group">
                          <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                                  <div className="p-2 bg-emerald-50 rounded-xl"><User size={18}/></div> Adultos (18-59)
                              </div>
                              <span className="text-sm font-bold text-gray-600">{demographics.adults} <span className="text-xs text-gray-400 font-normal">({pAdults.toFixed(0)}%)</span></span>
                          </div>
                          <div className="w-full bg-gray-50 rounded-full h-3 overflow-hidden">
                              <div className="bg-emerald-400 h-3 rounded-full transition-all duration-1000 group-hover:bg-emerald-500 shadow-sm" style={{ width: `${pAdults}%` }}></div>
                          </div>
                      </div>

                      {/* SENIORS */}
                      <div className="group">
                          <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                                  <div className="p-2 bg-amber-50 rounded-xl"><UserCheck size={18}/></div> Melhor Idade (60+)
                              </div>
                              <span className="text-sm font-bold text-gray-600">{demographics.seniors} <span className="text-xs text-gray-400 font-normal">({pSeniors.toFixed(0)}%)</span></span>
                          </div>
                          <div className="w-full bg-gray-50 rounded-full h-3 overflow-hidden">
                              <div className="bg-amber-400 h-3 rounded-full transition-all duration-1000 group-hover:bg-amber-500 shadow-sm" style={{ width: `${pSeniors}%` }}></div>
                          </div>
                      </div>
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
}