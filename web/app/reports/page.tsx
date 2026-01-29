"use client";
import { useState, useEffect } from "react";
import { useChurch } from "../../contexts/ChurchContext";
import { memberService } from "../../services/memberService";
import { 
  PieChart, Users, TrendingUp, Calendar, 
  ArrowUpRight, ArrowDownRight, Loader2, BarChart3,
  Baby, Smile, User, UserCheck
} from "lucide-react";

export default function ReportsPage() {
  const { churchId } = useChurch();
  const [loading, setLoading] = useState(true);
  
  // Estados numéricos
  const [totalMembers, setTotalMembers] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
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

        const males = members.filter(m => m.gender === 'male').length;
        const females = members.filter(m => m.gender === 'female').length;
        setGenderStats({ male: males, female: females });

        let k = 0, y = 0, a = 0, s = 0;
        activeMembers.forEach(m => {
            const age = getAge(m.birthDate || ""); 
            if (age >= 0) { // Conta mesmo quem tem 0 anos (bebês)
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

  // --- CÁLCULO PARA O GRÁFICO DE PIZZA (CSS CONIC GRADIENT) ---
  const totalDemo = demographics.kids + demographics.youth + demographics.adults + demographics.seniors || 1;
  const pKids = (demographics.kids / totalDemo) * 100;
  const pYouth = (demographics.youth / totalDemo) * 100;
  const pAdults = (demographics.adults / totalDemo) * 100;
  const pSeniors = (demographics.seniors / totalDemo) * 100;

  // Cria a string do gradiente baseada nas porcentagens acumuladas
  const chartGradient = `conic-gradient(
    #60A5FA 0% ${pKids}%, 
    #A78BFA ${pKids}% ${pKids + pYouth}%, 
    #34D399 ${pKids + pYouth}% ${pKids + pYouth + pAdults}%, 
    #FBBF24 ${pKids + pYouth + pAdults}% 100%
  )`;

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50 pb-24">
      
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="text-blue-600"/> Relatórios
        </h1>
        <p className="text-sm text-gray-500">Panorama do crescimento da igreja.</p>
      </div>

      {/* --- KPI CARDS (TOPO) --- */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-blue-500 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full"><Users size={24}/></div>
              <div><p className="text-xs text-gray-400 font-bold uppercase">Total Membros</p><h3 className="text-2xl font-black text-gray-800">{totalMembers}</h3></div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-green-500 flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-full"><UserCheck size={24}/></div>
              <div><p className="text-xs text-gray-400 font-bold uppercase">Ativos</p><h3 className="text-2xl font-black text-gray-800">{activeCount}</h3></div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-indigo-500 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full"><ArrowUpRight size={24}/></div>
              <div><p className="text-xs text-gray-400 font-bold uppercase">Homens</p><h3 className="text-2xl font-black text-gray-800">{genderStats.male}</h3></div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-pink-500 flex items-center gap-4">
              <div className="p-3 bg-pink-50 text-pink-600 rounded-full"><ArrowDownRight size={24}/></div>
              <div><p className="text-xs text-gray-400 font-bold uppercase">Mulheres</p><h3 className="text-2xl font-black text-gray-800">{genderStats.female}</h3></div>
          </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* --- COLUNA 1: GRÁFICO DE IDADE (PIZZA/DONUT) --- */}
          <div className="md:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative">
              <h3 className="text-lg font-bold text-gray-800 mb-6 w-full flex items-center gap-2"><PieChart size={18} className="text-gray-400"/> Faixa Etária</h3>
              
              {/* O GRÁFICO PURO CSS */}
              <div className="relative w-48 h-48 rounded-full shadow-inner" style={{ background: chartGradient }}>
                  {/* Círculo branco no meio para fazer virar um Donut */}
                  <div className="absolute inset-0 m-auto w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-gray-800">{totalMembers}</span>
                      <span className="text-[10px] uppercase font-bold text-gray-400">Pessoas</span>
                  </div>
              </div>

              {/* Legenda do Gráfico */}
              <div className="grid grid-cols-2 gap-4 mt-8 w-full">
                  <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                      <div><p className="text-xs text-gray-400 font-bold">Crianças</p><p className="font-bold text-gray-700">{demographics.kids}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-violet-400"></div>
                      <div><p className="text-xs text-gray-400 font-bold">Jovens</p><p className="font-bold text-gray-700">{demographics.youth}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                      <div><p className="text-xs text-gray-400 font-bold">Adultos</p><p className="font-bold text-gray-700">{demographics.adults}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                      <div><p className="text-xs text-gray-400 font-bold">Idosos</p><p className="font-bold text-gray-700">{demographics.seniors}</p></div>
                  </div>
              </div>
          </div>

          {/* --- COLUNA 2: DETALHAMENTO VISUAL (BARRAS MODERNAS) --- */}
          <div className="md:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2"><TrendingUp size={18} className="text-gray-400"/> Detalhamento</h3>

              <div className="space-y-6">
                  {/* KIDS */}
                  <div className="group">
                      <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                              <div className="p-1.5 bg-blue-50 rounded-lg"><Baby size={16}/></div> Crianças (0-11)
                          </div>
                          <span className="text-sm font-bold text-gray-600">{demographics.kids} <span className="text-xs text-gray-400 font-normal">({pKids.toFixed(0)}%)</span></span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-blue-400 h-2.5 rounded-full transition-all duration-1000 group-hover:bg-blue-500" style={{ width: `${pKids}%` }}></div>
                      </div>
                  </div>

                  {/* YOUTH */}
                  <div className="group">
                      <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2 text-violet-600 font-bold text-sm">
                              <div className="p-1.5 bg-violet-50 rounded-lg"><Smile size={16}/></div> Adolescentes (12-17)
                          </div>
                          <span className="text-sm font-bold text-gray-600">{demographics.youth} <span className="text-xs text-gray-400 font-normal">({pYouth.toFixed(0)}%)</span></span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-violet-400 h-2.5 rounded-full transition-all duration-1000 group-hover:bg-violet-500" style={{ width: `${pYouth}%` }}></div>
                      </div>
                  </div>

                  {/* ADULTS */}
                  <div className="group">
                      <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                              <div className="p-1.5 bg-emerald-50 rounded-lg"><User size={16}/></div> Adultos (18-59)
                          </div>
                          <span className="text-sm font-bold text-gray-600">{demographics.adults} <span className="text-xs text-gray-400 font-normal">({pAdults.toFixed(0)}%)</span></span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-emerald-400 h-2.5 rounded-full transition-all duration-1000 group-hover:bg-emerald-500" style={{ width: `${pAdults}%` }}></div>
                      </div>
                  </div>

                  {/* SENIORS */}
                  <div className="group">
                      <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                              <div className="p-1.5 bg-amber-50 rounded-lg"><UserCheck size={16}/></div> Melhor Idade (60+)
                          </div>
                          <span className="text-sm font-bold text-gray-600">{demographics.seniors} <span className="text-xs text-gray-400 font-normal">({pSeniors.toFixed(0)}%)</span></span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-amber-400 h-2.5 rounded-full transition-all duration-1000 group-hover:bg-amber-500" style={{ width: `${pSeniors}%` }}></div>
                      </div>
                  </div>
              </div>
          </div>

      </div>
    </div>
  );
}