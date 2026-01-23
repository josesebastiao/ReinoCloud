"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ministryService } from "../../services/ministryService"; // Atenção aos 2 pontos (../../)
import { Ministry } from "../../types/ministry";
import { Users, Plus, Pencil, Trash2, Music, Heart, BookOpen, Mic2 } from "lucide-react";

export default function Ministries() {
  const router = useRouter();
  const [churchId, setChurchId] = useState("");
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal e Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const idSalvo = localStorage.getItem("churchId");
    if (!idSalvo) {
      router.push("/login");
      return;
    }
    setChurchId(idSalvo);
    carregarMinisterios(idSalvo);
  }, [router]);

  const carregarMinisterios = async (id: string) => {
    const lista = await ministryService.listByChurch(id);
    setMinistries(lista);
  };

  const abrirModal = (ministry?: Ministry) => {
    if (ministry) {
      setEditingId(ministry.id || null);
      setName(ministry.name);
      setDescription(ministry.description || "");
    } else {
      setEditingId(null);
      setName("");
      setDescription("");
    }
    setIsModalOpen(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await ministryService.update(editingId, { name, description });
      } else {
        await ministryService.create({ name, description, churchId });
      }
      setIsModalOpen(false);
      carregarMinisterios(churchId);
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar ministério.");
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async (id: string) => {
    if (confirm("Tem certeza? Isso pode afetar escalas futuras.")) {
      await ministryService.delete(id);
      carregarMinisterios(churchId);
    }
  };

  // Função para escolher um ícone aleatório (só visual por enquanto)
  const getRandomIcon = (index: number) => {
    const icons = [Music, Heart, BookOpen, Mic2, Users];
    const IconComponent = icons[index % icons.length];
    return <IconComponent size={24} />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Cabeçalho */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ministérios</h1>
          <p className="text-gray-500">Gerencie as equipes da igreja</p>
        </div>
        <button 
          onClick={() => abrirModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Nova Equipe
        </button>
      </div>

      {/* Grid de Cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ministries.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <Users size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Nenhum ministério criado.</p>
            <p className="text-sm text-gray-400">Crie o primeiro, ex: "Louvor" ou "Infantil".</p>
          </div>
        ) : (
          ministries.map((m, index) => (
            <div key={m.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group relative">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => abrirModal(m)} className="p-1.5 text-gray-400 hover:text-blue-600 bg-gray-50 rounded">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleExcluir(m.id!)} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 rounded">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                {getRandomIcon(index)}
              </div>
              
              <h3 className="text-lg font-bold text-gray-800 mb-1">{m.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">
                {m.description || "Sem descrição definida."}
              </p>
              
              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Membros</span>
                {/* Futuramente aqui mostraremos a contagem real */}
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">0 pessoas</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">{editingId ? 'Editar Ministério' : 'Nova Equipe'}</h2>
            <form onSubmit={handleSalvar} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nome da Equipe</label>
                <input 
                  value={name} onChange={e => setName(e.target.value)} 
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="Ex: Louvor da Noite" required 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Descrição</label>
                <textarea 
                  value={description} onChange={e => setDescription(e.target.value)} 
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="Responsáveis pela música..." rows={3}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}