"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useChurch } from "../contexts/ChurchContext";
import { memberService } from "../services/memberService";
import { financeService } from "../services/financeService";
import { db } from "../lib/firebase";
// IMPORT ATUALIZADO: Adicionamos o addDoc aqui
import { collection, query, where, orderBy, limit, getDocs, addDoc } from "firebase/firestore";
import { MemberDashboard } from "../components/MemberDashboard"; 
import { Member } from "../types/member";
import { 
  Users, Calendar, TrendingUp, ArrowRight, 
  Clock, Loader2, Eye, EyeOff, Building2, UserCheck, UserX, Smartphone, LayoutDashboard, Activity, ShieldCheck,
  Cake, HeartHandshake, AlertCircle, MessageCircle, CheckCircle2
} from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const { churchId, churchName, userName, userRole, formatMoney, logoUrl, loading: authLoading } = useChurch();
  
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(false);
  const [stats, setStats] = useState({ active: 0, inactive: 0, total: 0 });
  const [balance, setBalance] = useState(0);
  const [nextEvents, setNextEvents] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<Member[]>([]);
  const [pastoralVisits, setPastoralVisits] = useState<Member[]>([]);
  const [markingVisitId, setMarkingVisitId] = useState<string | null>(null);
  const WEEKLY_VISIT_GOAL = 5;
  const [weeklyVisitCount, setWeeklyVisitCount] = useState(0);
  
  // Controle de Visão (Gestão vs Membro)
  const [viewMode, setViewMode] = useState<'management' | 'member'>('management');

  useEffect(() => {
    let isMounted = true;
    const checkAndLoad = async () => {
        if (authLoading) return;

        if (!churchId) { 
            const storedId = localStorage.getItem("churchId");
            if (!storedId) { 
                router.push("/login"); 
                return;
            }
        }

        if (userRole === 'member') {
            setViewMode('member');
            setLoading(false);
            return;
        }

        await loadDashboardData();
    };
    
    checkAndLoad();
    return () => { isMounted = false; };
  }, [churchId, router, userRole, authLoading]);

  const loadDashboardData = async () => {
    if(!churchId) return;
    try {
        setLoading(true);
        const [allMembers, allTransactions] = await Promise.all([
            memberService.listByChurch(churchId),
            financeService.listByChurch(churchId)
        ]);
        const activeCount = allMembers.filter(m => m.status === 'active').length;
        setStats({ active: activeCount, inactive: allMembers.length - activeCount, total: allMembers.length });
        
        let bal = 0;
        if (userRole === 'admin' || userRole === 'treasurer') {
            const totalIncome = allTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
            const totalExpense = allTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
            bal = totalIncome - totalExpense;
        }
        setBalance(bal);

        // Aniversariantes do mês atual (para o painel inicial)
        const currentMonth = new Date().getMonth();
        const monthBirthdays = allMembers
          .filter((m: Member) => {
            if (!m.birthDate) return false;
            const parts = m.birthDate.split("-");
            const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            return d.getMonth() === currentMonth;
          })
          .sort((a, b) => {
            const dayA = parseInt(a.birthDate!.split("-")[2]);
            const dayB = parseInt(b.birthDate!.split("-")[2]);
            return dayA - dayB;
          });
        setBirthdays(monthBirthdays);

        // Sugestão de visitas pastorais
        const activeMembers = allMembers.filter((m: Member) => m.status === "active");
        const sortedForVisit = activeMembers
          .slice()
          .sort((a: Member, b: Member) => {
            const aPriority = a.needsPastoralVisit ? 0 : 1;
            const bPriority = b.needsPastoralVisit ? 0 : 1;
            if (aPriority !== bPriority) return aPriority - bPriority;
            const aDate = a.lastPastoralVisit ? new Date(a.lastPastoralVisit).getTime() : 0;
            const bDate = b.lastPastoralVisit ? new Date(b.lastPastoralVisit).getTime() : 0;
            return aDate - bDate;
          })
          .slice(0, 5);
        setPastoralVisits(sortedForVisit);

        // Contagem de visitas realizadas na semana atual
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 (Domingo) - 6 (Sábado)
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);

        const visitsThisWeek = activeMembers.filter((m: Member) => {
          if (!m.lastPastoralVisit) return false;
          const visitDate = new Date(m.lastPastoralVisit);
          return visitDate >= startOfWeek && visitDate <= now;
        }).length;
        setWeeklyVisitCount(visitsThisWeek);

        const today = new Date().toISOString().split('T')[0]; 
        const qEvents = query(collection(db, "events"), where("churchId", "==", churchId), where("date", ">=", today), orderBy("date", "asc"), limit(3));
        const eventSnap = await getDocs(qEvents);
        setNextEvents(eventSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) { console.error("Erro dashboard:", error); } finally { setLoading(false); }
  };

  const handleSendBirthdayWhatsApp = (member: Member) => {
    if (!member.phone) {
      alert("Este membro não tem telefone cadastrado.");
      return;
    }

    const cleanPhone = member.phone.replace(/\D/g, "");
    const firstName = member.fullName.split(" ")[0];
    const text = `A Paz do Senhor, *${firstName}*! 🎉\n\nPassando aqui em nome da *${churchName}* para te desejar um Feliz Aniversário! Que Deus continue te abençoando grandemente.\n\nFelicidades! 🎂🙏`;

    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent || "",
    );
    if (isMobile) {
      window.location.href = url;
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // FUNÇÃO ATUALIZADA: Agora integra com o Diário de Atividades
  const handleMarkPastoralVisit = async (member: Member) => {
    if (!member.id) return;
    try {
      setMarkingVisitId(member.id);
      const today = new Date().toISOString();
      
      // 1. Atualiza a ficha do membro
      await memberService.update(member.id, { lastPastoralVisit: today, needsPastoralVisit: false });
      
      // 2. INTEGRAÇÃO: Cria a atividade automaticamente no relatório pastoral
      if (churchId) {
          await addDoc(collection(db, "activities"), {
              churchId: churchId,
              title: `Visita ao membro(a): ${member.fullName}`,
              date: today.split('T')[0], // Pega apenas YYYY-MM-DD
              category: "Visita Pastoral",
              quantity: 1,
              description: `Visita registrada automaticamente a partir do painel de início. Contato do membro: ${member.phone || 'Não registrado'}.`,
              createdBy: userRole || "admin",
              createdAt: Date.now()
          });
      }

      // 3. Atualiza a tela em tempo real
      setPastoralVisits(prev =>
        prev.map(m => (m.id === member.id ? { ...m, lastPastoralVisit: today, needsPastoralVisit: false } : m)),
      );
      setWeeklyVisitCount(prev => Math.min(prev + 1, WEEKLY_VISIT_GOAL));
    } catch (error) {
      console.error("Erro ao marcar visita pastoral:", error);
      alert("Não foi possível marcar a visita. Tente novamente.");
    } finally {
      setMarkingVisitId(null);
    }
  };

  const canSee = (allowedRoles: string[]) => {
      if (!userRole) return false;
      if (userRole === 'admin') return true; 
      return allowedRoles.includes(userRole);
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={40}/></div>;
  
  // --- MODO VISÃO DO MEMBRO ---
  if (viewMode === 'member') {
      return (
        <>
            {userRole !== 'member' && (
                <button onClick={() => setViewMode('management')} className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-gray-800 text-white px-6 py-3 rounded-full shadow-2xl font-bold text-xs flex items-center gap-2 hover:bg-gray-900 transition border border-gray-700 animate-in fade-in slide-in-from-bottom-4">
                    <LayoutDashboard size={18}/> Voltar para Gestão
                </button>
            )}
            <MemberDashboard />
        </>
      );
  }

  // --- MODO VISÃO DE GESTÃO ---
  return (
    <div className="min-h-screen bg-slate-50 pb-24 relative">
      
      {/* BOTÃO CENTRAL FLUTUANTE NO MOBILE */}
      <button onClick={() => setViewMode('member')} className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white w-14 h-14 rounded-full shadow-2xl shadow-blue-900/40 flex items-center justify-center hover:scale-110 transition border-4 border-gray-50 animate-in zoom-in md:hidden" title="Ver App Membro">
          <Smartphone size={24}/>
      </button>

      {/* BOTÃO DESKTOP (AGORA NO CANTO INFERIOR DIREITO) */}
      <button onClick={() => setViewMode('member')} className="hidden md:flex fixed bottom-8 right-8 z-50 bg-blue-600 text-white px-5 py-3 rounded-full shadow-2xl shadow-blue-900/20 font-bold text-xs items-center gap-2 hover:bg-blue-700 hover:-translate-y-1 transition-all border border-blue-500">
          <Smartphone size={16}/> Ver App Membro
      </button>

      {/* HERO HEADER (NOVO VISUAL DARK) */}
      <div className="bg-blue-800 pt-10 pb-32 px-4 md:px-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
                {logoUrl ? (
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-2xl p-2 backdrop-blur-sm border border-white/10 shadow-inner shrink-0">
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                ) : (
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-2xl flex items-center justify-center text-blue-300 border border-white/10 shrink-0">
                        <Building2 size={32} className="opacity-70"/>
                    </div>
                )}
                <div className="flex flex-col items-start">
                    <p className="text-blue-300 font-bold mb-1 text-xs md:text-sm uppercase tracking-wider">Painel Administrativo</p>
                    <h1 className="text-xl md:text-4xl font-bold text-white tracking-tight leading-tight max-w-[200px] md:max-w-none truncate">{churchName}</h1>
                    <p className="text-blue-100 text-sm mt-1">Olá, {userName}.</p>
                </div>
            </div>
            
            <div className="flex gap-4 self-end">
                <Link href="/agenda" className="hidden md:flex flex-col items-center gap-1 text-white opacity-80 hover:opacity-100 transition">
                    <div className="bg-white/10 p-3 rounded-xl border border-white/10 hover:bg-white/20 transition"><Calendar size={20}/></div>
                    <span className="text-[10px] font-bold">AGENDA</span>
                </Link>
                {canSee(['treasurer']) && (
                    <Link href="/financial" className="hidden md:flex flex-col items-center gap-1 text-white opacity-80 hover:opacity-100 transition">
                        <div className="bg-white/10 p-3 rounded-xl border border-white/10 hover:bg-white/20 transition"><TrendingUp size={20}/></div>
                        <span className="text-[10px] font-bold">EXTRATO</span>
                    </Link>
                )}
            </div>
        </div>
      </div>

      {/* CARDS */}
      <div className="max-w-6xl mx-auto px-4 md:px-0 -mt-20 relative z-10 grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CARD MEMBRESIA */}
        {canSee(['secretary']) && (
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col justify-between h-full min-h-[200px] group hover:border-blue-300 transition duration-300">
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Membresia Total</span>
                        <div className="bg-blue-50 text-blue-600 p-2 rounded-lg group-hover:scale-110 transition"><Users size={20}/></div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-800">{stats.total}</h2>
                        <span className="text-sm font-medium text-slate-500">Membros</span>
                    </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex gap-3">
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100" title="Membros Ativos">
                            <ShieldCheck size={12}/> {stats.active}
                        </div>
                        {stats.inactive > 0 && (
                            <div className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md border border-red-100" title="Membros Inativos">
                                <UserX size={12}/> {stats.inactive}
                            </div>
                        )}
                    </div>
                    <Link href="/members" className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1">
                        Ver Lista <ArrowRight size={12}/>
                    </Link>
                </div>
            </div>
        )}

        {/* CARD SALDO (CAIXA) */}
        {canSee(['treasurer']) && (
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col justify-between h-full min-h-[200px] group hover:border-emerald-300 transition duration-300">
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Saldo em Conta</span>
                        <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg group-hover:scale-110 transition"><TrendingUp size={20}/></div>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className={`text-3xl font-bold tracking-tight ${balance < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                            {showBalance ? formatMoney(balance) : "••••••••"}
                        </h2>
                        <button onClick={() => setShowBalance(!showBalance)} className="text-gray-400 hover:text-green-600 transition">
                            {showBalance ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                    </div>
                    <p className="text-xs text-gray-400">Saldo disponível</p>
                </div>
                <div className="mt-auto flex gap-2 pt-4 border-t border-gray-100">
                    <Link href="/financial" className="flex-1 py-2.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition text-center flex items-center justify-center">Extrato</Link>
                    <Link href="/financial" className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md shadow-emerald-200 transition text-center flex items-center justify-center">+ Lançar</Link>
                </div>
            </div>
        )}

        {/* CARD AGENDA */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col h-full min-h-[200px] group hover:border-amber-300 transition duration-300">
            <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Próximos Eventos</span>
                <div className="bg-amber-50 text-amber-600 p-2 rounded-lg group-hover:scale-110 transition"><Calendar size={20}/></div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[140px] pr-2 custom-scrollbar">
                {nextEvents.length === 0 ? (<div className="text-center py-4 text-gray-300">
                        <p className="text-xs">Nenhum evento futuro.</p>
                        <Link href="/agenda" className="text-blue-500 text-xs font-bold mt-1 block hover:underline">Agendar</Link>
                    </div>) : (nextEvents.map((evt) => (
                        <div key={evt.id} className="flex gap-3 items-start group hover:bg-gray-50 rounded-lg transition">
                            <div className="bg-blue-50 text-blue-700 rounded-lg p-1.5 text-center min-w-[45px] border border-blue-100">
                                <span className="block text-[9px] font-bold uppercase">{new Date(evt.date).toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0,3)}</span>
                                <span className="block text-lg font-black leading-none">{new Date(evt.date).getDate() + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-800 text-sm truncate group-hover:text-blue-600 transition">{evt.title}</h4>
                                <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                                    <span className="flex items-center gap-1"><Clock size={10}/> {evt.time}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                <Link href="/agenda" className="text-blue-600 text-xs font-bold hover:underline flex items-center justify-center gap-1">
                    Calendário <ArrowRight size={12}/>
                </Link>
            </div>
        </div>
      </div>

      {/* SEGUNDA LINHA: Aniversariantes + Visitas Pastorais (apenas Pastor / Secretaria) */}
      {canSee(['secretary']) && (
        <div className="max-w-6xl mx-auto px-4 md:px-0 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Aniversariantes do mês com WhatsApp */}
          {birthdays.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col h-full min-h-[240px] group hover:border-pink-300 transition duration-300">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-50">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Cake className="text-pink-500" size={18} /> Aniversariantes do mês
                </h3>
                <span className="text-xs font-bold bg-pink-50 text-pink-600 px-2 py-1 rounded-lg capitalize">
                  {new Date().toLocaleString("pt-BR", { month: "long" })}
                </span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[260px] pr-1 custom-scrollbar">
                {birthdays.map((m) => {
                  const day = m.birthDate ? m.birthDate.split("-")[2] : "??";
                  const isToday = parseInt(day) === new Date().getDate();
                  return (
                    <div
                      key={m.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                        isToday
                          ? "bg-pink-50 border-pink-100"
                          : "bg-gray-50 border-transparent hover:bg-white hover:border-gray-100"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          isToday ? "bg-pink-500 text-white shadow-lg shadow-pink-200" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {day}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-bold text-sm truncate ${
                            isToday ? "text-pink-700" : "text-gray-800"
                          }`}
                        >
                          {m.fullName}
                        </p>
                        <p className="text-[10px] text-gray-400 uppercase">
                          {m.role === "admin" ? "Pastor" : "Membro"}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSendBirthdayWhatsApp(m)}
                        className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition shadow-sm"
                        title="Enviar parabéns no WhatsApp"
                      >
                        <MessageCircle size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Visitas Pastorais inteligentes */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col h-full min-h-[240px] group hover:border-blue-300 transition duration-300 lg:col-span-2">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <HeartHandshake className="text-blue-500" size={18} /> Visitas Pastorais
              </h3>
            </div>

            <div className="mb-4 p-3 rounded-2xl bg-blue-50 border border-blue-100">
              <div className="flex justify-between text-[11px] font-bold text-blue-700 mb-1">
                <span>Meta semanal</span>
                <span>{weeklyVisitCount}/{WEEKLY_VISIT_GOAL} visitas</span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (weeklyVisitCount / WEEKLY_VISIT_GOAL) * 100)}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] font-bold text-gray-400 uppercase mb-3 flex items-center gap-1">
              <AlertCircle size={12} /> Sugestão inteligente (prioriza quem precisa mais)
            </p>

            <div className="flex-1 space-y-2 overflow-y-auto max-h-[260px] pr-1 custom-scrollbar">
              {pastoralVisits.length === 0 ? (
                <div className="text-center text-gray-400 text-xs py-8">
                  Nenhum membro sugerido para visita agora.
                </div>
              ) : (
                pastoralVisits.map((m) => {
                  const lastVisitLabel = m.lastPastoralVisit
                    ? new Date(m.lastPastoralVisit).toLocaleDateString("pt-BR")
                    : "Nunca visitado";
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-sm transition"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-gray-800 truncate max-w-[160px]">
                          {m.fullName}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          Última visita:{" "}
                          <span className={m.lastPastoralVisit ? "font-semibold" : "font-semibold text-amber-600"}>
                            {lastVisitLabel}
                          </span>
                        </p>
                        {m.needsPastoralVisit && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full mt-1">
                            <AlertCircle size={10} /> Prioridade da secretaria
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <button
                          onClick={() => handleMarkPastoralVisit(m)}
                          disabled={markingVisitId === m.id}
                          className={`flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold border transition ${
                            m.lastPastoralVisit
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700"
                          }`}
                          title="Marcar visita realizada"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                        <button
                          onClick={() => handleSendBirthdayWhatsApp(m)}
                          className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition shadow-sm"
                          title="Chamar no WhatsApp"
                        >
                          <MessageCircle size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}