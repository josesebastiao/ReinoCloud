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
  const [activeStory, setActiveStory] = useState<Post | null>(null); // Story aberto

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

  // FILTROS TIPO "REDE SOCIAL"
  const todayStr = new Date().toISOString().split('T')[0];
  
  // 1. Stories: Pega a Palavra de HOJE (24h)
  const todayDevotional = posts.find(p => p.type === 'devotional' && p.date === todayStr);
  const hasNewStory = !!todayDevotional;

  // 2. Feed: Avisos e Eventos (Timeline)
  const feed = posts.filter(p => p.type === 'notice' || p.type === 'event');

  return (
    <div className="min-h-screen bg-gray-100 pb-24 font-sans">
      
      {/* 1. CABEÇALHO COMPACTO (Instagram Style) */}
      <div className="bg-white px-4 pt-4 pb-2 sticky top-0 z-30 shadow-sm flex justify-between items-center">
          <div className="flex items-center gap-2">
              {logoUrl ? <img src={logoUrl} className="w-8 h-8 rounded-full border border-gray-200 object-contain"/> : <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white"><Building2 size={16}/></div>}
              <h1 className="font-bold text-gray-800 text-lg tracking-tight">{churchName}</h1>
          </div>
          <div className="flex gap-3">
             <button onClick={handleLogout}><LogOut size={22} className="text-gray-600"/></button>
          </div>
      </div>

      {/* 2. ÁREA DE STORIES (Carrossel Horizontal) */}
      <div className="bg-white py-4 mb-2 overflow-x-auto scrollbar-hide border-b border-gray-100">
          <div className="flex gap-4 px-4 min-w-max">
              
              {/* STORY: PALAVRA PASTORAL (Destaque) */}
              <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => hasNewStory ? setActiveStory(todayDevotional!) : alert("Nenhuma palavra nova hoje.")}>
                  <div className={`w-16 h-16 rounded-full p-[3px] ${hasNewStory ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600' : 'bg-gray-200'}`}>
                      <div className="w-full h-full bg-white rounded-full p-1">
                          <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                              <BookOpen size={24} className={hasNewStory ? "text-purple-600" : "text-gray-400"}/>
                          </div>
                      </div>
                  </div>
                  <span className="text-[10px] font-medium text-gray-700">{hasNewStory ? 'Nova Palavra' : 'Palavra'}</span>
              </div>

              {/* STORIES: ANIVERSARIANTES */}
              {birthdays.map(m => (
                  <div key={m.id} className="flex flex-col items-center gap-1">
                      <div className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-green-300 to-blue-500">
                          <div className="w-full h-full bg-white rounded-full p-1">
                              <img src={m.photoUrl || "https://ui-avatars.com/api/?name="+m.fullName} className="w-full h-full rounded-full object-cover"/>
                          </div>
                      </div>
                      <span className="text-[10px] font-medium text-gray-700 truncate w-14 text-center">{m.fullName.split(' ')[0]}</span>
                  </div>
              ))}
          </div>
      </div>

      <div className="px-4 space-y-4">
          
          {/* 3. MENU RÁPIDO (Abaixo dos Stories) */}
          <div className="grid grid-cols-3 gap-3">
              <button onClick={() => setShowCard(true)} className="bg-white p-3 rounded-2xl shadow-sm flex flex-col items-center gap-2 active:scale-95 transition">
                  <CreditCard size={24} className="text-blue-600"/>
                  <span className="text-[10px] font-bold text-gray-600">Carteirinha</span>
              </button>
              <button onClick={() => setShowFinance(true)} className="bg-white p-3 rounded-2xl shadow-sm flex flex-col items-center gap-2 active:scale-95 transition">
                  <DollarSign size={24} className="text-green-600"/>
                  <span className="text-[10px] font-bold text-gray-600">Dízimos</span>
              </button>
              <button onClick={() => setShowPrayer(true)} className="bg-white p-3 rounded-2xl shadow-sm flex flex-col items-center gap-2 active:scale-95 transition">
                  <Heart size={24} className="text-purple-600"/>
                  <span className="text-[10px] font-bold text-gray-600">Oração</span>
              </button>
          </div>

          {/* 4. ALERTA DE ESCALA (Card de Notificação) */}
          {myScales.length > 0 && (
              <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-4 text-white shadow-lg flex items-center justify-between">
                  <div>
                      <p className="text-[10px] font-bold uppercase opacity-80 mb-1">Próxima Escala</p>
                      <h3 className="font-bold text-lg">{myScales[0].event}</h3>
                      <p className="text-xs opacity-90">{new Date(myScales[0].date).toLocaleDateString('pt-BR')} • {myScales[0].obs}</p>
                  </div>
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                      <Calendar size={24}/>
                  </div>
              </div>
          )}

          {/* 5. FEED INFINITO (Timeline) */}
          <h2 className="font-bold text-gray-700 text-sm mt-4 mb-2">Mural da Igreja</h2>
          
          <div className="space-y-4">
              {feed.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl text-center shadow-sm">
                      <p className="text-gray-400 text-sm">Tudo tranquilo por aqui.</p>
                  </div>
              ) : (
                  feed.map(post => (
                      <div key={post.id} className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
                          {/* Cabeçalho do Post */}
                          <div className="p-4 flex items-center gap-3">
                              {logoUrl ? <img src={logoUrl} className="w-10 h-10 rounded-full bg-gray-100 object-contain p-1"/> : <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><Building2 size={20}/></div>}
                              <div className="flex-1">
                                  <h3 className="font-bold text-sm text-gray-900">{churchName}</h3>
                                  <p className="text-[10px] text-gray-400">{new Date(post.date).toLocaleDateString('pt-BR')} • {post.type === 'event' ? 'Evento' : 'Comunicado'}</p>
                              </div>
                              <button className="text-gray-400"><Megaphone size={16}/></button>
                          </div>

                          {/* Conteúdo do Post */}
                          <div className={`px-4 pb-4 ${post.type === 'event' ? 'bg-orange-50/30' : ''}`}>
                              <h4 className="font-bold text-gray-800 text-lg mb-2">{post.title}</h4>
                              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                          </div>

                          {/* Rodapé do Post (Like fake visual) */}
                          <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-4 text-gray-400">
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
          <div className="fixed inset-0 z-50 bg-black flex items-center justify-center animate-in fade-in duration-200">
              {/* Barra de Progresso (Visual) */}
              <div className="absolute top-0 left-0 w-full h-1 bg-white/30">
                  <div className="h-full bg-white w-full animate-[width_10s_linear]"></div>
              </div>

              <button onClick={() => setActiveStory(null)} className="absolute top-4 right-4 text-white z-50"><X size={32}/></button>
              
              <div className="w-full max-w-md h-full md:h-[80vh] bg-gradient-to-b from-purple-900 to-black md:rounded-2xl relative flex flex-col p-8 text-center justify-center text-white">
                  <BookOpen size={48} className="mx-auto text-purple-300 mb-6"/>
                  <h2 className="text-2xl font-bold mb-4">{activeStory.title}</h2>
                  <div className="overflow-y-auto max-h-[60vh] custom-scrollbar">
                      <p className="text-lg leading-relaxed opacity-90">{activeStory.content}</p>
                  </div>
                  <p className="text-xs text-purple-300 mt-8 uppercase tracking-widest">Palavra do Dia • {new Date(activeStory.date).toLocaleDateString()}</p>
              </div>
          </div>
      )}

      {/* --- OUTROS MODAIS (IGUAIS AO ANTERIOR) --- */}
      
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