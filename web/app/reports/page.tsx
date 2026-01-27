"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { memberService } from "../../services/memberService";
import { Member } from "../../types/member";
import { PieChart, Users, Cake, Baby, User } from "lucide-react";

export default function ReportsPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem("churchId");
    if (id) {
      memberService.listByChurch(id).then(data => {
        setMembers(data);
        setLoading(false);
      });
    }
  }, []);

  // --- CÁLCULOS ---
  const activeMembers = members.filter(m => m.status === 'active');
  const men = activeMembers.filter(m => m.gender === 'male').length;
  const women = activeMembers.filter(m => m.gender === 'female').length;

  // Faixa Etária
  const getAge = (dateString: string) => {
    if (!dateString) return 0;
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  let kids = 0, youth = 0, adults = 0, seniors = 0;
  activeMembers.forEach(m => {
    const age = getAge(m.birthDate);
    if (age > 0) {
        if (age < 12) kids++;
        else if (age < 18) youth++;
        else if (age < 60) adults++;
        else seniors++;
    }
  });

  // Aniversariantes do Mês
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const birthdays = activeMembers.filter(m => {
    if (!m.birthDate) return false;
    const mMonth = parseInt(m.birthDate.split('-')[1]);
    return mMonth === currentMonth;
  }).sort((a,b) => parseInt(a.birthDate.split('-')[2]) - parseInt(b.birthDate.split('-')[2]));

  if (loading) return <div className="p-8 text-white">Gerando gráficos...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <PieChart className="text-blue-600"/> Estatísticas da Igreja
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* CARD GÊNERO */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Gênero</h3>
            <div className="flex justify-between items-end">
                <div className="text-center">
                    <span className="block text-2xl font-bold text-blue-600">{men}</span>
                    <span className="text-xs text-slate-500">Homens</span>
                </div>
                <div className="h-8 w-px bg-slate-200"></div>
                <div className="text-center">
                    <span className="block text-2xl font-bold text-pink-500">{women}</span>
                    <span className="text-xs text-slate-500">Mulheres</span>
                </div>
            </div>
            {/* Barra Visual */}
            <div className="flex h-2 w-full rounded-full overflow-hidden mt-4 bg-slate-100">
                <div className="bg-blue-500" style={{ width: `${(men / (men+women || 1))*100}%` }}></div>
                <div className="bg-pink-500" style={{ width: `${(women / (men+women || 1))*100}%` }}></div>
            </div>
        </div>

        {/* CARD FAIXA ETÁRIA */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
             <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Faixa Etária (Estimada)</h3>
             <div className="grid grid-cols-4 gap-2 text-center">
                 <div className="bg-blue-50 p-2 rounded-lg">
                    <Baby size={20} className="mx-auto text-blue-400 mb-1"/>
                    <span className="block font-bold text-slate-700">{kids}</span>
                    <span className="text-[10px] text-slate-400">Crianças</span>
                 </div>
                 <div className="bg-purple-50 p-2 rounded-lg">
                    <User size={20} className="mx-auto text-purple-400 mb-1"/>
                    <span className="block font-bold text-slate-700">{youth}</span>
                    <span className="text-[10px] text-slate-400">Jovens</span>
                 </div>
                 <div className="bg-green-50 p-2 rounded-lg">
                    <Users size={20} className="mx-auto text-green-400 mb-1"/>
                    <span className="block font-bold text-slate-700">{adults}</span>
                    <span className="text-[10px] text-slate-400">Adultos</span>
                 </div>
                 <div className="bg-orange-50 p-2 rounded-lg">
                    <Users size={20} className="mx-auto text-orange-400 mb-1"/>
                    <span className="block font-bold text-slate-700">{seniors}</span>
                    <span className="text-[10px] text-slate-400">Idosos (+60)</span>
                 </div>
             </div>
        </div>

        {/* CARD TOTAL */}
        <div className="bg-blue-600 text-white p-5 rounded-xl shadow-lg flex flex-col justify-between">
            <div>
                <p className="text-blue-200 text-sm font-medium">Total Ativo</p>
                <h3 className="text-4xl font-bold">{activeMembers.length}</h3>
            </div>
            <div className="text-right">
                <Users size={32} className="opacity-50 ml-auto"/>
            </div>
        </div>
      </div>

      {/* ANIVERSARIANTES */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Cake className="text-pink-500"/> Aniversariantes do Mês
          </h2>
          
          {birthdays.length === 0 ? (
              <p className="text-slate-400 text-sm">Nenhum aniversariante neste mês.</p>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {birthdays.map(m => {
                      const day = m.birthDate.split('-')[2];
                      const age = getAge(m.birthDate);
                      return (
                          <div key={m.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50">
                              <div className="bg-pink-100 text-pink-600 font-bold w-10 h-10 flex items-center justify-center rounded-full text-sm">
                                  {day}
                              </div>
                              <div>
                                  <p className="font-bold text-slate-700 text-sm">{m.fullName}</p>
                                  <p className="text-xs text-slate-400">{age} anos</p>
                              </div>
                          </div>
                      );
                  })}
              </div>
          )}
      </div>
    </div>
  );
}