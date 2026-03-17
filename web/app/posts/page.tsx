"use client";
import { useState, useEffect } from "react";
import { useChurch } from "../../contexts/ChurchContext";
import { db } from "../../lib/firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, orderBy } from "firebase/firestore";
import { 
    Megaphone, Heart, PlusCircle, Trash2, Loader2, X, 
    MessageSquare, CheckCircle2, Clock, Pin, User 
} from "lucide-react";

export default function PostsAndPrayersPage() {
    const { churchId, userName, userRole, hasPermission } = useChurch();
    
    // Controle das Abas (Tabs)
    const [activeTab, setActiveTab] = useState<'posts' | 'prayers'>('posts');
    
    // Estados Compartilhados
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Estados do Mural
    const [posts, setPosts] = useState<any[]>([]);
    const [showPostModal, setShowPostModal] = useState(false);
    const [postForm, setPostForm] = useState({ title: "", content: "", isImportant: false });

    // Estados de Oração
    const [prayers, setPrayers] = useState<any[]>([]);
    const [showPrayerModal, setShowPrayerModal] = useState(false);
    const [prayerForm, setPrayerForm] = useState({ requestor: userName || "", request: "" });

    useEffect(() => {
        if (churchId) {
            fetchData();
        }
    }, [churchId, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'posts') {
                const q = query(collection(db, "posts"), where("churchId", "==", churchId));
                const snap = await getDocs(q);
                const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => b.createdAt - a.createdAt);
                setPosts(data);
            } else {
                const q = query(collection(db, "prayers"), where("churchId", "==", churchId));
                const snap = await getDocs(q);
                const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => b.createdAt - a.createdAt);
                setPrayers(data);
            }
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
        } finally {
            setLoading(false);
        }
    };

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
                createdAt: Date.now(),
            });
            setShowPostModal(false);
            setPostForm({ title: "", content: "", isImportant: false });
            fetchData();
        } catch (error) { alert("Erro ao salvar aviso."); } finally { setSaving(false); }
    };

    const handleDeletePost = async (id: string) => {
        if (!confirm("Excluir este aviso?")) return;
        try { await deleteDoc(doc(db, "posts", id)); fetchData(); } catch (e) { alert("Erro ao excluir."); }
    };

    // --- FUNÇÕES DE PEDIDOS DE ORAÇÃO ---
    const handleSavePrayer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!churchId) return;
        setSaving(true);
        try {
            await addDoc(collection(db, "prayers"), {
                ...prayerForm,
                churchId,
                status: 'pending', // pending | answered
                createdAt: Date.now(),
            });
            setShowPrayerModal(false);
            setPrayerForm({ requestor: userName || "", request: "" });
            fetchData();
        } catch (error) { alert("Erro ao salvar pedido."); } finally { setSaving(false); }
    };

    const handleAnswerPrayer = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'pending' ? 'answered' : 'pending';
        try {
            await updateDoc(doc(db, "prayers", id), { status: newStatus });
            fetchData();
        } catch (e) { alert("Erro ao atualizar status."); }
    };

    const handleDeletePrayer = async (id: string) => {
        if (!confirm("Excluir este pedido de oração?")) return;
        try { await deleteDoc(doc(db, "prayers", id)); fetchData(); } catch (e) { alert("Erro ao excluir."); }
    };

    const canManagePosts = userRole === 'admin' || userRole === 'pastor' || userRole === 'secretary' || hasPermission('secretary');

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans">
            
            {/* CABEÇALHO E TABS */}
            <div className="bg-[#0F172A] pt-8 pb-32 px-4 md:px-8 shadow-sm">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                        <MessageSquare className="text-blue-400" size={32} /> Comunicação
                    </h1>
                    <p className="text-slate-400 text-sm mb-8">
                        Fique por dentro dos avisos da igreja e interceda pelos irmãos.
                    </p>

                    {/* ESTILO DAS ABAS (TABS) */}
                    <div className="flex bg-slate-800/50 p-1 rounded-2xl border border-slate-700/50 max-w-md mx-auto relative z-20 shadow-xl">
                        <button 
                            onClick={() => setActiveTab('posts')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'posts' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                        >
                            <Megaphone size={18}/> Mural de Avisos
                        </button>
                        <button 
                            onClick={() => setActiveTab('prayers')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'prayers' ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                        >
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
                                {canManagePosts && (
                                    <div className="flex justify-end">
                                        <button onClick={() => setShowPostModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition">
                                            <PlusCircle size={20}/> Novo Aviso
                                        </button>
                                    </div>
                                )}

                                {posts.length === 0 ? (
                                    <div className="bg-white p-12 text-center rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center">
                                        <Megaphone size={48} className="text-slate-200 mb-4"/>
                                        <h3 className="text-lg font-bold text-slate-700">Nenhum aviso no mural</h3>
                                        <p className="text-slate-400 text-sm mt-1">A liderança ainda não publicou nada por aqui.</p>
                                    </div>
                                ) : (
                                    posts.map(post => (
                                        <div key={post.id} className={`bg-white p-6 rounded-3xl shadow-xl border ${post.isImportant ? 'border-amber-300 shadow-amber-100/50' : 'border-slate-100 shadow-slate-200/50'} relative overflow-hidden group`}>
                                            {post.isImportant && <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 text-[10px] font-black uppercase px-4 py-1.5 rounded-bl-xl flex items-center gap-1"><Pin size={12}/> Importante</div>}
                                            
                                            <h3 className="text-xl font-bold text-slate-800 mb-2 pr-20">{post.title}</h3>
                                            <p className="text-slate-600 whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
                                            
                                            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
                                                <div className="flex items-center gap-4">
                                                    <span className="flex items-center gap-1"><User size={14}/> {post.author}</span>
                                                    <span className="flex items-center gap-1"><Clock size={14}/> {new Date(post.createdAt).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                                {canManagePosts && (
                                                    <button onClick={() => handleDeletePost(post.id)} className="text-slate-300 hover:text-red-500 transition p-2 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                                                )}
                                            </div>
                                        </div>
                                    ))
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
                                        <p className="text-slate-400 text-sm mt-1">Sinta-se à vontade para compartilhar seu pedido.</p>
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

            {/* MODAL: NOVO AVISO */}
            {showPostModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                        <div className="bg-slate-50 p-5 flex justify-between items-center border-b border-slate-100">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Megaphone size={18} className="text-blue-500"/> Criar Aviso</h3>
                            <button onClick={() => setShowPostModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleSavePost} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Título do Aviso</label>
                                <input required type="text" value={postForm.title} onChange={e => setPostForm({...postForm, title: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl mt-1 outline-none focus:border-blue-500" placeholder="Ex: Culto Jovem Especial" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Mensagem Completa</label>
                                <textarea required rows={5} value={postForm.content} onChange={e => setPostForm({...postForm, content: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl mt-1 outline-none focus:border-blue-500 resize-none" placeholder="Escreva os detalhes aqui..." />
                            </div>
                            <label className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 cursor-pointer">
                                <input type="checkbox" checked={postForm.isImportant} onChange={e => setPostForm({...postForm, isImportant: e.target.checked})} className="w-5 h-5 accent-amber-500" />
                                <div>
                                    <span className="font-bold text-amber-900 text-sm block">Marcar como Importante</span>
                                    <span className="text-[10px] text-amber-700">Destaca o aviso com um selo e cor diferente.</span>
                                </div>
                            </label>
                            <button type="submit" disabled={saving} className="w-full py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 flex justify-center items-center gap-2">{saving ? <Loader2 className="animate-spin" size={20}/> : 'Publicar Aviso no Mural'}</button>
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