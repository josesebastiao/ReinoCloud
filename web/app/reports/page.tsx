"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { useChurch } from "../../contexts/ChurchContext";
import { memberService } from "../../services/memberService";
import { Member } from "../../types/member"; 
import { 
  Users, BarChart3, Cake, HandCoins, HeartHandshake, AlertCircle, Sparkles, 
  PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, Loader2, ArrowLeft, X, Phone, Mail, MapPin, User, Droplets, MessageCircle
} from "lucide-react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function ReportsPage() {
  const router = useRouter();
  const { churchId, churchName, userRole, hasPermission, loading: authLoading } = useChurch();
  
  const [loadingData, setLoadingData] = useState(true);
  
  // Estados numéricos
  const [totalMembers, setTotalMembers] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [tithersCount, setTithersCount] = useState(0);
  const [genderStats, setGenderStats] = useState({ male: 0, female: 0 });
  
  // NOVOS ESTADOS: Batismos
  const [baptizedCount, setBaptizedCount] = useState(0);
  const [unbaptizedCount, setUnbaptizedCount] = useState(0);
  
  // Listas
  const [birthdays, setBirthdays] = useState<Member[]>([]);
  const [needsVisit, setNeedsVisit] = useState<Member[]>([]); 
  const [ageData, setAgeData] = useState<any[]>([]);

  // Modal Ver Ficha
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  useEffect(() => {
    if (!authLoading) {
        if (userRole !== 'admin' && !hasPermission('secretary')) {
            router.push('/'); 
        }
    }
  }, [authLoading, userRole, hasPermission, router]);

  useEffect(() => {
    if (churchId) {
        calculateStats();
    }
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
    if (!churchId) return;

    try {
        const members = await memberService.listByChurch(churchId);
        setTotalMembers(members.length);

        const activeMembers = members.filter(m => m.status === 'active');
        setActiveCount(activeMembers.length);
        setTithersCount(members.filter(m => m.isTither === true).length);

        const males = members.filter(m => m.gender === 'male').length;
        const females = members.filter(m => m.gender === 'female').length;
        setGenderStats({ male: males, female: females });

        // Cálculo de Batizados (Se tem data de batismo cadastrada, é considerado batizado)
        const baptized = members.filter(m => m.baptismDate && m.baptismDate.trim() !== "").length;
        setBaptizedCount(baptized);
        setUnbaptizedCount(members.length - baptized);

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

        // FILA INTELIGENTE PARA VISITAS PASTORAIS (para secretaria/pastor gerenciar)
        const visitList = activeMembers
          .slice()
          .sort((a, b) => {
            const aPriority = a.needsPastoralVisit ? 0 : 1;
            const bPriority = b.needsPastoralVisit ? 0 : 1;
            if (aPriority !== bPriority) return aPriority - bPriority;
            const aDate = a.lastPastoralVisit ? new Date(a.lastPastoralVisit).getTime() : 0;
            const bDate = b.lastPastoralVisit ? new Date(b.lastPastoralVisit).getTime() : 0;
            return aDate - bDate;
          })
          .slice(0, 15);
        setNeedsVisit(visitList);

    } catch (e) {
        console.error(e);
    } finally {
        setLoadingData(false);
    }
  };

  const currentMonthName = new Date().toLocaleString('pt-BR', { month: 'long' });

  const togglePastoralPriority = async (member: Member) => {
    if (!member.id) return;
    const newValue = !member.needsPastoralVisit;
    try {
      await memberService.update(member.id, { needsPastoralVisit: newValue });
      setNeedsVisit(prev =>
        prev.map(m => (m.id === member.id ? { ...m, needsPastoralVisit: newValue } : m)),
      );
    } catch (error) {
      console.error("Erro ao atualizar prioridade de visita pastoral:", error);
    }
  };

  const sendCongratulation = (member: Member) => {
      if (!member.phone) return alert("Este membro não tem telefone cadastrado.");
      
      const cleanPhone = member.phone.replace(/\D/g, '');
      const text = `A Paz do Senhor, *${member.fullName.split(' ')[0]}*! 🎉\n\nPassando aqui em nome da *${churchName || "Nossa Igreja"}* para te desejar um Feliz Aniversário! Que Deus continue te abençoando grandemente.\n\nFelicidades! 🎂🙏`;
      
      const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent || "",
      );
      if (isMobile) {
        window.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
  };

  if (authLoading || (loadingData && !totalMembers)) return <div className="flex justify-center p-10 min-h-screen items-center bg-gray-50"><Loader2 className="animate-spin text-blue-600"/></div>;

  if (userRole !== 'admin' && !hasPermission('secretary')) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <div className="bg-[#1D4ED8] pt-10 pb-24 px-8 shadow-sm">
        <div className="max-w-6xl mx-auto">
            <Link href="/secretary" className="text-blue-200 hover:text-white hidden md:flex items-center gap-2 mb-4 transition w-fit">
                <ArrowLeft size={20}/> Voltar para Secretaria
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3"><BarChart3 className="text-blue-300"/> Relatórios & Estatísticas</h1>
            <p className="text-blue-100 text-lg opacity-90">Visão estratégica do rebanho.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-0 -mt-16 relative z-10">
          
          {/* GRID DE DADOS RÁPIDOS - Agora com 6 colunas para telas grandes e 2 para celular */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
              <div className="bg-white p-4 lg:p-5 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-full"><Users size={20}/></div>
                  <div><p className="text-[10px] lg:text-xs text-gray-400 font-bold uppercase tracking-wider">Membros</p><h3 className="text-xl lg:text-2xl font-black text-gray-800">{totalMembers}</h3></div>
              </div>
              
              <div className="bg-white p-4 lg:p-5 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
                  <div className="p-3 bg-green-50 text-green-600 rounded-full"><HandCoins size={20}/></div>
                  <div><p className="text-[10px] lg:text-xs text-gray-400 font-bold uppercase tracking-wider">Dizimistas</p><h3 className="text-xl lg:text-2xl font-black text-gray-800">{tithersCount}</h3></div>
              </div>

              {/* CARD BATIZADOS */}
              <div className="bg-white p-4 lg:p-5 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
                  <div className="p-3 bg-cyan-50 text-cyan-600 rounded-full"><Droplets size={20}/></div>
                  <div><p className="text-[10px] lg:text-xs text-gray-400 font-bold uppercase tracking-wider">Batizados</p><h3 className="text-xl lg:text-2xl font-black text-gray-800">{baptizedCount}</h3></div>
              </div>

              {/* CARD NÃO BATIZADOS */}
              <div className="bg-white p-4 lg:p-5 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
                  <div className="p-3 bg-orange-50 text-orange-600 rounded-full"><User size={20}/></div>
                  <div><p className="text-[10px] lg:text-xs text-gray-400 font-bold uppercase tracking-wider">Não Batiz.</p><h3 className="text-xl lg:text-2xl font-black text-gray-800">{unbaptizedCount}</h3></div>
              </div>
              
              <div className="bg-white p-4 lg:p-5 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full"><ArrowUpRight size={20}/></div>
                  <div><p className="text-[10px] lg:text-xs text-gray-400 font-bold uppercase tracking-wider">Homens</p><h3 className="text-xl lg:text-2xl font-black text-gray-800">{genderStats.male}</h3></div>
              </div>
              
              <div className="bg-white p-4 lg:p-5 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
                  <div className="p-3 bg-pink-50 text-pink-600 rounded-full"><ArrowDownRight size={20}/></div>
                  <div><p className="text-[10px] lg:text-xs text-gray-400 font-bold uppercase tracking-wider">Mulheres</p><h3 className="text-xl lg:text-2xl font-black text-gray-800">{genderStats.female}</h3></div>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col h-[420px]">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-50"><h3 className="font-bold text-gray-800 flex items-center gap-2"><Cake className="text-pink-500" size={20}/> Aniversariantes</h3><span className="text-xs font-bold bg-pink-50 text-pink-600 px-2 py-1 rounded-lg capitalize">{currentMonthName}</span></div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                      {birthdays.length > 0 ? birthdays.map(m => {
                          const day = m.birthDate ? m.birthDate.split('-')[2] : '??';
                          const isToday = parseInt(day) === new Date().getDate();
                          return (<div key={m.id} className={`flex items-center gap-3 p-3 rounded-xl transition ${isToday ? 'bg-pink-50 border border-pink-100' : 'hover:bg-gray-50 border border-transparent'}`}><div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isToday ? 'bg-pink-500 text-white shadow-lg shadow-pink-200' : 'bg-gray-100 text-gray-500'}`}>{day}</div><div className="flex-1 min-w-0"><p className={`font-bold text-sm truncate ${isToday ? 'text-pink-700' : 'text-gray-700'}`}>{m.fullName}</p><p className="text-[10px] text-gray-400 uppercase">{m.role === 'admin' ? 'Pastor' : 'Membro'}</p></div>{isToday && <Sparkles size={16} className="text-pink-500 animate-pulse shrink-0"/>}<button onClick={(e) => { e.stopPropagation(); sendCongratulation(m); }} className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-500 hover:text-white transition shrink-0" title="Enviar Parabéns no WhatsApp"><MessageCircle size={14} /></button></div>)
                      }) : (<div className="text-center py-10 text-gray-400 flex flex-col items-center"><Cake size={40} className="mb-2 opacity-20"/><p className="text-sm">Nenhum aniversariante.</p></div>)}
                  </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col h-[420px]">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <HeartHandshake className="text-blue-500" size={20}/> Visitas Pastorais
                    </h3>
                    <span className="text-[11px] font-semibold text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
                      Fila para o Pastor
                    </span>
                  </div>
                  <div className="mb-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-[11px] text-blue-800 font-medium">
                      Use esta lista para marcar quem precisa de visita pastoral. Os marcados como{" "}
                      <strong>Prioridade</strong> aparecerão em destaque no painel inicial do Pastor.
                    </p>
                  </div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1">
                    <AlertCircle size={12}/> Sugestão inteligente
                  </h4>
                  <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                      {needsVisit.map(m => {
                        const lastVisitLabel = m.lastPastoralVisit
                          ? new Date(m.lastPastoralVisit).toLocaleDateString('pt-BR')
                          : 'Nunca visitado';
                        return (
                          <div
                            key={m.id}
                            className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:shadow-sm transition"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-gray-700 truncate max-w-[140px]">
                                {m.fullName}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                Última visita:{" "}
                                <span className={m.lastPastoralVisit ? "font-semibold text-gray-600" : "font-semibold text-amber-600"}>
                                  {lastVisitLabel}
                                </span>
                              </p>
                              {m.needsPastoralVisit && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full mt-1">
                                  Prioridade da secretaria
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <button
                                onClick={() => togglePastoralPriority(m)}
                                className={`text-[10px] px-3 py-1.5 rounded-lg font-bold border transition ${
                                  m.needsPastoralVisit
                                    ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                                    : "bg-white border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
                                }`}
                              >
                                {m.needsPastoralVisit ? "Remover da fila" : "Marcar prioridade"}
                              </button>
                              <button
                                onClick={() => setSelectedMember(m)}
                                className="text-[10px] bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-bold hover:text-blue-600 hover:border-blue-200 transition"
                              >
                                Ver Ficha
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col h-[420px]">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-50"><h3 className="font-bold text-gray-800 flex items-center gap-2"><PieChartIcon className="text-violet-500" size={20}/> Faixa Etária</h3></div>
                  <div className="flex-1 flex flex-col items-center justify-center relative min-h-[200px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={ageData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{ageData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} itemStyle={{color: '#374151', fontSize: '12px', fontWeight: 'bold'}}/></PieChart></ResponsiveContainer><div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-3xl font-black text-gray-800">{totalMembers}</span><span className="text-[10px] font-bold text-gray-400 uppercase">Membros</span></div></div>
                  <div className="grid grid-cols-2 gap-3 mt-4">{ageData.map((d, i) => (<div key={i} className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded-lg"><div className="w-2 h-2 rounded-full shrink-0" style={{background: d.color}}></div><span className="text-gray-500 font-medium truncate">{d.name}</span><strong className="text-gray-800 ml-auto">{d.value}</strong></div>))}</div>
              </div>
          </div>
      </div>

      {/* MODAL VER FICHA */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                <div className="bg-blue-600 p-6 text-center relative">
                    <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 text-white/70 hover:text-white"><X size={20}/></button>
                    <div className="w-20 h-20 bg-white rounded-full mx-auto mb-3 flex items-center justify-center border-4 border-blue-400">
                        {selectedMember.photoUrl ? <img src={selectedMember.photoUrl} className="w-full h-full rounded-full object-cover"/> : <User className="text-blue-300" size={40}/>}
                    </div>
                    <h3 className="text-xl font-bold text-white">{selectedMember.fullName}</h3>
                    <p className="text-blue-100 text-sm uppercase font-bold tracking-wider">{selectedMember.role === 'admin' ? 'Pastor' : 'Membro'}</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 text-gray-600">
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Phone size={16}/></div>
                        <div><p className="text-xs text-gray-400 font-bold uppercase">Telefone</p><p className="font-medium text-sm">{selectedMember.phone || "Não informado"}</p></div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Mail size={16}/></div>
                        <div><p className="text-xs text-gray-400 font-bold uppercase">E-mail</p><p className="font-medium text-sm truncate max-w-[200px]">{selectedMember.email || "Não informado"}</p></div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><MapPin size={16}/></div>
                        <div><p className="text-xs text-gray-400 font-bold uppercase">Endereço</p><p className="font-medium text-sm">{selectedMember.address?.street || "Não informado"}</p></div>
                    </div>
                    <button onClick={() => router.push('/members')} className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition text-sm">
                        Ver Cadastro Completo
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}