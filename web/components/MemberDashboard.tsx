"use client";
import { useState, useEffect } from "react";
import { useChurch } from "../contexts/ChurchContext";
import { postService, Post } from "../services/postService";
import { memberService } from "../services/memberService";
import { financeService } from "../services/financeService";
import { generalScaleService } from "../services/generalScaleService";
import { Member } from "../types/member";
import { auth } from "../lib/firebase";
import { 
  Megaphone, Calendar, Gift, BookOpen, Clock, User, Bell, 
  CreditCard, DollarSign, Heart, LogOut, X, Loader2, Send, ChevronRight 
} from "lucide-react";

export function MemberDashboard() {
  const { churchId, churchName, logoUrl, user, userName, formatMoney } = useChurch();
  
  // ESTADOS GERAIS
  const [loading, setLoading] = useState(true);
  const [memberData, setMemberData] = useState<Member | null>(null);
  
  // DADOS DO DASHBOARD
  const [posts, setPosts] = useState<Post[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [myScales, setMyScales] = useState<any[]>([]);
  const [myContributions, setMyContributions] = useState<any[]>([]);

  // MODAIS (NOVOS)
  const [showCard, setShowCard] = useState(false);
  const [showFinance, setShowFinance] = useState(false);
  const [showPrayer, setShowPrayer] = useState(false);

  useEffect(() => {
    if (churchId && user?.email) {
        loadData();
    }
  }, [churchId, user]);

  const loadData = async () => {
    if (!churchId) return;
    setLoading(true);
    try {
        // 1. Carregar Membros e Identificar "Eu"
        const allMembers = await memberService.listByChurch(churchId);
        const me = allMembers.find(m => m.email === user?.email);
        
        if (me) {
            setMemberData(me);
            
            // 2. Carregar Minhas Contribuições (Dízimos)
            if (me.id) {
                const allTrans = await financeService.listByChurch(churchId);
                const mine = allTrans.filter(t => t.memberId === me.id && t.type === 'income');
                setMyContributions(mine);
            }

            // 3. Minhas Escalas
            const scalesFound: any[] = [];
            const generalScales = await generalScaleService.listByChurch(churchId);
            generalScales.forEach((scale: any) => {
                scale.rows.forEach((row: any) => {
                    if (row.leader.includes(me.fullName) || row.preacher.includes(me.fullName) || row.music.includes(me.fullName)) {
                        scalesFound.push({
                            date: row.date,
                            event: row.event,
                            obs: `${row.leader === me.fullName ? 'Dirigente' : ''} ${row.preacher === me.fullName ? 'Pregador' : ''} ${row.music === me.fullName ? 'Louvor' : ''}`.trim()
                        });
                    }
                });
            });
            scalesFound.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setMyScales(scalesFound.filter(s => new Date(s.date) >= new Date()));
        }

        // 4. Carregar Mural e Aniversariantes
        const allPosts = await postService.listByChurch(churchId);
        setPosts(allPosts);

        const currentMonth = new Date().getMonth();
        const bdays = allMembers.filter(m => {
            if(!m.birthDate) return false;
            const parts = m.birthDate.split('-');
            const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            return d.getMonth() === currentMonth;
        }).sort((a, b) => parseInt(a.birthDate!.split('-')[2]) - parseInt(b.birthDate!.split('-')[2]));
        setBirthdays(bdays);

    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleLogout = () => {
      auth.signOut();
      window.location.href = "/login";
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600"/></div>;

  const notices = posts.filter(p => p.type === 'notice' || p.type === 'event');
  const devotionals = posts.filter(p => p.type === 'devotional');

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* 1. CABEÇALHO APP */}
      <div className="bg-blue-600 pt-8 pb-16 px-6 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-white/30 overflow-hidden bg-white/10 backdrop-blur-sm">
                      {memberData?.photoUrl ? (
                          <img src={memberData.photoUrl} className="w-full h-full object-cover" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-white"><User size={24}/></div>
                      )}
                  </div>
                  <div>
                      <p className="text-blue-200 text-xs font-bold uppercase tracking-wider">Bem-vindo</p>
                      {/* Correção de segurança no nome */}
                      <h1 className="text-xl font-bold text-white truncate max-w-[200px]">
                          {userName ? userName.split(' ')[0] : "Irmão(ã)"}
                      </h1>
                  </div>
              </div>
              <button onClick={handleLogout} className="bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition">
                  <LogOut size={20}/>
              </button>
          </div>
      </div>

      <div className="px-6 -mt-8 relative z-20 space-y-6">
          
          {/* 2. MENU DE AÇÕES RÁPIDAS (NOVO) */}
          <div className="bg-white p-4 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex justify-around items-center animate-in slide-in-from-bottom-4">
              <button onClick={() => setShowCard(true)} className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition duration-300 shadow-sm">
                      <CreditCard size={24}/>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500">Carteirinha</span>
              </button>
              
              <button onClick={() => setShowFinance(true)} className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition duration-300 shadow-sm">
                      <DollarSign size={24}/>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500">Dízimos</span>
              </button>

              <button onClick={() => setShowPrayer(true)} className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition duration-300 shadow-sm">
                      <Heart size={24}/>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500">Oração</span>
              </button>
          </div>

          {/* 3. AVISO DE ESCALA (SE HOUVER) */}
          {myScales.length > 0 && (
              <div className="bg-orange-50 border border-orange-100 p-5 rounded-3xl relative overflow-hidden flex gap-4 items-center">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-100 rounded-full opacity-50"></div>
                  <div className="bg-white p-3 rounded-2xl shadow-sm text-center min-w-[60px] relative z-10">
                      <span className="block text-xs font-bold text-orange-400 uppercase">DIA</span>
                      <span className="block text-xl font-black text-gray-800">{new Date(myScales[0].date).getDate()}</span>
                  </div>
                  <div className="relative z-10">
                      <span className="text-[10px] font-bold bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">VOCÊ FOI ESCALADO!</span>
                      <h3 className="font-bold text-gray-800 mt-1 text-sm">{myScales[0].event}</h3>
                      <p className="text-xs text-gray-500">{myScales[0].obs}</p>
                  </div>
              </div>
          )}

          {/* 4. DEVOCIONAL DO DIA */}
          {devotionals.length > 0 && (
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
                  <BookOpen className="absolute -bottom-4 -right-4 text-white/10 w-32 h-32"/>
                  <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold uppercase mb-3 inline-block backdrop-blur-sm">Palavra Pastoral</span>
                  <h3 className="text-xl font-bold mb-2 leading-tight">{devotionals[0].title}</h3>
                  <p className="text-sm text-purple-100 line-clamp-3 leading-relaxed">{devotionals[0].content}</p>
              </div>
          )}

          {/* 5. MURAL DE AVISOS */}
          <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Megaphone size={18} className="text-blue-600"/> Mural da Igreja
              </h2>
              <div className="space-y-3">
                  {notices.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4 italic bg-white rounded-2xl border border-dashed border-gray-200">Nenhum aviso por enquanto.</p>
                  ) : notices.map(notice => (
                      <div key={notice.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex gap-3">
                          <div className={`w-1 rounded-full ${notice.type === 'event' ? 'bg-orange-400' : 'bg-blue-400'}`}></div>
                          <div className="flex-1">
                              <div className="flex justify-between items-start mb-1">
                                  <h3 className="font-bold text-gray-800 text-sm">{notice.title}</h3>
                                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{new Date(notice.date).toLocaleDateString('pt-BR')}</span>
                              </div>
                              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{notice.content}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* 6. ANIVERSARIANTES */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2 tracking-wider">
                  <Gift size={16} className="text-pink-500"/> Aniversariantes do Mês
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {birthdays.length === 0 ? (
                      <p className="text-gray-400 text-xs italic w-full text-center">Ninguém faz aniversário este mês.</p>
                  ) : birthdays.map(m => (
                      <div key={m.id} className="min-w-[70px] flex flex-col items-center text-center">
                          <div className="w-12 h-12 rounded-full bg-gray-100 mb-2 overflow-hidden border-2 border-white shadow-sm ring-2 ring-gray-50">
                              {m.photoUrl ? <img src={m.photoUrl} className="w-full h-full object-cover"/> : <User className="w-full h-full p-2 text-gray-300"/>}
                          </div>
                          <p className="text-xs font-bold text-gray-700 truncate w-full">{m.fullName.split(' ')[0]}</p>
                          <p className="text-[10px] text-pink-500 font-bold">{m.birthDate.split('-')[2]}/{m.birthDate.split('-')[1]}</p>
                      </div>
                  ))}
              </div>
          </div>

      </div>

      {/* --- MODAIS (CARTEIRINHA, FINANCEIRO, ORAÇÃO) --- */}
      
      {/* 1. CARTEIRINHA DIGITAL */}
      {showCard && memberData && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-sm relative">
                <button onClick={() => setShowCard(false)} className="absolute -top-10 right-0 text-white font-bold flex items-center gap-1 text-sm bg-white/20 px-3 py-1 rounded-full"><X size={14}/> Fechar</button>
                <div className="bg-white rounded-2xl overflow-hidden shadow-2xl transform transition-all hover:scale-[1.02] duration-500">
                    <div className="bg-gradient-to-br from-blue-800 to-blue-900 p-6 text-white relative h-[180px] flex flex-col justify-between">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                        <div className="flex justify-between items-start relative z-10">
                            {logoUrl && <img src={logoUrl} className="h-8 object-contain brightness-0 invert opacity-80" />}
                            <div className="bg-white/20 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest backdrop-blur-sm">Membro</div>
                        </div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-16 h-16 rounded-full border-2 border-white/50 bg-gray-300 overflow-hidden shadow-lg">
                                {memberData.photoUrl ? <img src={memberData.photoUrl} className="w-full h-full object-cover"/> : <div className="flex items-center justify-center h-full text-xl text-gray-500">👤</div>}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold leading-tight uppercase">{memberData.fullName}</h2>
                                <p className="text-[10px] text-blue-200 mt-0.5 uppercase tracking-wide">{churchName}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6">
                        <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                            <div><p className="text-gray-400 font-bold uppercase text-[9px]">Membro Desde</p><p className="font-bold text-gray-800">{memberData.baptismDate ? new Date(memberData.baptismDate).toLocaleDateString() : '---'}</p></div>
                            <div><p className="text-gray-400 font-bold uppercase text-[9px]">Nascimento</p><p className="font-bold text-gray-800">{memberData.birthDate ? new Date(memberData.birthDate).toLocaleDateString() : '---'}</p></div>
                        </div>
                        <div className="pt-4 border-t border-dashed border-gray-200 text-center">
                            <div className="h-6"></div> 
                            <div className="border-t border-gray-400 w-2/3 mx-auto"></div>
                            <p className="text-[8px] font-bold text-gray-400 mt-1 uppercase">Pastor Presidente</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* 2. EXTRATO DE DÍZIMOS */}
      {showFinance && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-in slide-in-from-bottom-10">
              <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 h-[80vh] flex flex-col shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><DollarSign className="text-green-600"/> Minhas Contribuições</h2>
                      <button onClick={() => setShowFinance(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition"><X size={20}/></button>
                  </div>
                  
                  <div className="bg-green-50 p-6 rounded-2xl mb-4 text-center border border-green-100">
                      <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Total Contribuído</p>
                      <p className="text-4xl font-black text-green-700 tracking-tight">
                          {formatMoney(myContributions.reduce((acc, curr) => acc + Number(curr.amount), 0))}
                      </p>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {myContributions.length === 0 ? (
                          <div className="text-center py-12 text-gray-400">
                              <DollarSign size={40} className="mx-auto mb-2 opacity-20"/>
                              <p className="text-sm">Nenhuma contribuição registrada ainda.</p>
                          </div>
                      ) : (
                          myContributions.map(t => (
                              <div key={t.id} className="flex justify-between items-center p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition rounded-lg">
                                  <div>
                                      <p className="text-sm font-bold text-gray-700">{t.category}</p>
                                      <p className="text-[10px] text-gray-400 font-medium uppercase">{new Date(t.date).toLocaleDateString('pt-BR', {weekday: 'short', day:'2-digit', month:'short'})}</p>
                                  </div>
                                  <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded text-sm">{formatMoney(t.amount)}</span>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* 3. PEDIDO DE ORAÇÃO */}
      {showPrayer && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-purple-100 animate-pulse"><Heart size={32}/></div>
                      <h2 className="text-xl font-bold text-gray-800">Pedido de Oração</h2>
                      <p className="text-xs text-gray-500 mt-1">Seu pedido será enviado confidencialmente.</p>
                  </div>
                  <textarea className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 text-sm h-32 focus:ring-2 ring-purple-100 outline-none resize-none mb-4" placeholder="Escreva aqui seu pedido..."></textarea>
                  <div className="flex gap-3">
                      <button onClick={() => setShowPrayer(false)} className="flex-1 py-3 text-gray-500 font-bold text-sm bg-gray-100 rounded-xl hover:bg-gray-200 transition">Cancelar</button>
                      <button onClick={() => { alert("Pedido Enviado com Fé! 🙏"); setShowPrayer(false); }} className="flex-1 py-3 text-white font-bold text-sm bg-purple-600 rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200 transition flex justify-center items-center gap-2">
                          <Send size={16}/> Enviar
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}