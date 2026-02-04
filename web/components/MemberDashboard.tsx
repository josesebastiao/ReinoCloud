"use client";
import { useState, useEffect } from "react";
import { useChurch } from "../contexts/ChurchContext";
import { postService, Post, Comment } from "../services/postService";
import { memberService } from "../services/memberService";
import { financeService } from "../services/financeService";
import { generalScaleService } from "../services/generalScaleService";
import { prayerService } from "../services/prayerService";
import { Member } from "../types/member";
import { auth } from "../lib/firebase";
import { 
  Megaphone, Calendar, BookOpen, User, Bell, 
  CreditCard, DollarSign, Heart, LogOut, X, Loader2, Send, Building2, MessageCircle, Image as ImageIcon 
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
  const [activeStory, setActiveStory] = useState<Post | null>(null);

  // ESTADOS NOVOS
  const [prayerText, setPrayerText] = useState("");
  const [sendingPrayer, setSendingPrayer] = useState(false);
  
  // Comentários e "Ver Mais"
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [loadingCommentsId, setLoadingCommentsId] = useState<string | null>(null);
  const [expandedTexts, setExpandedTexts] = useState<Record<string, boolean>>({}); // Controla o "Ver mais"

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

  // --- LIKE ---
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

  // --- COMENTÁRIOS ---
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
      const newComment: Comment = {
          userId: user.uid,
          userName: getFirstName(),
          userPhoto: memberData?.photoUrl || "",
          content: text,
          createdAt: new Date()
      };
      setPostComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), newComment] }));
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
      await postService.addComment(postId, newComment);
  };

  // --- ORAÇÃO ---
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
        setShowPrayer(false);
    } catch (error) {
        console.error(error);
        alert("Erro ao enviar.");
    } finally {
        setSendingPrayer(false);
    }
  };

  // --- "VER MAIS" ---
  const toggleText = (postId: string) => {
      setExpandedTexts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600"/></div>;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayDevotional = posts.find(p => p.type === 'devotional' && p.date === todayStr);
  const hasNewStory = !!todayDevotional;

  // *** FILTRO DO FEED (REGRA DE VALIDADE) ***
  const feed = posts.filter(p => {
      // Data do post normalizada (sem hora)
      const postDate = new Date(p.date + 'T00:00:00'); // Garante fuso local ou UTC consistente
      const today = new Date();
      today.setHours(0,0,0,0);

      // Se for Evento: Mostra até a data passar (>= hoje)
      if (p.type === 'event') return postDate >= today;

      // Se for Aviso ou Palavra: Mostra apenas se for de hoje ou futuro (Regra 24h/Recente)
      return postDate >= today;
  });

  const hasRecentPosts = posts.some(p => {
      const postDate = new Date(p.date);
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      return postDate > twoDaysAgo;
  });

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
                          <div className="w-full h-full bg-white rounded-full p-0.5">
                              <div className="w-full h-full bg-gray-50 rounded-full flex items-center justify-center overflow-hidden">
                                  <BookOpen size={20} className={hasNewStory ? "text-purple-600" : "text-gray-400"}/>
                              </div>
                          </div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-600">{hasNewStory ? 'Nova Palavra' : 'Palavra'}</span>
                  </div>
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

          {/* MENU RÁPIDO */}
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

          {/* ALERTA DE ESCALA */}
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

          {/* FEED INFINITO */}
          <h2 className="font-bold text-gray-700 text-sm mt-4 mb-2 flex items-center gap-2"><Megaphone size={16} className="text-blue-600"/> Mural da Igreja</h2>
          <div className="space-y-4">
              {feed.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl text-center shadow-sm border border-dashed border-gray-200"><p className="text-gray-400 text-sm">Nenhum aviso recente.</p></div>
              ) : (
                  feed.map(post => {
                      const isLiked = post.likes?.includes(user?.uid || "");
                      const likeCount = post.likes?.length || 0;
                      const isExpanded = expandedPostId === post.id;
                      const currentComments = postComments[post.id!] || [];
                      
                      // TRUNCAR TEXTO (VER MAIS)
                      const isTextExpanded = expandedTexts[post.id!] || false;
                      const textLimit = 150; // Limite de caracteres
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
                                  <button onClick={() => handleLike(post)} className={`flex items-center gap-1.5 transition ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}>
                                      <Heart size={20} fill={isLiked ? "currentColor" : "none"}/>
                                      <span className="text-xs font-bold">{likeCount > 0 ? likeCount : 'Curtir'}</span>
                                  </button>
                                  <button onClick={() => toggleComments(post.id!)} className={`flex items-center gap-1.5 transition ${isExpanded ? 'text-blue-600' : 'hover:text-blue-500'}`}>
                                      <MessageCircle size={20}/>
                                      <span className="text-xs font-bold">Comentar</span>
                                  </button>
                              </div>
                              {isExpanded && (
                                  <div className="bg-gray-50 border-t border-gray-100 p-4 animate-in slide-in-from-top-2">
                                      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                                          {loadingCommentsId === post.id ? (
                                              <div className="text-center py-2"><Loader2 className="animate-spin w-4 h-4 mx-auto text-gray-400"/></div>
                                          ) : currentComments.length === 0 ? (
                                              <p className="text-xs text-gray-400 text-center italic">Seja o primeiro a comentar.</p>
                                          ) : (
                                              currentComments.map((c, idx) => (
                                                  <div key={idx} className="flex gap-2">
                                                      <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0 mt-1">
                                                          {c.userPhoto ? <img src={c.userPhoto} className="w-full h-full object-cover"/> : <User size={14} className="w-full h-full p-1.5 text-gray-400"/>}
                                                      </div>
                                                      <div className="bg-white p-2.5 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 flex-1">
                                                          <p className="text-[10px] font-bold text-gray-800 mb-0.5">{c.userName}</p>
                                                          <p className="text-xs text-gray-600 leading-relaxed">{c.content}</p>
                                                      </div>
                                                  </div>
                                              ))
                                          )}
                                      </div>
                                      <div className="flex gap-2 items-center">
                                          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                                              {memberData?.photoUrl ? <img src={memberData.photoUrl} className="w-full h-full object-cover"/> : <User size={14} className="w-full h-full p-1.5 text-gray-400"/>}
                                          </div>
                                          <div className="flex-1 relative">
                                              <input type="text" value={commentInputs[post.id!] || ""} onChange={(e) => handleInputChange(post.id!, e.target.value)} placeholder="Escreva um comentário..." className="w-full bg-white border border-gray-200 rounded-full py-2 px-4 text-xs focus:ring-1 ring-blue-300 outline-none pr-10"/>
                                              <button onClick={() => handleSendComment(post.id!)} disabled={!commentInputs[post.id!]?.trim()} className="absolute right-1 top-1 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"><Send size={12}/></button>
                                          </div>
                                      </div>
                                  </div>
                              )}
                          </div>
                      );
                  })
              )}
          </div>
      </div>

      {/* STORY MODAL */}
      {activeStory && (
          <div className="fixed inset-0 z-50 bg-black flex items-center justify-center animate-in fade-in duration-300">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-800 z-50"><div className="h-full bg-white w-full animate-[width_10s_linear]"></div></div>
              <button onClick={() => setActiveStory(null)} className="absolute top-6 right-6 text-white z-50 bg-white/20 p-2 rounded-full"><X size={24}/></button>
              <div className="w-full max-w-md h-full bg-gradient-to-b from-purple-900 to-black md:rounded-2xl relative flex flex-col p-8 text-center justify-center text-white">
                  {activeStory.imageUrl ? (
                      <img src={getImageUrl(activeStory.imageUrl)!} className="w-full h-64 object-cover rounded-xl mb-6 shadow-2xl border-2 border-white/20"/>
                  ) : (
                      <BookOpen size={48} className="mx-auto text-purple-300 mb-6 animate-bounce"/>
                  )}
                  <h2 className="text-2xl font-bold mb-6 leading-tight">{activeStory.title}</h2>
                  <div className="overflow-y-auto max-h-[40vh] custom-scrollbar text-lg leading-relaxed opacity-90 text-justify">{activeStory.content}</div>
              </div>
          </div>
      )}

      {/* OUTROS MODAIS (Carteirinha, Dízimos, Oração) */}
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
                          <div className="text-center py-12 text-gray-400"><DollarSign size={40} className="mx-auto mb-2 opacity-20"/><p className="text-sm">Nenhuma contribuição registrada ainda.</p></div>
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

      {showPrayer && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-purple-100 animate-pulse"><Heart size={32}/></div>
                      <h2 className="text-xl font-bold text-gray-800">Pedido de Oração</h2>
                      <p className="text-xs text-gray-500 mt-1">Seu pedido será enviado diretamente à caixa de entrada do Pastor.</p>
                  </div>
                  <textarea 
                      value={prayerText}
                      onChange={(e) => setPrayerText(e.target.value)}
                      className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 text-sm h-32 focus:ring-2 ring-purple-100 outline-none resize-none mb-4" 
                      placeholder="Escreva aqui seu pedido..."
                  ></textarea>
                  <div className="flex gap-3">
                      <button onClick={() => setShowPrayer(false)} className="flex-1 py-3 text-gray-500 font-bold text-sm bg-gray-100 rounded-xl hover:bg-gray-200 transition">Cancelar</button>
                      <button 
                          onClick={handleSendPrayer} 
                          disabled={sendingPrayer || !prayerText.trim()}
                          className="flex-1 py-3 text-white font-bold text-sm bg-purple-600 rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200 transition flex justify-center items-center gap-2"
                      >
                          {sendingPrayer ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>} Enviar
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}