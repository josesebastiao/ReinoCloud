"use client";
import { useState, useEffect } from "react";
import { useChurch } from "../contexts/ChurchContext";
import { postService, Post, Comment } from "../services/postService";
import { memberService } from "../services/memberService";
import { financeService } from "../services/financeService";
import { generalScaleService } from "../services/generalScaleService";
import { ministryService } from "../services/ministryService";
import { prayerService, PrayerRequest } from "../services/prayerService";
import { Member } from "../types/member";
import { auth } from "../lib/firebase";
import { 
  Megaphone, Calendar, BookOpen, User, Bell, 
  CreditCard, DollarSign, Heart, LogOut, X, Loader2, Send, Building2, MessageCircle, Image as ImageIcon, CalendarX, MessageSquare 
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
  const [showAvailability, setShowAvailability] = useState(false);
  const [activeStory, setActiveStory] = useState<Post | null>(null);

  // Estados Auxiliares
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [loadingCommentsId, setLoadingCommentsId] = useState<string | null>(null);
  const [expandedTexts, setExpandedTexts] = useState<Record<string, boolean>>({});
  
  // Disponibilidade
  const [unavailableDateInput, setUnavailableDateInput] = useState("");
  const [savingAvailability, setSavingAvailability] = useState(false);

  // Oração
  const [prayerText, setPrayerText] = useState("");
  const [sendingPrayer, setSendingPrayer] = useState(false);
  const [myRequests, setMyRequests] = useState<PrayerRequest[]>([]); // Lista de pedidos do usuário
  const [prayerTab, setPrayerTab] = useState<'new' | 'list'>('new'); // Abas do modal

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

            // BUSCA ESCALAS
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

            const ministries = await ministryService.listByChurch(churchId);
            ministries.forEach((min: any) => {
                if (min.scales) {
                    min.scales.forEach((scale: any) => {
                        const memberInScale = Object.values(scale.people || {}).some((personName: any) => personName === me.fullName);
                        if (memberInScale) {
                             const role = Object.entries(scale.people).find(([key, val]) => val === me.fullName)?.[0] || "Escalado";
                             scalesFound.push({
                                 date: scale.date,
                                 event: min.name,
                                 obs: `${scale.title} - ${role}`
                             });
                        }
                    });
                }
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

  const handleLogout = () => { auth.signOut(); window.location.href = "/login"; };
  
  const getFirstName = () => {
      if (memberData?.fullName) return memberData.fullName.split(' ')[0];
      if (userName) return userName.split(' ')[0];
      return "Irmão(ã)";
  };

  const getImageUrl = (url?: string) => {
      if (!url) return null;
      if (url.includes('drive.google.com') && url.includes('/file/d/')) {
          const id = url.split('/file/d/')[1].split('/')[0];
          return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
      }
      return url;
  };

  // --- INTERAÇÕES ---
  const handleLike = async (post: Post) => {
      if (!user?.uid || !post.id) return;
      const isLiked = post.likes?.includes(user.uid) || false;
      const updatedPosts = posts.map(p => {
          if (p.id === post.id) {
              const newLikes = isLiked ? (p.likes || []).filter(id => id !== user.uid) : [...(p.likes || []), user.uid];
              return { ...p, likes: newLikes };
          }
          return p;
      });
      setPosts(updatedPosts);
      await postService.toggleLike(post.id, user.uid, isLiked);
  };

  const toggleComments = async (postId: string) => {
      if (expandedPostId === postId) { setExpandedPostId(null); return; }
      setExpandedPostId(postId);
      if (!postComments[postId]) {
          setLoadingCommentsId(postId);
          const comments = await postService.getComments(postId);
          setPostComments(prev => ({ ...prev, [postId]: comments }));
          setLoadingCommentsId(null);
      }
  };

  const handleInputChange = (postId: string, text: string) => setCommentInputs(prev => ({ ...prev, [postId]: text }));

  const handleSendComment = async (postId: string) => {
      const text = commentInputs[postId];
      if (!postId || !text?.trim() || !user?.uid) return;
      const newComment: Comment = { userId: user.uid, userName: getFirstName(), userPhoto: memberData?.photoUrl || "", content: text, createdAt: new Date() };
      setPostComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), newComment] }));
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
      await postService.addComment(postId, newComment);
  };

  const toggleText = (postId: string) => setExpandedTexts(prev => ({ ...prev, [postId]: !prev[postId] }));

  // --- ORAÇÃO ---
  const handleOpenPrayer = async () => {
      setShowPrayer(true);
      if (user?.uid) {
          const myReqs = await prayerService.listByUser(user.uid);
          setMyRequests(myReqs);
      }
  };

  const handleSendPrayer = async () => {
    if (!prayerText.trim() || !user?.uid || !churchId) return;
    setSendingPrayer(true);
    try {
        await prayerService.create({
            churchId,
            userId: user.uid,
            userName: memberData?.fullName || getFirstName(),
            userPhoto: memberData?.photoUrl,
            content: prayerText,
            status: 'pending',
            createdAt: new Date()
        });
        alert("Seu pedido foi enviado ao Pastor! 🙏");
        setPrayerText("");
        setPrayerTab('list'); // Vai para a lista para ver o novo pedido
        const myReqs = await prayerService.listByUser(user.uid); // Recarrega
        setMyRequests(myReqs);
    } catch (error) {
        alert("Erro ao enviar.");
    } finally {
        setSendingPrayer(false);
    }
  };

  // --- DISPONIBILIDADE ---
  const handleAddUnavailableDate = async () => {
      if (!unavailableDateInput || !memberData?.id) return;
      setSavingAvailability(true);
      try {
          const currentDates = memberData.unavailableDates || [];
          if (!currentDates.includes(unavailableDateInput)) {
              const newDates = [...currentDates, unavailableDateInput].sort();
              await memberService.update(memberData.id, { unavailableDates: newDates });
              setMemberData({ ...memberData, unavailableDates: newDates });
          }
          setUnavailableDateInput("");
      } catch (e) { alert("Erro ao salvar."); } finally { setSavingAvailability(false); }
  };

  const handleRemoveUnavailableDate = async (dateToRemove: string) => {
      if (!memberData?.id) return;
      if (!confirm("Tornar esta data disponível novamente?")) return;
      try {
          const newDates = (memberData.unavailableDates || []).filter(d => d !== dateToRemove);
          await memberService.update(memberData.id, { unavailableDates: newDates });
          setMemberData({ ...memberData, unavailableDates: newDates });
      } catch (e) { alert("Erro ao remover."); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600"/></div>;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayDevotional = posts.find(p => p.type === 'devotional' && p.date === todayStr);
  const hasNewStory = !!todayDevotional;
  
  const feed = posts.filter(p => {
      const pDate = new Date(p.date + 'T00:00:00');
      const today = new Date(); today.setHours(0,0,0,0);
      return pDate >= today;
  });

  const hasRecentPosts = posts.some(p => { const d = new Date(p.date); const t = new Date(); t.setDate(t.getDate()-2); return d > t; });

  return (
    <div className="min-h-screen bg-gray-100 pb-24 font-sans">
      
      {/* 1. CABEÇALHO */}
      <div className="bg-blue-600 pt-8 pb-16 px-6 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                      {logoUrl ? <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain bg-white/20 rounded-lg p-1 backdrop-blur-sm" /> : <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white"><Building2 size={18}/></div>}
                      <h1 className="text-white font-bold text-sm opacity-90 tracking-wide">{churchName}</h1>
                  </div>
                  <div className="flex items-center gap-3">
                      <button className="bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition relative">
                          <Bell size={20}/>
                          {hasRecentPosts && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-blue-600 rounded-full"></span>}
                      </button>
                      <button onClick={handleLogout} className="bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition"><LogOut size={20}/></button>
                  </div>
              </div>
              <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full border-4 border-white/20 overflow-hidden bg-white/10 backdrop-blur-sm shadow-md">
                      {memberData?.photoUrl ? <img src={memberData.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white"><User size={32}/></div>}
                  </div>
                  <div>
                      <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-0.5">Bem-vindo(a)</p>
                      <h2 className="text-2xl font-bold text-white">{getFirstName()}</h2>
                  </div>
              </div>
          </div>
      </div>

      <div className="px-4 -mt-8 relative z-20 space-y-6">
          
          {/* STORIES */}
          <div className="bg-white py-4 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 px-4 min-w-max">
                  <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => hasNewStory ? setActiveStory(todayDevotional!) : alert("Nenhuma palavra nova hoje.")}>
                      <div className={`w-14 h-14 rounded-full p-[2px] ${hasNewStory ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600' : 'bg-gray-200'}`}>
                          <div className="w-full h-full bg-white rounded-full p-0.5"><div className="w-full h-full bg-gray-50 rounded-full flex items-center justify-center overflow-hidden"><BookOpen size={20} className={hasNewStory ? "text-purple-600" : "text-gray-400"}/></div></div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-600">{hasNewStory ? 'Nova Palavra' : 'Palavra'}</span>
                  </div>
                  {birthdays.map(m => (
                      <div key={m.id} className="flex flex-col items-center gap-1">
                          <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-green-300 to-blue-500"><div className="w-full h-full bg-white rounded-full p-0.5"><img src={m.photoUrl || "https://ui-avatars.com/api/?name="+m.fullName} className="w-full h-full rounded-full object-cover"/></div></div>
                          <span className="text-[10px] font-medium text-gray-600 truncate w-14 text-center">{m.fullName.split(' ')[0]}</span>
                      </div>
                  ))}
              </div>
          </div>

          {/* MENU RÁPIDO */}
          <div className="grid grid-cols-4 gap-2">
              <button onClick={() => setShowCard(true)} className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-1 active:scale-95 transition">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><CreditCard size={16}/></div>
                  <span className="text-[9px] font-bold text-gray-600 text-center">Cartão</span>
              </button>
              <button onClick={() => setShowFinance(true)} className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-1 active:scale-95 transition">
                  <div className="w-8 h-8 bg-green-50 text-green-600 rounded-full flex items-center justify-center"><DollarSign size={16}/></div>
                  <span className="text-[9px] font-bold text-gray-600 text-center">Dízimos</span>
              </button>
              {/* Chama a função de abrir com carregar lista */}
              <button onClick={handleOpenPrayer} className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-1 active:scale-95 transition">
                  <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center"><Heart size={16}/></div>
                  <span className="text-[9px] font-bold text-gray-600 text-center">Oração</span>
              </button>
              <button onClick={() => setShowAvailability(true)} className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-1 active:scale-95 transition">
                  <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center"><CalendarX size={16}/></div>
                  <span className="text-[9px] font-bold text-gray-600 text-center">Indisponível</span>
              </button>
          </div>

          {/* ALERTA DE ESCALA */}
          {myScales.length > 0 && myScales.map((scale: any, idx: number) => (
              <div key={idx} className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-3xl p-5 text-white shadow-lg flex items-center justify-between relative overflow-hidden animate-in slide-in-from-bottom-2">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-white opacity-10 rounded-full"></div>
                  <div>
                      <p className="text-[10px] font-bold uppercase opacity-80 mb-1">Você foi escalado!</p>
                      <h3 className="font-bold text-lg">{scale.event}</h3>
                      <p className="text-xs opacity-90 mt-1 flex items-center gap-1"><Calendar size={12}/> {new Date(scale.date).toLocaleDateString('pt-BR')} • {scale.obs}</p>
                  </div>
              </div>
          ))}

          {/* FEED INFINITO */}
          <h2 className="font-bold text-gray-700 text-sm mt-4 mb-2 flex items-center gap-2"><Megaphone size={16} className="text-blue-600"/> Mural da Igreja</h2>
          <div className="space-y-4">
              {feed.length === 0 ? <div className="bg-white p-8 rounded-2xl text-center shadow-sm border border-dashed border-gray-200"><p className="text-gray-400 text-sm">Tudo tranquilo por aqui.</p></div> : feed.map(post => {
                  const isLiked = post.likes?.includes(user?.uid || "");
                  const likeCount = post.likes?.length || 0;
                  const isExpanded = expandedPostId === post.id;
                  const currentComments = postComments[post.id!] || [];
                  const isTextExpanded = expandedTexts[post.id!] || false;
                  const textLimit = 150;
                  const shouldTruncate = post.content.length > textLimit;
                  const displayedContent = isTextExpanded || !shouldTruncate ? post.content : post.content.slice(0, textLimit) + "...";

                  return (
                      <div key={post.id} className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
                          <div className="p-4 flex items-center gap-3 border-b border-gray-50">
                              {logoUrl ? <img src={logoUrl} className="w-10 h-10 rounded-full bg-gray-50 object-contain p-1 border border-gray-100"/> : <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><Building2 size={20}/></div>}
                              <div className="flex-1">
                                  <h3 className="font-bold text-sm text-gray-900">{churchName}</h3>
                                  <p className="text-[10px] text-gray-400">{new Date(post.date).toLocaleDateString('pt-BR')} • {post.type === 'event' ? 'Evento' : post.type === 'devotional' ? 'Palavra' : 'Comunicado'}</p>
                              </div>
                          </div>
                          {post.imageUrl && (
                              <div className="w-full bg-gray-100 flex justify-center items-center max-h-[500px] overflow-hidden">
                                  <img src={getImageUrl(post.imageUrl)!} className="w-full h-auto max-h-[500px] object-contain" alt="Post"/>
                              </div>
                          )}
                          <div className={`px-5 py-4 ${post.type === 'devotional' ? 'bg-purple-50/30' : post.type === 'event' ? 'bg-orange-50/30' : ''}`}>
                              <h4 className="font-bold text-gray-800 text-lg mb-2">{post.title}</h4>
                              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                  {displayedContent}
                                  {shouldTruncate && (
                                      <button onClick={() => toggleText(post.id!)} className="text-blue-600 font-bold ml-1 hover:underline text-xs">
                                          {isTextExpanded ? "Ver menos" : "Ver mais"}
                                      </button>
                                  )}
                              </p>
                          </div>
                          <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-6 text-gray-500 bg-gray-50/50">
                              <button onClick={() => handleLike(post)} className={`flex items-center gap-1.5 transition ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}><Heart size={20} fill={isLiked ? "currentColor" : "none"}/><span className="text-xs font-bold">{likeCount > 0 ? likeCount : 'Curtir'}</span></button>
                              <button onClick={() => toggleComments(post.id!)} className={`flex items-center gap-1.5 transition ${isExpanded ? 'text-blue-600' : 'hover:text-blue-500'}`}><MessageCircle size={20}/><span className="text-xs font-bold">Comentar</span></button>
                          </div>
                          {isExpanded && (
                              <div className="bg-gray-50 border-t border-gray-100 p-4 animate-in slide-in-from-top-2">
                                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                                      {loadingCommentsId === post.id ? <div className="text-center py-2"><Loader2 className="animate-spin w-4 h-4 mx-auto text-gray-400"/></div> : currentComments.length === 0 ? <p className="text-xs text-gray-400 text-center italic">Seja o primeiro a comentar.</p> : currentComments.map((c, idx) => (<div key={idx} className="flex gap-2"><div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0 mt-1">{c.userPhoto ? <img src={c.userPhoto} className="w-full h-full object-cover"/> : <User size={14} className="w-full h-full p-1.5 text-gray-400"/>}</div><div className="bg-white p-2.5 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 flex-1"><p className="text-[10px] font-bold text-gray-800 mb-0.5">{c.userName}</p><p className="text-xs text-gray-600 leading-relaxed">{c.content}</p></div></div>))}
                                  </div>
                                  <div className="flex gap-2 items-center">
                                      <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">{memberData?.photoUrl ? <img src={memberData.photoUrl} className="w-full h-full object-cover"/> : <User size={14} className="w-full h-full p-1.5 text-gray-400"/>}</div>
                                      <div className="flex-1 relative">
                                          <input type="text" value={commentInputs[post.id!] || ""} onChange={(e) => handleInputChange(post.id!, e.target.value)} placeholder="Escreva um comentário..." className="w-full bg-white border border-gray-200 rounded-full py-2 px-4 text-xs focus:ring-1 ring-blue-300 outline-none pr-10"/>
                                          <button onClick={() => handleSendComment(post.id!)} disabled={!commentInputs[post.id!]?.trim()} className="absolute right-1 top-1 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"><Send size={12}/></button>
                                      </div>
                                  </div>
                              </div>
                          )}
                      </div>
                  )
              })}
          </div>
      </div>

      {/* --- MODAIS --- */}
      {/* 4. DISPONIBILIDADE */}
      {showAvailability && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in-95">
              <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><CalendarX className="text-orange-500"/> Minhas Indisponibilidades</h2>
                      <button onClick={() => setShowAvailability(false)} className="bg-gray-100 p-2 rounded-full"><X size={18}/></button>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">Marque os dias que você NÃO poderá ser escalado.</p>
                  <div className="flex gap-2 mb-4">
                      <input type="date" value={unavailableDateInput} onChange={e => setUnavailableDateInput(e.target.value)} className="flex-1 p-2 border rounded-xl text-sm outline-none focus:ring-2 ring-orange-200"/>
                      <button onClick={handleAddUnavailableDate} disabled={savingAvailability || !unavailableDateInput} className="bg-orange-500 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-orange-600 transition flex items-center justify-center">{savingAvailability ? <Loader2 className="animate-spin" size={16}/> : "Adicionar"}</button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                      {(!memberData?.unavailableDates || memberData.unavailableDates.length === 0) && <p className="text-center text-xs text-gray-400 py-4">Nenhuma data marcada.</p>}
                      {memberData?.unavailableDates?.map((date, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                              <span className="text-sm font-bold text-gray-700">{new Date(date).toLocaleDateString('pt-BR')}</span>
                              <button onClick={() => handleRemoveUnavailableDate(date)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"><X size={14}/></button>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* 3. ORAÇÃO (COM ABAS DE HISTÓRICO) */}
      {showPrayer && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 h-[500px] flex flex-col">
                  {/* Cabeçalho do Modal */}
                  <div className="bg-purple-600 p-6 text-white text-center">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm"><Heart size={24}/></div>
                      <h2 className="text-xl font-bold">Pedidos de Oração</h2>
                      
                      <div className="flex gap-2 mt-4 bg-purple-800/30 p-1 rounded-xl">
                          <button onClick={() => setPrayerTab('new')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${prayerTab === 'new' ? 'bg-white text-purple-700 shadow-sm' : 'text-purple-200 hover:text-white'}`}>Novo Pedido</button>
                          <button onClick={() => setPrayerTab('list')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${prayerTab === 'list' ? 'bg-white text-purple-700 shadow-sm' : 'text-purple-200 hover:text-white'}`}>Meus Pedidos</button>
                      </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
                      {prayerTab === 'new' ? (
                          <div className="h-full flex flex-col">
                              <p className="text-xs text-gray-500 mb-2 text-center">Seu pedido será enviado confidencialmente ao Pastor.</p>
                              <textarea value={prayerText} onChange={(e) => setPrayerText(e.target.value)} className="flex-1 w-full p-4 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 ring-purple-100 outline-none resize-none mb-4" placeholder="Escreva aqui seu pedido..."></textarea>
                              <div className="flex gap-3">
                                  <button onClick={() => setShowPrayer(false)} className="flex-1 py-3 text-gray-500 font-bold text-sm bg-gray-200 rounded-xl hover:bg-gray-300 transition">Cancelar</button>
                                  <button onClick={handleSendPrayer} disabled={sendingPrayer || !prayerText.trim()} className="flex-1 py-3 text-white font-bold text-sm bg-purple-600 rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200 transition flex justify-center items-center gap-2">{sendingPrayer ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>} Enviar</button>
                              </div>
                          </div>
                      ) : (
                          <div className="space-y-3">
                              {myRequests.length === 0 ? (
                                  <div className="text-center py-10 text-gray-400">
                                      <MessageSquare size={32} className="mx-auto mb-2 opacity-20"/>
                                      <p className="text-xs">Nenhum pedido anterior.</p>
                                  </div>
                              ) : (
                                  myRequests.map(req => (
                                      <div key={req.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                          <div className="flex justify-between items-start mb-2">
                                              <span className="text-[10px] text-gray-400 uppercase font-bold">{new Date(req.createdAt.seconds * 1000).toLocaleDateString()}</span>
                                              {req.status === 'prayed' && <span className="bg-green-100 text-green-700 text-[9px] px-2 py-0.5 rounded font-bold uppercase">Orado</span>}
                                          </div>
                                          <p className="text-sm text-gray-700 mb-3">"{req.content}"</p>
                                          
                                          {req.response && (
                                              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                                                  <p className="text-[10px] text-purple-700 font-bold uppercase mb-1 flex items-center gap-1"><MessageCircle size={10}/> Resposta do Pastor</p>
                                                  <p className="text-xs text-gray-600 italic">"{req.response}"</p>
                                              </div>
                                          )}
                                      </div>
                                  ))
                              )}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* 1. CARTEIRINHA DIGITAL */}
      {showCard && memberData && (<div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in"><div className="w-full max-w-sm relative"><button onClick={() => setShowCard(false)} className="absolute -top-10 right-0 text-white font-bold flex items-center gap-1 text-sm bg-white/20 px-3 py-1 rounded-full"><X size={14}/> Fechar</button><div className="bg-white rounded-2xl overflow-hidden shadow-2xl transform transition-all hover:scale-[1.02] duration-500"><div className="bg-gradient-to-br from-blue-800 to-blue-900 p-6 text-white relative h-[180px] flex flex-col justify-between"><div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div><div className="flex justify-between items-start relative z-10">{logoUrl && <img src={logoUrl} className="h-8 object-contain brightness-0 invert opacity-80" />}<div className="bg-white/20 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest backdrop-blur-sm">Membro</div></div><div className="flex items-center gap-4 relative z-10"><div className="w-16 h-16 rounded-full border-2 border-white/50 bg-gray-300 overflow-hidden shadow-lg">{memberData.photoUrl ? <img src={memberData.photoUrl} className="w-full h-full object-cover"/> : <div className="flex items-center justify-center h-full text-xl text-gray-500">👤</div>}</div><div><h2 className="text-lg font-bold leading-tight uppercase">{memberData.fullName}</h2><p className="text-[10px] text-blue-200 mt-0.5 uppercase tracking-wide">{churchName}</p></div></div></div><div className="bg-white p-6"><div className="grid grid-cols-2 gap-4 text-xs mb-4"><div><p className="text-gray-400 font-bold uppercase text-[9px]">Membro Desde</p><p className="font-bold text-gray-800">{memberData.baptismDate ? new Date(memberData.baptismDate).toLocaleDateString() : '---'}</p></div><div><p className="text-gray-400 font-bold uppercase text-[9px]">Nascimento</p><p className="font-bold text-gray-800">{memberData.birthDate ? new Date(memberData.birthDate).toLocaleDateString() : '---'}</p></div></div><div className="pt-4 border-t border-dashed border-gray-200 text-center"><div className="h-6"></div><div className="border-t border-gray-400 w-2/3 mx-auto"></div><p className="text-[8px] font-bold text-gray-400 mt-1 uppercase">Pastor Presidente</p></div></div></div></div></div>)}

      {/* 2. EXTRATO DE DÍZIMOS */}
      {showFinance && (<div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-in slide-in-from-bottom-10"><div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 h-[80vh] flex flex-col shadow-2xl"><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><DollarSign className="text-green-600"/> Meus Dízimos</h2><button onClick={() => setShowFinance(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition"><X size={20}/></button></div><div className="bg-green-50 p-6 rounded-2xl mb-4 text-center border border-green-100"><p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Total Contribuído</p><p className="text-4xl font-black text-green-700 tracking-tight">{formatMoney(myContributions.reduce((acc, curr) => acc + Number(curr.amount), 0))}</p></div><div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">{myContributions.length === 0 ? <div className="text-center py-12 text-gray-400"><DollarSign size={40} className="mx-auto mb-2 opacity-20"/><p className="text-sm">Nenhuma contribuição.</p></div> : myContributions.map(t => (<div key={t.id} className="flex justify-between items-center p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition rounded-lg"><div><p className="text-sm font-bold text-gray-700">{t.category}</p><p className="text-[10px] text-gray-400 font-medium uppercase">{new Date(t.date).toLocaleDateString('pt-BR', {weekday: 'short', day:'2-digit', month:'short'})}</p></div><span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded text-sm">{formatMoney(t.amount)}</span></div>))}</div></div></div>)}

      {/* STORY MODAL */}
      {activeStory && (<div className="fixed inset-0 z-50 bg-black flex items-center justify-center animate-in fade-in duration-300"><div className="absolute top-0 left-0 w-full h-1.5 bg-gray-800 z-50"><div className="h-full bg-white w-full animate-[width_10s_linear]"></div></div><button onClick={() => setActiveStory(null)} className="absolute top-6 right-6 text-white z-50 bg-white/20 p-2 rounded-full"><X size={24}/></button><div className="w-full max-w-md h-full bg-gradient-to-b from-purple-900 to-black md:rounded-2xl relative flex flex-col p-8 text-center justify-center text-white">{activeStory.imageUrl ? <img src={getImageUrl(activeStory.imageUrl)!} className="w-full h-64 object-cover rounded-xl mb-6 shadow-2xl border-2 border-white/20"/> : <BookOpen size={48} className="mx-auto text-purple-300 mb-6 animate-bounce"/>}<h2 className="text-2xl font-bold mb-6 leading-tight">{activeStory.title}</h2><div className="overflow-y-auto max-h-[40vh] custom-scrollbar text-lg leading-relaxed opacity-90 text-justify">{activeStory.content}</div></div></div>)}

    </div>
  );
}