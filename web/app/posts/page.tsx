"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChurch } from "../../contexts/ChurchContext";
import { postService, Post } from "../../services/postService";
import { 
  Megaphone, Calendar, BookOpen, PlusCircle, Trash2, 
  Loader2, X, Send, LayoutList, AlertCircle, Image as ImageIcon 
} from "lucide-react";

export default function PostsPage() {
  const router = useRouter();
  const { churchId, userRole, hasPermission, loading: authLoading } = useChurch();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Formulário
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "notice" as 'notice' | 'devotional' | 'event',
    date: new Date().toISOString().split('T')[0],
    imageUrl: "" // Novo campo
  });

  // Segurança
  useEffect(() => {
    if (!authLoading) {
         if (userRole !== 'admin' && !hasPermission('secretary') && userRole !== 'leader') {
            router.push('/');
         }
    }
  }, [authLoading, userRole, hasPermission, router]);

  useEffect(() => {
    if (churchId) loadPosts();
  }, [churchId]);

  const loadPosts = async () => {
    if (!churchId) return;
    setLoading(true);
    try {
        const data = await postService.listByChurch(churchId);
        setPosts(data);
    } catch (error) {
        console.error("Erro ao carregar posts", error);
    } finally {
        setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId) return;
    setSaving(true);
    try {
        await postService.create({
            churchId,
            title: formData.title,
            content: formData.content,
            type: formData.type,
            date: formData.date,
            imageUrl: formData.imageUrl // Salva a imagem
        });
        
        setIsModalOpen(false);
        // Limpa o formulário
        setFormData({ title: "", content: "", type: "notice", date: new Date().toISOString().split('T')[0], imageUrl: "" });
        loadPosts();
    } catch (error) {
        alert("Erro ao publicar.");
    } finally {
        setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
      if(confirm("Tem certeza que deseja apagar esta publicação?")) {
          await postService.delete(id);
          loadPosts();
      }
  };

  const getTypeConfig = (type: string) => {
      switch(type) {
          case 'event': return { color: 'bg-orange-50 text-orange-700 border-orange-200', icon: <Calendar size={20}/>, label: 'Evento' };
          case 'devotional': return { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: <BookOpen size={20}/>, label: 'Palavra' };
          default: return { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Megaphone size={20}/>, label: 'Aviso' };
      }
  };

  if (authLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* CABEÇALHO */}
      <div className="bg-[#1D4ED8] pt-10 pb-24 px-8 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  <Megaphone className="text-blue-300"/> Mural de Avisos
                </h1>
                <p className="text-blue-100 text-lg opacity-90">Gerencie o que aparece no App dos membros.</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="hidden md:flex bg-white text-blue-600 px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-50 transition items-center gap-2">
                <PlusCircle size={20}/> Nova Publicação
            </button>
        </div>
      </div>

      <div className="md:hidden px-4 -mt-6 mb-6 relative z-20">
          <button onClick={() => setIsModalOpen(true)} className="w-full bg-white text-blue-600 py-4 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 border border-blue-100">
              <PlusCircle size={22}/> Criar Novo Aviso
          </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-0 -mt-16 relative z-10">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden min-h-[400px]">
              {loading ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2"><Loader2 className="animate-spin"/> Carregando mural...</div>
              ) : posts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2"><LayoutList size={40} className="opacity-20"/><p>Nenhuma publicação ainda.</p></div>
              ) : (
                  <div className="divide-y divide-gray-100">
                      {posts.map(post => {
                          const config = getTypeConfig(post.type);
                          return (
                              <div key={post.id} className="p-6 hover:bg-gray-50 transition flex gap-4 group">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${config.color}`}>{config.icon}</div>
                                  <div className="flex-1">
                                      <div className="flex justify-between items-start mb-1">
                                          <div className="flex items-center gap-2">
                                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${config.color}`}>{config.label}</span>
                                              <span className="text-xs text-gray-400 font-medium flex items-center gap-1"><Calendar size={10}/> {new Date(post.date).toLocaleDateString('pt-BR')}</span>
                                          </div>
                                          <button onClick={() => handleDelete(post.id!)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 size={16}/></button>
                                      </div>
                                      <h3 className="text-lg font-bold text-gray-800 mb-1">{post.title}</h3>
                                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                                      {post.imageUrl && (
                                          <div className="mt-2 text-xs text-blue-500 flex items-center gap-1"><ImageIcon size={12}/> Contém imagem anexa</div>
                                      )}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              )}
          </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 md:p-8 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Megaphone className="text-blue-600"/> Nova Publicação</h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 bg-gray-100 p-2 rounded-full"><X size={20}/></button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                        <div onClick={() => setFormData({...formData, type: 'notice'})} className={`cursor-pointer border rounded-xl p-3 text-center transition ${formData.type === 'notice' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'hover:bg-gray-50 border-gray-200 text-gray-500'}`}><Megaphone size={20} className="mx-auto mb-1"/><span className="text-xs font-bold">Aviso</span></div>
                        <div onClick={() => setFormData({...formData, type: 'event'})} className={`cursor-pointer border rounded-xl p-3 text-center transition ${formData.type === 'event' ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500' : 'hover:bg-gray-50 border-gray-200 text-gray-500'}`}><Calendar size={20} className="mx-auto mb-1"/><span className="text-xs font-bold">Evento</span></div>
                        <div onClick={() => setFormData({...formData, type: 'devotional'})} className={`cursor-pointer border rounded-xl p-3 text-center transition ${formData.type === 'devotional' ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500' : 'hover:bg-gray-50 border-gray-200 text-gray-500'}`}><BookOpen size={20} className="mx-auto mb-1"/><span className="text-xs font-bold">Palavra</span></div>
                    </div>

                    <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Título</label><input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3 border rounded-xl mt-1 font-bold outline-none focus:ring-2 ring-blue-100" /></div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Conteúdo</label><textarea required rows={4} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full p-3 border rounded-xl mt-1 text-sm outline-none focus:ring-2 ring-blue-100 resize-none" /></div>
                    
                    {/* CAMPO DE IMAGEM */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center gap-1"><ImageIcon size={14}/> Link da Imagem (Banner)</label>
                        <input type="url" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="w-full p-3 border rounded-xl mt-1 text-sm outline-none focus:ring-2 ring-blue-100" placeholder="Cole link do Drive, Canva ou Instagram..." />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Data</label>
                        <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3 border rounded-xl mt-1 outline-none focus:ring-2 ring-blue-100" />
                    </div>

                    <button type="submit" disabled={saving} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex justify-center items-center gap-2 mt-2">{saving ? <Loader2 className="animate-spin"/> : <Send size={18}/>} Publicar Agora</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}