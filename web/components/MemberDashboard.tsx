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
  Megaphone, Calendar, Gift, BookOpen, User, Bell, 
  CreditCard, DollarSign, Heart, LogOut, X, Loader2, Send, Building2, ChevronRight 
} from "lucide-react";

export function MemberDashboard() {
  const { churchId, churchName, logoUrl, user, userName, formatMoney } = useChurch();
  
  const [loading, setLoading] = useState(true);
  const [memberData, setMemberData] = useState<Member | null>(null);
  
  // DADOS
  const [posts, setPosts] = useState<Post[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [myScales, setMyScales] = useState<any[]>([]);
  const [myContributions, setMyContributions] = useState<any[]>([]);

  // MODAIS
  const [showCard, setShowCard] = useState(false);
  const [showFinance, setShowFinance] = useState(false);
  const [showPrayer, setShowPrayer] = useState(false);
  
  // STORIES MODE
  const [activeStory, setActiveStory] = useState<Post | null>(null);

  useEffect(() => {
    if (churchId && user?.email) {
        loadData();
    }
  }, [churchId, user]);

  const loadData = async () => {
    if (!churchId) return;
    setLoading(true);
    try {
        const allMembers = await memberService.listByChurch(churchId);
        const me = allMembers.find(m => m.email === user?.email);
        
        if (me) {
            setMemberData(me);
            if (me.id) {
                const allTrans = await financeService.listByChurch(churchId);
                const mine = allTrans.filter(t => t.memberId === me.id && t.type === 'income');
                setMyContributions(mine);
            }
            // Escalas
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

    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleLogout = () => {
      auth.signOut();
      window.location.href = "/login";
  };

  const getFirstName = () => {
      if (memberData?.fullName) return memberData.fullName.split(' ')[0];
      if (userName) return userName.split(' ')[0];
      return "Irmão(ã)";
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600"/></div>;

  // LÓGICA DE STORIES E FEED
  const todayStr = new Date().toISOString().split('T')[0];
  const todayDevotional = posts.find(p => p.type === 'devotional' && p.date === todayStr);
  const hasNewStory = !!todayDevotional;
  const feed = posts.filter(p => p.type === 'notice' || p.type === 'event');

  // LÓGICA DE NOTIFICAÇÃO (Simples: se tiver post nos últimos 2 dias)
  const hasRecentPosts = posts.some(p => {
      const postDate = new Date(p.date);
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      return postDate > twoDaysAgo;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* 1. CABEÇALHO AZUL (Estilo Original + Sininho) */}
      <div className="bg-blue-600 pt-8 pb-16 px-6 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          
          <div className="relative z-10">
              {/* Linha Superior: Igreja + Ações */}
              <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                      {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain bg-white/20 rounded-lg p-1 backdrop-blur-sm" />
                      ) : (
                          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white"><Building2 size={18}/></div>
                      )}
                      <h1 className="text-white font-bold text-sm opacity-90 tracking-wide">{churchName}</h1>
                  </div>
                  
                  <div className="flex items-center gap-3">
                      {/* Sininho com Notificação */}
                      <button className="bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition relative">
                          <Bell size={20}/>
                          {hasRecentPosts && (
                              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-blue-600 rounded-full"></span>
                          )}
                      </button>
                      <button onClick={handleLogout} className="bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition">
                          <LogOut size={20}/>
                      </button>
                  </div>
              </div>

              {/* Linha Inferior: Perfil do Usuário */}
              <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full border-4 border-white/20 overflow-hidden bg-white/10 backdrop-blur-sm shadow-md">
                      {memberData?.photoUrl ? (
                          <img src={memberData.photoUrl} className="w-full h-full object-cover" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-white"><User size={32}/></div>
                      )}
                  </div>
                  <div>
                      <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-0.5">Bem-vindo(a)</p>
                      <h2 className="text-2xl font-bold text-white">{getFirstName()}</h2>
                  </div>
              </div>
          </div>
      </div>

      <div className="px-4 -mt-8 relative z-20 space-y-6">
          
          {/* 2. ÁREA DE STORIES (Carrossel dentro de card branco) */}
          <div className="bg-white py-4 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 px-4 min-w-max">
                  {/* STORY: PALAVRA PASTORAL */}
                  <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => hasNewStory ? setActiveStory(todayDevotional!) : alert("Nenhuma palavra nova hoje.")}>
                      <div className={`w-14 h-14 rounded-full p-[2px] ${hasNewStory ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600' : 'bg-gray-200'}`}>
                          <div className="w-full h-full bg-white rounded-full p-0.5">
                              <div className="w-full h-full bg-gray-50 rounded-full flex items-center justify-center overflow-hidden">
                                  <BookOpen size={20} className={hasNewStory ? "text-purple-600" : "text-gray-400"}/>
                              </div>
                          </div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-600">{hasNewStory ? 'Nova Palavra' : 'Palavra'}</span>
                  </div>

                  {/* STORIES: ANIVERSARIANTES */}
                  {birthdays.map(m => (
                      <div key={m.id} className="flex flex-col items-center gap-1">
                          <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-green-300 to-blue-500">
                              <div className="w-full h-full bg-white rounded-full p-0.5">
                                  <img src={m.photoUrl || "https://ui-avatars.com/api/?name="+m.fullName} className="w-full h-full rounded-full object-cover"/>
                              </div>
                          </div>
                          <span className="text-[10px] font-medium text-gray-600 truncate w-14 text-center">{m.fullName.split(' ')[0]}</span>
                      </div>
                  ))}
              </div>
          </div>

          {/* 3. MENU DE AÇÕES RÁPIDAS (ATUALIZADO) */}
          <div className="grid grid-cols-3 gap-3">
              <button onClick={() => setShowCard(true)} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><CreditCard size={20}/></div>
                  <span className="text-[10px] font-bold text-gray-600 text-center">Cartão de Membro</span>
              </button>
              <button onClick={() => setShowFinance(true)} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition">
                  <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center"><DollarSign size={20}/></div>
                  <span className="text-[10px] font-bold text-gray-600 text-center">Meus Dízimos</span>
              </button>
              <button onClick={() => setShowPrayer(true)} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition">
                  <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center"><Heart size={20}/></div>
                  <span className="text-[10px] font-bold text-gray-600 text-center">Oração</span>
              </button>
          </div>

          {/* 4. ALERTA DE ESCALA */}
          {myScales.length > 0 && (
              <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-3xl p-5 text-white shadow-lg flex items-center justify-between relative overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-white opacity-10 rounded-full"></div>
                  <div>
                      <p className="text-[10px] font-bold uppercase opacity-80 mb-1">Próxima Escala</p>
                      <h3 className="font-bold text-lg">{myScales[0].event}</h3>
                      <p className="text-xs opacity-90 mt-1 flex items-center gap-1"><Calendar size={12}/> {new Date(myScales[0].date).toLocaleDateString('pt-BR')} • {myScales[0].obs}</p>
                  </div>
              </div>
          )}

          {/* 5. FEED INFINITO */}
          <h2 className="font-bold text-gray-700 text-sm mt-4 mb-2 flex items-center gap-2">
              <Megaphone size={16} className="text-blue-600"/> Mural da Igreja
          </h2>
          
          <div className="space-y-4">
              {feed.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl text-center shadow-sm border border-dashed border-gray-200">
                      <p className="text-gray-400 text-sm">Tudo tranquilo por aqui.</p>
                  </div>
              ) : (
                  feed.map(post => (
                      <div key={post.id} className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
                          <div className="p-4 flex items-center gap-3 border-b border-gray-50">
                              {logoUrl ? <img src={logoUrl} className="w-10 h-10 rounded-full bg-gray-50 object-contain p-1 border border-gray-100"/> : <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><Building2 size={20}/></div>}
                              <div className="flex-1">
                                  <h3 className="font-bold text-sm text-gray-900">{churchName}</h3>
                                  <p className="text-[10px] text-gray-400">{new Date(post.date).toLocaleDateString('pt-BR')} • {post.type === 'event' ? 'Evento' : 'Comunicado'}</p>
                              </div>
                          </div>
                          <div className={`px-5 py-4 ${post.type === 'event' ? 'bg-orange-50/30' : ''}`}>
                              <h4 className="font-bold text-gray-800 text-lg mb-2">{post.title}</h4>
                              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                          </div>
                          <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-4 text-gray-400 bg-gray-50/50">
                              <Heart size={20} className="hover:text-red-500 cursor-pointer transition"/>
                              <Send size={20} className="hover:text-blue-500 cursor-pointer transition"/>
                          </div>
                      </div>
                  ))
              )}
          </div>

      </div>

      {/* --- MODAL VIEW STORY (PALAVRA PASTORAL) --- */}
      {activeStory && (
          <div className="fixed inset-0 z-50 bg-black flex items-center justify-center animate-in fade-in duration-300">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-800 z-50">
                  <div className="h-full bg-white w-full animate-[width_10s_linear]"></div>
              </div>
              <button onClick={() => setActiveStory(null)} className="absolute top-6 right-6 text-white z-50 bg-white/20 p-2 rounded-full"><X size={24}/></button>
              <div className="w-full max-w-md h-full bg-gradient-to-b from-purple-900 to-black md:rounded-2xl relative flex flex-col p-8 text-center justify-center text-white">
                  <BookOpen size={48} className="mx-auto text-purple-300 mb-6 animate-bounce"/>
                  <h2 className="text-2xl font-bold mb-6 leading-tight">{activeStory.title}</h2>
                  <div className="overflow-y-auto max-h-[60vh] custom-scrollbar text-lg leading-relaxed opacity-90 text-justify">
                      {activeStory.content}
                  </div>
                  <div className="mt-8 pt-4 border-t border-white/20">
                      <p className="text-xs text-purple-300 uppercase tracking-widest">Palavra do Dia</p>
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(activeStory.date).toLocaleDateString()}</p>
                  </div>
              </div>
          </div>
      )}

      {/* 1. CARTEIRINHA DIGITAL */}
      {showCard && memberData && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-sm relative">
                <button onClick={() => setShowCard(false)} className="absolute -top-12 right-0 text-white font-bold flex items-center gap-1"><X/> Fechar</button>
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
                      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><DollarSign className="text-green-600"/> Meus Dízimos</h2>
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