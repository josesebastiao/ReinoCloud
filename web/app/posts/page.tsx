"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChurch } from "../../contexts/ChurchContext"; // Contexto
import { postService, Post } from "../../services/postService";
import { 
  Megaphone, Plus, Trash2, Calendar, BookOpen, Bell, Loader2 
} from "lucide-react";

export default function PostsPage() {
  const router = useRouter();
  const { churchId, userRole, hasPermission, loading: authLoading } = useChurch();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estado do Formulário
  const [formData, setFormData] = useState({
      title: "",
      content: "",
      type: "notice" as 'notice' | 'devotional' | 'event',
      date: new Date().toISOString().split('T')[0]
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
    // --- CORREÇÃO 1: Garante que temos o ID ---
    if (!churchId) return; 

    setLoading(true);
    try {
        const list = await postService.listByChurch(churchId);
        setPosts(list);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      
      // --- CORREÇÃO 2: Garante que temos o ID antes de salvar ---
      if (!churchId) return;

      setSaving(true);
      try {
          await postService.create({
              churchId,
              ...formData
          });
          setIsModalOpen(false);
          setFormData({ title: "", content: "", type: "notice", date: new Date().toISOString().split('T')[0] }); // Limpa form
          loadPosts(); // Recarrega
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

  // Ícone dinâmico baseada no tipo
  const getTypeIcon = (type: string) => {
      switch(type) {
          case 'devotional': return <BookOpen size={20} className="text-purple-600"/>;
          case 'event': return <Calendar size={20} className="text-orange-600"/>;
          default: return <Bell size={20} className="text-blue-600"/>;
      }
  };

  const getTypeLabel = (type: string) => {
      switch(type) {
          case 'devotional': return "Devocional";
          case 'event': return "Evento";
          default: return "Aviso";
      }
  };

  const getTypeColor = (type: string) => {
      switch(type) {
          case 'devotional': return "bg-purple-100 text-purple-700 border-purple-200";
          case 'event': return "bg-orange-100 text-orange-700 border-orange-200";
          default: return "bg-blue-100 text-blue-700 border-blue-200";
      }
  };

  if (authLoading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin text-blue-600"/></div>;

  if (userRole !== 'admin' && !hasPermission('secretary') && userRole !== 'leader') return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* CABEÇALHO */}
      <div className="bg-[#1D4ED8] pt-10 pb-24 px-8 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  <Megaphone className="text-blue-300"/> Mural de Avisos
                </h1>
                <p className="text-blue-100 text-lg opacity-90">Comunique-se com toda a igreja pelo App.</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="hidden md:flex bg-white text-blue-600 px-4 py-2 rounded-xl font-bold shadow-lg transition hover:bg-blue-50 items-center gap-2">
                <Plus size={20} /> Nova Publicação
            </button>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="max-w-4xl mx-auto px-4 md:px-0 -mt-16">
          
          {/* Botão Mobile */}
          <button onClick={() => setIsModalOpen(true)} className="md:hidden w-full mb-6 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2">
             <Plus size={20}/> Nova Publicação
          </button>

          {loading ? (
              <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-blue-600"/></div>
          ) : posts.length === 0 ? (
              <div className="bg-white p-10 rounded-3xl text-center shadow-sm border border-dashed border-gray-300">
                  <Megaphone size={48} className="text-gray-300 mx-auto mb-4"/>
                  <h3 className="text-lg font-bold text-gray-700">Mural Vazio</h3>
                  <p className="text-gray-500">Crie o primeiro aviso para aparecer no App dos membros.</p>
              </div>
          ) : (
              <div className="space-y-4">
                  {posts.map(post => (
                      <div key={post.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                          <div className="flex justify-between items-start mb-3">
                              <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border flex items-center gap-2 ${getTypeColor(post.type)}`}>
                                  {getTypeIcon(post.type)}
                                  {getTypeLabel(post.type)}
                              </div>
                              <button onClick={() => handleDelete(post.id!)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                                  <Trash2 size={18}/>
                              </button>
                          </div>
                          
                          <h3 className="text-xl font-bold text-gray-800 mb-2">{post.title}</h3>
                          <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                          
                          <div className="mt-4 pt-4 border-t border-gray-50 text-xs text-gray-400 font-medium">
                              Publicado em: {new Date(post.date).toLocaleDateString('pt-BR')}
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>

      {/* MODAL NOVA PUBLICAÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-in zoom-in-95">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Nova Publicação</h2>
              
              <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tipo</label>
                          <select 
                            value={formData.type} 
                            onChange={e => setFormData({...formData, type: e.target.value as any})} 
                            className="w-full p-3 border rounded-xl bg-white mt-1 outline-none focus:ring-2 ring-blue-100"
                          >
                              <option value="notice">🔔 Aviso Geral</option>
                              <option value="devotional">📖 Devocional</option>
                              <option value="event">📅 Evento</option>
                          </select>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Data</label>
                          <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3 border rounded-xl mt-1 outline-none focus:ring-2 ring-blue-100"/>
                      </div>
                  </div>

                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Título</label>
                      <input 
                        required
                        type="text" 
                        value={formData.title} 
                        onChange={e => setFormData({...formData, title: e.target.value})} 
                        className="w-full p-3 border rounded-xl mt-1 outline-none focus:ring-2 ring-blue-100 font-bold"
                        placeholder="Ex: Culto da Virada"
                      />
                  </div>

                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Conteúdo</label>
                      <textarea 
                        required
                        value={formData.content} 
                        onChange={e => setFormData({...formData, content: e.target.value})} 
                        className="w-full p-3 border rounded-xl mt-1 outline-none focus:ring-2 ring-blue-100 h-32"
                        placeholder="Escreva a mensagem aqui..."
                      />
                  </div>

                  <div className="flex gap-3 pt-4">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition">Cancelar</button>
                      <button type="submit" disabled={saving} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition">
                          {saving ? 'Publicando...' : 'Publicar'}
                      </button>
                  </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
}