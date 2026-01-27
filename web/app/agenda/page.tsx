"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { eventService } from "../../services/eventService";
import { Event } from "../../types/event";
import { 
  Calendar, Clock, MapPin, Plus, Trash2, CheckCircle, X, Edit, AlertCircle 
} from "lucide-react";

export default function AgendaPage() {
  const router = useRouter();
  const [churchId, setChurchId] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Controle do Modal e Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Formulário
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    type: "culto",
    description: "",
    location: ""
  });

  useEffect(() => {
    const idSalvo = localStorage.getItem("churchId");
    if (!idSalvo) {
      router.push("/login");
      return;
    }
    setChurchId(idSalvo);
    carregarEventos(idSalvo);
  }, [router]);

  const carregarEventos = async (id: string) => {
    try {
      const lista = await eventService.listByChurch(id);
      // Ordena por data (mais recente primeiro)
      lista.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setEvents(lista);
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
    }
  };

  // --- LÓGICA DE SALVAR (CRIAR OU ATUALIZAR) ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        churchId,
        title: formData.title,
        date: formData.date,
        time: formData.time,
        type: formData.type as any,
        description: formData.description,
        location: formData.location
      };

      if (editingId) {
        // ATUALIZA
        await eventService.update(editingId, payload);
      } else {
        // CRIA NOVO
        await eventService.create(payload);
      }

      closeModal();
      carregarEventos(churchId);
    } catch (error) {
      alert("Erro ao salvar evento");
    } finally {
      setLoading(false);
    }
  };

  // --- PREPARAR PARA EDITAR ---
  const handleEdit = (event: Event) => {
    setEditingId(event.id!);
    setFormData({
      title: event.title,
      date: event.date,
      time: event.time,
      type: event.type,
      description: event.description || "",
      location: event.location || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja apagar este evento?")) {
      await eventService.delete(id);
      carregarEventos(churchId);
    }
  };

  // Limpa o formulário ao fechar
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ title: "", date: "", time: "", type: "culto", description: "", location: "" });
  };

  // Separar eventos futuros e passados
  // Ajuste de fuso horário simples para comparação
  const hoje = new Date();
  hoje.setHours(0,0,0,0);
  
  const upcomingEvents = events.filter(e => {
      const dataEvento = new Date(e.date + "T12:00:00"); // Força meio dia pra evitar erro de fuso
      return dataEvento >= hoje;
  });
  
  const pastEvents = events.filter(e => {
      const dataEvento = new Date(e.date + "T12:00:00");
      return dataEvento < hoje;
  }).reverse(); // Mostra os passados mais recentes primeiro

  // Cores por tipo
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'culto': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'reuniao': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'visita': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'evento': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Agenda Pastoral</h1>
          <p className="text-gray-500">Cultos, reuniões e visitas</p>
        </div>
        <button 
          onClick={() => { closeModal(); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm font-bold w-full md:w-auto justify-center"
        >
          <Plus size={20} /> Agendar Compromisso
        </button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA DA ESQUERDA: PRÓXIMOS EVENTOS */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <Calendar size={20} className="text-blue-600"/> Próximos Compromissos
          </h2>
          
          {upcomingEvents.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center flex flex-col items-center">
              <div className="bg-gray-50 p-4 rounded-full mb-3"><AlertCircle className="text-gray-400" size={32}/></div>
              <p className="text-gray-500 font-medium">Agenda livre!</p>
              <p className="text-sm text-gray-400">Nenhum evento para os próximos dias.</p>
            </div>
          ) : (
            upcomingEvents.map(event => (
              <div key={event.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 hover:shadow-md transition group">
                {/* Data Box */}
                <div className="flex flex-col items-center justify-center bg-gray-50 p-3 rounded-lg min-w-[80px] border border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase">
                    {new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.','')}
                  </span>
                  <span className="text-2xl font-bold text-gray-800">
                    {event.date.split('-')[2]}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.','')}
                  </span>
                </div>

                {/* Conteúdo */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${getTypeColor(event.type)}`}>
                            {event.type}
                        </span>
                        <h3 className="text-lg font-bold text-gray-800 mt-1">{event.title}</h3>
                    </div>
                    {/* AÇÕES: EDITAR E DELETAR */}
                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                        <button 
                            onClick={() => handleEdit(event)} 
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Editar"
                        >
                            <Edit size={18} />
                        </button>
                        <button 
                            onClick={() => handleDelete(event.id!)} 
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Excluir"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                        <Clock size={16} className="text-gray-400"/> {event.time}
                    </div>
                    {event.location && (
                        <div className="flex items-center gap-1">
                            <MapPin size={16} className="text-gray-400"/> {event.location}
                        </div>
                    )}
                  </div>
                  {event.description && <p className="mt-2 text-sm text-gray-600 border-l-2 pl-3 border-gray-200">{event.description}</p>}
                </div>
              </div>
            ))
          )}
        </div>

        {/* COLUNA DA DIREITA: HISTÓRICO */}
        <div>
          <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2 mb-4">
            <CheckCircle size={20} className="text-green-600"/> Realizados
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {pastEvents.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhum histórico recente.</p>}
              {pastEvents.map(event => (
                  <div key={event.id} className="flex gap-3 items-start opacity-60 hover:opacity-100 transition group relative">
                      <div className="w-2 h-2 mt-2 rounded-full bg-gray-300 flex-shrink-0"></div>
                      <div className="flex-1">
                          <p className="text-sm font-bold text-gray-700 line-through">{event.title}</p>
                          <p className="text-xs text-gray-500">
                              {new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR')} • {event.time}
                          </p>
                      </div>
                      {/* Botão de excluir no histórico também */}
                      <button onClick={() => handleDelete(event.id!)} className="hidden group-hover:block text-gray-300 hover:text-red-500 absolute right-0 top-0">
                          <Trash2 size={14}/>
                      </button>
                  </div>
              ))}
          </div>
        </div>

      </div>

      {/* MODAL (SERVE PARA CRIAR E EDITAR) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
                <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>
                
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                    {editingId ? '✏️ Editar Compromisso' : '📅 Agendar Novo'}
                </h2>

                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Título</label>
                        <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: Culto de Santa Ceia" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Data</label>
                            <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3 border rounded-lg" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Hora</label>
                            <input required type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full p-3 border rounded-lg" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Tipo</label>
                        <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-3 border rounded-lg bg-white">
                            <option value="culto">Culto</option>
                            <option value="reuniao">Reunião</option>
                            <option value="visita">Visita Pastoral</option>
                            <option value="evento">Evento Especial</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Local</label>
                        <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full p-3 border rounded-lg" placeholder="Ex: Templo Principal" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Observações</label>
                        <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 border rounded-lg" placeholder="Detalhes adicionais..." />
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg disabled:opacity-70">
                        {loading ? 'Salvando...' : (editingId ? 'Salvar Alterações' : 'Confirmar Agendamento')}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}