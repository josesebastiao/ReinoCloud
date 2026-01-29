"use client";
import { useState, useEffect } from "react";
import { useChurch } from "../../contexts/ChurchContext";
import { memberService } from "../../services/memberService";
import { 
  PieChart, Users, TrendingUp, Calendar, 
  ArrowUpRight, ArrowDownRight, Loader2, BarChart3 
} from "lucide-react";

export default function ReportsPage() {
  const { churchId } = useChurch();
  const [loading, setLoading] = useState(true);
  
  // Estados para os gráficos
  const [totalMembers, setTotalMembers] = useState(0);
  const [growth, setGrowth] = useState(0); // Crescimento mensal (exemplo)
  
  // Demografia
  const [demographics, setDemographics] = useState({
      kids: 0,   // 0-11
      youth: 0,  // 12-17
      adults: 0, // 18-59
      seniors: 0 // 60+
  });

  // Gênero
  const [genderStats, setGenderStats] = useState({ male: 0, female: 0 });

  // Status
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    if (churchId) calculateStats();
  }, [churchId]);

  const getAge = (dateString: string) => {
    if (!dateString) return 0;
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  };

  const calculateStats = async () => {
    try {
        const members = await memberService.listByChurch(churchId);
        setTotalMembers(members.length);

        // Filtra ativos
        const activeMembers = members.filter(m => m.status === 'active');
        setActiveCount(activeMembers.length);

        // Gênero
        const males = members.filter(m => m.gender === 'male').length;
        const females = members.filter(m => m.gender === 'female').length;
        setGenderStats({ male: males, female: females });

        // Faixa Etária
        let k = 0, y = 0, a = 0, s = 0;
        
        activeMembers.forEach(m => {
            // --- AQUI ESTAVA O ERRO ---
            // Adicionamos '|| ""' para garantir que nunca seja undefined
            const age = getAge(m.birthDate || ""); 
            
            if (age > 0) {
                if (age < 12) k++;
                else if (age < 18) y++;
                else if (age < 60) a++;
                else s++;
            }
        });

        setDemographics({ kids: k, youth: y, adults: a, seniors: s });
        
        // Simulação de crescimento (pode ser real se usarmos createdAt)
        setGrowth(5); 

    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50 pb-24">
      
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="text-blue-600"/> Relatórios & Estatísticas
        </h1>
        <p className="text-sm text-gray-500">Visão geral do crescimento da igreja.</p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* CARD TOTAL */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={20}/></div>
                  <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <TrendingUp size={12} className="mr-1"/> +{growth}%
                  </span>
              </div>
              <h3 className="text-3xl font-extrabold text-gray-800">{totalMembers}</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Total de Membros</p>
          </div>

          {/* CARD ATIVOS */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
               <div className="p-3 bg-green-50 text-green-600 rounded-xl w-fit mb-4"><Calendar size={20}/></div>
               <h3 className="text-3xl font-extrabold text-gray-800">{activeCount}</h3>
               <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Membros Ativos</p>
          </div>

          {/* CARD HOMENS */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
               <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit mb-4"><ArrowUpRight size={20}/></div>
               <h3 className="text-3xl font-extrabold text-gray-800">{genderStats.male}</h3>
               <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Homens</p>
          </div>

          {/* CARD MULHERES */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
               <div className="p-3 bg-pink-50 text-pink-600 rounded-xl w-fit mb-4"><ArrowDownRight size={20}/></div>
               <h3 className="text-3xl font-extrabold text-gray-800">{genderStats.female}</h3>
               <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Mulheres</p>
          </div>
      </div>

      {/* GRÁFICO DEMOGRAFIA (Barras Simples) */}
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <PieChart size={20} className="text-gray-400"/> Distribuição por Idade
          </h3>

          <div className="space-y-6">
              {/* KIDS */}
              <div>
                  <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
                      <span>Crianças (0-11)</span>
                      <span>{demographics.kids}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                      <div className="bg-blue-400 h-3 rounded-full" style={{ width: `${(demographics.kids / totalMembers) * 100}%` }}></div>
                  </div>
              </div>

              {/* YOUTH */}
              <div>
                  <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
                      <span>Adolescentes (12-17)</span>
                      <span>{demographics.youth}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                      <div className="bg-purple-400 h-3 rounded-full" style={{ width: `${(demographics.youth / totalMembers) * 100}%` }}></div>
                  </div>
              </div>

              {/* ADULTS */}
              <div>
                  <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
                      <span>Adultos (18-59)</span>
                      <span>{demographics.adults}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                      <div className="bg-green-500 h-3 rounded-full" style={{ width: `${(demographics.adults / totalMembers) * 100}%` }}></div>
                  </div>
              </div>

              {/* SENIORS */}
              <div>
                  <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
                      <span>Melhor Idade (60+)</span>
                      <span>{demographics.seniors}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                      <div className="bg-orange-400 h-3 rounded-full" style={{ width: `${(demographics.seniors / totalMembers) * 100}%` }}></div>
                  </div>
              </div>
          </div>
      </div>

    </div>
  );
}