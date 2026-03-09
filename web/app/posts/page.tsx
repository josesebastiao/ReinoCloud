"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { postService, Post } from "../../services/postService"; // Certifique-se que o caminho está certo
import {
    Megaphone, Plus, Trash2, Calendar, BookOpen,
    AlignLeft, X, Loader2, Image as ImageIcon
} from "lucide-react";
import { useChurch } from "../../contexts/ChurchContext";

export default function PostsPage() {
    const router = useRouter();
    const { churchModules, userRole, hasPermission } = useChurch();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [churchId, setChurchId] = useState("");

    // Modal Criar
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPost, setNewPost] = useState({
        title: "",
        content: "",
        type: "notice",
        date: new Date().toISOString().split('T')[0],
        imageUrl: ""
    });
    const [creating, setCreating] = useState(false);

    // Estado para controlar "Ver Mais"
    const [expandedTexts, setExpandedTexts] = useState<Record<string, boolean>>({});

    useEffect(() => {
        // Blindagem de Módulo
        if (churchModules === 'admin') {
            router.push("/");
            return;
        }

        const id = localStorage.getItem("churchId");
        if (!id) {
            router.push("/login");
            return;
        }

        // Blindagem de Permissão
        const allowedRoles = ['admin', 'pastor', 'leader', 'secretary'];
        const isAllowed = allowedRoles.includes(userRole || "") || hasPermission('secretary');

        if (!isAllowed) {
            router.push("/");
            return;
        }

        setChurchId(id);
        loadPosts(id);
    }, [churchModules, userRole, hasPermission, router]);

    const loadPosts = async (id: string) => {
        setLoading(true);
        try {
            const data = await postService.listByChurch(id);
            // Ordenar: mais recentes primeiro
            data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setPosts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Tem certeza que deseja excluir este aviso?")) {
            await postService.delete(id);
            loadPosts(churchId);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPost.title || !newPost.content) return;

        setCreating(true);
        try {
            await postService.create({
                ...newPost,
                churchId,
                likes: [],
                comments: []
            } as any);
            setIsModalOpen(false);
            setNewPost({ title: "", content: "", type: "notice", date: new Date().toISOString().split('T')[0], imageUrl: "" });
            loadPosts(churchId);
        } catch (error) {
            alert("Erro ao criar aviso.");
        } finally {
            setCreating(false);
        }
    };

    // Função para alternar o texto
    const toggleText = (postId: string) => {
        setExpandedTexts(prev => ({ ...prev, [postId]: !prev[postId] }));
    };

    const getIconByType = (type: string) => {
        switch (type) {
            case 'event': return <Calendar className="text-orange-500" size={20} />;
            case 'devotional': return <BookOpen className="text-purple-500" size={20} />;
            default: return <Megaphone className="text-blue-500" size={20} />;
        }
    };

    const getLabelByType = (type: string) => {
        switch (type) {
            case 'event': return <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded uppercase">Evento</span>;
            case 'devotional': return <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-1 rounded uppercase">Palavra</span>;
            default: return <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase">Aviso</span>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">

            {/* CABEÇALHO */}
            <div className="bg-[#1D4ED8] pt-10 pb-20 px-6 shadow-sm">
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => router.back()} className="text-white/80 hover:text-white flex items-center gap-2 mb-4 text-sm font-bold transition">
                        Voltar
                    </button>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Megaphone className="text-blue-300" /> Mural de Avisos
                    </h1>
                    <p className="text-blue-100 text-lg opacity-90">Gerencie o que aparece no App dos membros.</p>
                </div>
            </div>

            {/* LISTA DE POSTS */}
            <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-10">

                {/* Botão Criar (Fica acima da lista) */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-white text-blue-600 py-4 rounded-2xl font-bold shadow-lg flex justify-center items-center gap-2 mb-6 hover:bg-gray-50 transition border border-blue-100"
                >
                    <Plus size={20} className="bg-blue-100 rounded-full p-0.5" /> Criar Novo Aviso
                </button>

                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-10"><Loader2 className="animate-spin text-blue-600 mx-auto" /></div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                            <Megaphone size={40} className="mx-auto mb-2 text-gray-300" />
                            <p className="text-gray-400 font-medium">Nenhum aviso postado.</p>
                        </div>
                    ) : (
                        posts.map(post => {
                            // LÓGICA DE TRUNCAR TEXTO
                            const isTextExpanded = expandedTexts[post.id!] || false;
                            const textLimit = 150;
                            const shouldTruncate = post.content.length > textLimit;
                            const displayedContent = isTextExpanded || !shouldTruncate
                                ? post.content
                                : post.content.slice(0, textLimit) + "...";

                            return (
                                <div key={post.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex gap-4 animate-in slide-in-from-bottom-2">
                                    {/* Ícone Lateral */}
                                    <div className="hidden sm:flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                                            {getIconByType(post.type)}
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                {getLabelByType(post.type)}
                                                <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={10} /> {new Date(post.date).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                            <button onClick={() => handleDelete(post.id!)} className="text-gray-300 hover:text-red-500 transition">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <h3 className="font-bold text-gray-800 text-lg mb-1 leading-tight">{post.title}</h3>

                                        {/* CONTEÚDO COM VER MAIS */}
                                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                            {displayedContent}
                                            {shouldTruncate && (
                                                <button
                                                    onClick={() => toggleText(post.id!)}
                                                    className="text-blue-600 font-bold ml-1 hover:underline text-xs"
                                                >
                                                    {isTextExpanded ? "Ver menos" : "Ver mais"}
                                                </button>
                                            )}
                                        </p>

                                        {post.imageUrl && (
                                            <div className="mt-3 flex items-center gap-1 text-xs text-blue-500 font-medium bg-blue-50 w-fit px-2 py-1 rounded">
                                                <ImageIcon size={12} /> Contém imagem anexa
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* MODAL CRIAR AVISO */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Novo Aviso</h2>
                            <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Título</label>
                                <input
                                    className="w-full p-3 border rounded-xl focus:ring-2 ring-blue-100 outline-none bg-gray-50"
                                    value={newPost.title}
                                    onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                                    placeholder="Ex: Culto de Jovens"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tipo</label>
                                    <select
                                        className="w-full p-3 border rounded-xl focus:ring-2 ring-blue-100 outline-none bg-gray-50"
                                        value={newPost.type}
                                        onChange={e => setNewPost({ ...newPost, type: e.target.value })}
                                    >
                                        <option value="notice">Aviso Geral</option>
                                        <option value="event">Evento</option>
                                        <option value="devotional">Palavra/Devocional</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Data de Exibição</label>
                                    <input
                                        type="date"
                                        className="w-full p-3 border rounded-xl focus:ring-2 ring-blue-100 outline-none bg-gray-50"
                                        value={newPost.date}
                                        onChange={e => setNewPost({ ...newPost, date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Conteúdo</label>
                                <textarea
                                    className="w-full p-3 border rounded-xl focus:ring-2 ring-blue-100 outline-none bg-gray-50 min-h-[120px]"
                                    value={newPost.content}
                                    onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                                    placeholder="Escreva os detalhes..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Link da Imagem (Opcional)</label>
                                <input
                                    className="w-full p-3 border rounded-xl focus:ring-2 ring-blue-100 outline-none bg-gray-50 text-sm"
                                    value={newPost.imageUrl}
                                    onChange={e => setNewPost({ ...newPost, imageUrl: e.target.value })}
                                    placeholder="https://..."
                                />
                                <p className="text-[10px] text-gray-400 mt-1 ml-1">Cole um link do Google Drive ou imagem direta.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={creating}
                                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition mt-4"
                            >
                                {creating ? <Loader2 className="animate-spin mx-auto" /> : "Publicar Aviso"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}