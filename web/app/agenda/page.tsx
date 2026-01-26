"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { eventService } from "../../services/eventService";
import { Event } from "../../types/event";
import { 
  Calendar, Clock, MapPin, Plus, Trash2, CheckCircle, X 
} from "lucide-react";

export default function AgendaPage() {
  const router = useRouter();
  const [churchId, setChurchId] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      setEvents(lista);
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await eventService.create({
        churchId,
        title: formData.title,
        date: formData.date,
        time: formData.time,
        type: formData.type as any,
        description: formData.description,
        location: formData.location
      });
      setIsModalOpen(false);
      setFormData({ title: "", date: "", time: "", type: "culto", description: "", location: "" });
      carregarEventos(churchId);
    } catch (error) {
      alert("Erro ao salvar evento");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Cancelar este evento?")) {
      await eventService.delete(id);
      carregarEventos(churchId);
    }
  };

  // Separar eventos futuros e passados
  const hoje = new Date().toISOString().split('T')[0];
  const upcomingEvents = events.filter(e => e.date >= hoje);
  const pastEvents = events.filter(e => e.date < hoje);

  // Cores por tipo
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'culto': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'reuniao': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'visita': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Agenda Pastoral</h1>
          <p className="text-gray-500">Cultos, reuniões e visitas</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
        >
          <Plus size={20} /> Agendar
        </button>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA DA ESQUERDA: PRÓXIMOS EVENTOS */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <Calendar size={20} className="text-blue-600"/> Próximos Compromissos
          </h2>
          
          {upcomingEvents.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center text-gray-400">
              Nenhum evento agendado para os próximos dias.
            </div>
          ) : (
            upcomingEvents.map(event => (
              <div key={event.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 hover:shadow-md transition">
                {/* Data Box */}
                <div className="flex flex-col items-center justify-center bg-gray-50 p-3 rounded-lg min-w-[80px] border border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase">
                    {new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                  </span>
                  <span className="text-2xl font-bold text-gray-800">
                    {event.date.split('-')[2]}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' })}
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
                    <button onClick={() => handleDelete(event.id!)} className="text-gray-300 hover:text-red-500">
                        <Trash2 size={18} />
                    </button>
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
             {pastEvents.length === 0 && <p className="text-sm text-gray-400 text-center">Nenhum histórico.</p>}
             {pastEvents.map(event => (
                 <div key={event.id} className="flex gap-3 items-start opacity-60 hover:opacity-100 transition">
                     <div className="w-2 h-2 mt-2 rounded-full bg-gray-300 flex-shrink-0"></div>
                     <div>
                         <p className="text-sm font-bold text-gray-700 line-through">{event.title}</p>
                         <p className="text-xs text-gray-500">
                             {new Date(event.date).toLocaleDateString('pt-BR')} • {event.time}
                         </p>
                     </div>
                 </div>
             ))}
          </div>
        </div>

      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-800">Agendar Compromisso</h2>
                    <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400" /></button>
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500">Título</label>
                        <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Ex: Culto de Santa Ceia" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500">Data</label>
                            <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-2 border rounded-lg" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500">Hora</label>
                            <input required type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full p-2 border rounded-lg" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500">Tipo</label>
                        <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-2 border rounded-lg bg-white">
                            <option value="culto">Culto</option>
                            <option value="reuniao">Reunião</option>
                            <option value="visita">Visita Pastoral</option>
                            <option value="evento">Evento Especial</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500">Local</label>
                        <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Ex: Templo Principal" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500">Observações</label>
                        <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Detalhes adicionais..." />
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">
                        {loading ? 'Salvando...' : 'Confirmar Agendamento'}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}