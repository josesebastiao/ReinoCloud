"use client";
import { useState, useEffect } from "react";
import { useChurch } from "../../contexts/ChurchContext";
import { db } from "../../lib/firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { 
    Megaphone, Heart, PlusCircle, Trash2, Loader2, X, 
    MessageSquare, CheckCircle2, Clock, Pin, User, Image as ImageIcon, Calendar, BookOpen, ChevronDown, History
} from "lucide-react";

export default function PostsAndPrayersPage() {
    const { churchId, userName, userRole, hasPermission } = useChurch();
    
    // Controle das Abas (Tabs)
    const [activeTab, setActiveTab] = useState<'posts' | 'prayers'>('posts');
    
    // Estados Compartilhados
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // --- ESTADOS DO MURAL ---
    const [posts, setPosts] = useState<any[]>([]);
    const [showPostModal, setShowPostModal] = useState(false);
    const [postForm, setPostForm] = useState({ 
        title: "", content: "", type: "notice", imageUrl: "", isImportant: false 
    });
    
    // Paginação e Expiração
    const [visibleCount, setVisibleCount] = useState(5);
    const [expandedTexts, setExpandedTexts] = useState<Record<string, boolean>>({});
    const [showExpired, setShowExpired] = useState(false); // Para o pastor ver o que já expirou

    // --- ESTADOS DE ORAÇÃO ---
    const [prayers, setPrayers] = useState<any[]>([]);
    const [showPrayerModal, setShowPrayerModal] = useState(false);
    const [prayerForm, setPrayerForm] = useState({ requestor: userName || "", request: "" });

    useEffect(() => {
        if (churchId) fetchData();
    }, [churchId, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'posts') {
                const q = query(collection(db, "posts"), where("churchId", "==", churchId));
                const snap = await getDocs(q);
                const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setPosts(data);
            } else {
                const q = query(collection(db, "prayers"), where("churchId", "==", churchId));
                const snap = await getDocs(q);
                const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => b.createdAt - a.createdAt);
                setPrayers(data);
            }
        } catch (error) { console.error("Erro ao buscar dados:", error); } 
        finally { setLoading(false); }
    };

    // --- LÓGICA DE EXPIRAÇÃO (Igual ao MemberDashboard) ---
    const filteredPosts = posts.filter(post => {
        if (showExpired) return true; // Se ativou o histórico, mostra tudo
        if (!post.date) return true;
        
        const pDate = new Date(post.date + 'T00:00:00');
        const today = new Date();
        today.setHours(0,0,0,0);

        if (post.type === 'event') {
            return pDate >= today; // Evento expira depois que a data passa
        } else {
            const limitDate = new Date();
            limitDate.setDate(limitDate.getDate() - 15); // Avisos normais expiram em 15 dias
            limitDate.setHours(0,0,0,0);
            return pDate >= limitDate;
        }
    });

    const displayedPosts = filteredPosts.slice(0, visibleCount);
    const toggleText = (id: string) => setExpandedTexts(prev => ({ ...prev, [id]: !prev[id] }));

    // --- FUNÇÕES DO MURAL DE AVISOS ---
    const handleSavePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!churchId) return;
        setSaving(true);
        try {
            await addDoc(collection(db, "posts"), {
                ...postForm,
                churchId,
                author: userName || "Liderança",
                date: new Date().toISOString().split('T')[0],
                createdAt: Date.now(),
                likes: [],
            });
            setShowPostModal(false);
            setPostForm({ title: "", content: "", type: "notice", imageUrl: "", isImportant: false });
            fetchData();
        } catch (error) { alert("Erro ao salvar aviso."); } finally { setSaving(false); }
    };

    const handleDeletePost = async (id: string) => {
        if (!confirm("Excluir esta publicação definitivamente?")) return;
        try { await deleteDoc(doc(db, "posts", id)); fetchData(); } catch (e) { alert("Erro ao excluir."); }
    };

    // --- FUNÇÕES DE PEDIDOS DE ORAÇÃO ---
    const handleSavePrayer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!churchId) return;
        setSaving(true);
        try {
            await addDoc(collection(db, "prayers"), {
                ...prayerForm, churchId, status: 'pending', createdAt: Date.now(),
            });
            setShowPrayerModal(false);
            setPrayerForm({ requestor: userName || "", request: "" });
            fetchData();
        } catch (error) { alert("Erro ao salvar pedido."); } finally { setSaving(false); }
    };

    const handleAnswerPrayer = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'pending' ? 'answered' : 'pending';
        try { await updateDoc(doc(db, "prayers", id), { status: newStatus }); fetchData(); } catch (e) { alert("Erro."); }
    };

    const handleDeletePrayer = async (id: string) => {
        if (!confirm("Excluir?")) return;
        try { await deleteDoc(doc(db, "prayers", id)); fetchData(); } catch (e) { alert("Erro."); }
    };

    const canManagePosts = userRole === 'admin' || userRole === 'pastor' || userRole === 'secretary' || hasPermission('secretary');

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans">
            
            <div className="bg-[#0F172A] pt-8 pb-32 px-4 md:px-8 shadow-sm">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                        <MessageSquare className="text-blue-400" size={32} /> Comunicação
                    </h1>
                    <p className="text-slate-400 text-sm mb-8">
                        Fique por dentro dos avisos da igreja e interceda pelos irmãos.
                    </p>

                    <div className="flex bg-slate-800/50 p-1 rounded-2xl border border-slate-700/50 max-w-md mx-auto relative z-20 shadow-xl">
                        <button onClick={() => setActiveTab('posts')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'posts' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>
                            <Megaphone size={18}/> Mural da Igreja
                        </button>
                        <button onClick={() => setActiveTab('prayers')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'prayers' ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>
                            <Heart size={18}/> Pedidos de Oração
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 md:px-0 -mt-20 relative z-10">
                {loading ? (
                    <div className="flex justify-center p-20 bg-white rounded-3xl shadow-xl border border-slate-100"><Loader2 className="animate-spin text-blue-600" size={40}/></div>
                ) : (
                    <>
                        {/* ---------------- TELA DO MURAL ---------------- */}
                        {activeTab === 'posts' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                
                                {/* Botões de Ação do Mural */}
                                {canManagePosts && (
                                    <div className="flex justify-between items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                                        <button 
                                            onClick={() => setShowExpired(!showExpired)} 
                                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${showExpired ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                                            title="Ver publicações antigas que já sumiram do app dos membros"
                                        >
                                            <History size={16}/> {showExpired ? 'Ocultar Histórico' : 'Ver Histórico'}
                                        </button>

                                        <button onClick={() => setShowPostModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition text-sm">
                                            <PlusCircle size={18}/> Nova Publicação
                                        </button>
                                    </div>
                                )}

                                {displayedPosts.length === 0 ? (
                                    <div className="bg-white p-12 text-center rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center">
                                        <Megaphone size={48} className="text-slate-200 mb-4"/>
                                        <h3 className="text-lg font-bold text-slate-700">Nenhum aviso ativo</h3>
                                        {showExpired && <p className="text-slate-400 text-sm mt-1">O histórico também está vazio.</p>}
                                    </div>
                                ) : (
                                    displayedPosts.map(post => {
                                        // Lógica de "Ler Mais" para textos gigantes
                                        const textLimit = 200;
                                        const shouldTruncate = post.content.length > textLimit;
                                        const isExpanded = expandedTexts[post.id] || false;
                                        const displayedContent = isExpanded || !shouldTruncate ? post.content : post.content.slice(0, textLimit) + "...";

                                        // Identifica se o post está expirado (visualmente)
                                        const pDate = new Date(post.date + 'T00:00:00');
                                        const limitDate = new Date(); limitDate.setDate(limitDate.getDate() - 15); limitDate.setHours(0,0,0,0);
                                        const isExpired = post.type !== 'event' && pDate < limitDate;

                                        return (
                                        <div key={post.id} className={`bg-white rounded-3xl shadow-xl border ${post.isImportant ? 'border-amber-300 shadow-amber-100/50' : 'border-slate-100 shadow-slate-200/50'} relative overflow-hidden group ${isExpired ? 'opacity-70 grayscale-[30%]' : ''}`}>
                                            {post.isImportant && <div className="absolute top-0 right-0 z-10 bg-amber-400 text-amber-900 text-[10px] font-black uppercase px-4 py-1.5 rounded-bl-xl flex items-center gap-1"><Pin size={12}/> Importante</div>}
                                            {isExpired && <div className="absolute top-0 right-0 z-10 bg-slate-800 text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-bl-xl flex items-center gap-1"><History size={12}/> Expirado</div>}
                                            
                                            <div className="px-6 pt-5 pb-2 flex items-center gap-2">
                                                {post.type === 'event' && <span className="bg-orange-100 text-orange-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md flex items-center gap-1"><Calendar size={12}/> Evento</span>}
                                                {post.type === 'devotional' && <span className="bg-purple-100 text-purple-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md flex items-center gap-1"><BookOpen size={12}/> Palavra</span>}
                                                {post.type === 'notice' && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md flex items-center gap-1"><Megaphone size={12}/> Aviso</span>}
                                            </div>

                                            <div className="px-6">
                                                <h3 className="text-xl font-bold text-slate-800 mb-2 pr-20">{post.title}</h3>
                                                <p className="text-slate-600 whitespace-pre-wrap text-sm leading-relaxed">
                                                    {displayedContent}
                                                    {shouldTruncate && (
                                                        <button onClick={() => toggleText(post.id)} className="text-blue-600 font-bold ml-1 hover:underline text-xs">
                                                            {isExpanded ? "Ler menos" : "Ler mais"}
                                                        </button>
                                                    )}
                                                </p>
                                            </div>

                                            {post.imageUrl && (
                                                <div className="mt-4 bg-slate-50 border-y border-slate-100 p-2 flex justify-center max-h-64 overflow-hidden">
                                                    <img src={post.imageUrl} className="max-h-60 object-contain rounded-xl" alt="Anexo" />
                                                </div>
                                            )}
                                            
                                            <div className="mt-4 px-6 pb-5 flex items-center justify-between text-xs text-slate-400 font-medium">
                                                <div className="flex items-center gap-4">
                                                    <span className="flex items-center gap-1"><User size={14}/> {post.author}</span>
                                                    <span className="flex items-center gap-1"><Clock size={14}/> {new Date(post.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                                    <span className="flex items-center gap-1"><Heart size={14}/> {post.likes?.length || 0} curtidas</span>
                                                </div>
                                                {canManagePosts && (
                                                    <button onClick={() => handleDeletePost(post.id)} className="text-slate-300 hover:text-red-500 transition p-2 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                                                )}
                                            </div>
                                        </div>
                                    )})
                                )}

                                {/* BOTÃO "VER MAIS" (Paginação) */}
                                {filteredPosts.length > visibleCount && (
                                    <div className="flex justify-center pt-2">
                                        <button 
                                            onClick={() => setVisibleCount(prev => prev + 5)} 
                                            className="bg-white border border-slate-200 text-slate-600 font-bold text-sm px-6 py-3 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition flex items-center gap-2 shadow-sm"
                                        >
                                            Carregar mais publicações <ChevronDown size={16}/>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ---------------- TELA DE ORAÇÕES ---------------- */}
                        {activeTab === 'prayers' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex justify-end">
                                    <button onClick={() => setShowPrayerModal(true)} className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-rose-200 transition">
                                        <PlusCircle size={20}/> Pedir Oração
                                    </button>
                                </div>

                                {prayers.length === 0 ? (
                                    <div className="bg-white p-12 text-center rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center">
                                        <Heart size={48} className="text-slate-200 mb-4"/>
                                        <h3 className="text-lg font-bold text-slate-700">Nenhum pedido de oração</h3>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {prayers.map(prayer => (
                                            <div key={prayer.id} className={`bg-white p-5 rounded-2xl shadow-lg border transition-all ${prayer.status === 'answered' ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100'}`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                                        <User size={16} className="text-slate-400"/> {prayer.requestor}
                                                    </h4>
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${prayer.status === 'answered' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                        {prayer.status === 'answered' ? 'Oração Respondida' : 'Em Oração'}
                                                    </span>
                                                </div>
                                                <p className="text-slate-600 text-sm mb-4 min-h-[60px]">{prayer.request}</p>
                                                
                                                <div className="flex items-center justify-between pt-3 border-t border-slate-100/50">
                                                    <span className="text-[10px] text-slate-400 font-medium">Postado em {new Date(prayer.createdAt).toLocaleDateString('pt-BR')}</span>
                                                    
                                                    <div className="flex gap-2">
                                                        {(userRole === 'admin' || userRole === 'pastor') && (
                                                            <button 
                                                                onClick={() => handleAnswerPrayer(prayer.id, prayer.status)}
                                                                className={`p-2 rounded-lg transition ${prayer.status === 'answered' ? 'text-emerald-600 bg-emerald-100' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                                                title="Marcar como Respondida"
                                                            >
                                                                <CheckCircle2 size={16}/>
                                                            </button>
                                                        )}
                                                        {(userRole === 'admin' || userRole === 'pastor') && (
                                                            <button onClick={() => handleDeletePrayer(prayer.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={16}/></button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* MODAL: NOVO AVISO / POST */}
            {showPostModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 h-[90vh] md:h-auto flex flex-col">
                        <div className="bg-slate-50 p-5 flex justify-between items-center border-b border-slate-100 shrink-0">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Megaphone size={18} className="text-blue-500"/> Nova Publicação</h3>
                            <button onClick={() => setShowPostModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleSavePost} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                            
                            <div className="grid grid-cols-3 gap-2">
                                <button type="button" onClick={() => setPostForm({...postForm, type: 'notice'})} className={`py-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition ${postForm.type === 'notice' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}><Megaphone size={16}/> Aviso</button>
                                <button type="button" onClick={() => setPostForm({...postForm, type: 'event'})} className={`py-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition ${postForm.type === 'event' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}><Calendar size={16}/> Evento</button>
                                <button type="button" onClick={() => setPostForm({...postForm, type: 'devotional'})} className={`py-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition ${postForm.type === 'devotional' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}><BookOpen size={16}/> Palavra</button>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Título da Publicação</label>
                                <input required type="text" value={postForm.title} onChange={e => setPostForm({...postForm, title: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl mt-1 outline-none focus:border-blue-500" placeholder="Ex: Culto Jovem Especial" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Mensagem Completa</label>
                                <textarea required rows={5} value={postForm.content} onChange={e => setPostForm({...postForm, content: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl mt-1 outline-none focus:border-blue-500 resize-none" placeholder="Escreva os detalhes aqui..." />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><ImageIcon size={14}/> Link da Imagem (Opcional)</label>
                                <input type="url" value={postForm.imageUrl} onChange={e => setPostForm({...postForm, imageUrl: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl mt-1 outline-none focus:border-blue-500 text-sm" placeholder="Cole o link da foto do Google Drive aqui..." />
                            </div>
                            <label className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 cursor-pointer">
                                <input type="checkbox" checked={postForm.isImportant} onChange={e => setPostForm({...postForm, isImportant: e.target.checked})} className="w-5 h-5 accent-amber-500" />
                                <div>
                                    <span className="font-bold text-amber-900 text-sm block">Marcar como Importante</span>
                                    <span className="text-[10px] text-amber-700">Destaca o aviso com um selo e cor diferente.</span>
                                </div>
                            </label>
                            <button type="submit" disabled={saving} className="w-full py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 flex justify-center items-center gap-2 mt-4 shrink-0">{saving ? <Loader2 className="animate-spin" size={20}/> : 'Publicar no Mural'}</button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: NOVO PEDIDO DE ORAÇÃO */}
            {showPrayerModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                        <div className="bg-rose-50 p-5 flex justify-between items-center border-b border-rose-100">
                            <h3 className="font-bold text-rose-800 flex items-center gap-2"><Heart size={18} className="text-rose-500"/> Pedir Oração</h3>
                            <button onClick={() => setShowPrayerModal(false)} className="text-rose-400 hover:text-rose-600"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleSavePrayer} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Seu Nome</label>
                                <input required type="text" value={prayerForm.requestor} onChange={e => setPrayerForm({...prayerForm, requestor: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl mt-1 outline-none focus:border-rose-500" placeholder="Ex: João Silva" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Seu Pedido / Causa</label>
                                <textarea required rows={5} value={prayerForm.request} onChange={e => setPrayerForm({...prayerForm, request: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl mt-1 outline-none focus:border-rose-500 resize-none" placeholder="Descreva brevemente pelo que devemos orar..." />
                            </div>
                            <button type="submit" disabled={saving} className="w-full py-3.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 flex justify-center items-center gap-2">{saving ? <Loader2 className="animate-spin" size={20}/> : 'Enviar Pedido de Oração'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}