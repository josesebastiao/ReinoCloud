"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ministryService } from "../../../services/ministryService"; // Note os 3 niveis (../../../)
import { scaleService } from "../../../services/scaleService";
import { memberService } from "../../../services/memberService";
import { Ministry } from "../../../types/ministry";
import { Scale } from "../../../types/scale";
import { Member } from "../../../types/member";
import { Calendar, User, ArrowLeft, Plus, Trash2, CheckCircle } from "lucide-react";

export default function MinistryDetails() {
  const params = useParams();
  const router = useRouter();
  const ministryId = params.id as string;

  const [ministry, setMinistry] = useState<Ministry | null>(null);
  const [teamMembers, setTeamMembers] = useState<Member[]>([]);
  const [scales, setScales] = useState<Scale[]>([]);
  const [activeTab, setActiveTab] = useState<'members' | 'scales'>('scales');

  // Modal de Nova Escala
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newScale, setNewScale] = useState({ date: "", title: "", members: [] as string[] });

  useEffect(() => {
    if (ministryId) carregarDados();
  }, [ministryId]);

  const carregarDados = async () => {
    try {
      // 1. Dados do Ministério
      // Precisamos buscar TODOS e filtrar pq o firebase não busca 1 só sem custo extra as vezes, 
      // mas aqui vamos simplificar buscando a lista da igreja e achando o certo na memória
      // (Num app maior, fariamos ministryService.getById)
      const churchId = localStorage.getItem("churchId");
      if(!churchId) return;

      const allMinistries = await ministryService.listByChurch(churchId);
      const current = allMinistries.find(m => m.id === ministryId);
      setMinistry(current || null);

      // 2. Membros da Equipe
      const allMembers = await memberService.listByChurch(churchId);
      const team = allMembers.filter(m => m.ministries?.includes(ministryId));
      setTeamMembers(team);

      // 3. Escalas
      const ministryScales = await scaleService.listByMinistry(ministryId);
      setScales(ministryScales);

    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateScale = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newScale.date || !newScale.title) return;

    await scaleService.create({
      ministryId,
      date: newScale.date,
      title: newScale.title,
      members: newScale.members
    });

    setIsModalOpen(false);
    setNewScale({ date: "", title: "", members: [] });
    carregarDados();
    alert("✅ Escala criada!");
  };

  const handleDeleteScale = async (id: string) => {
    if(confirm("Excluir esta escala?")) {
      await scaleService.delete(id);
      carregarDados();
    }
  };

  const toggleMemberInScale = (memberId: string) => {
    setNewScale(prev => {
      const exists = prev.members.includes(memberId);
      if(exists) return { ...prev, members: prev.members.filter(id => id !== memberId) };
      return { ...prev, members: [...prev.members, memberId] };
    });
  };

  if (!ministry) return <div className="p-8">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Cabeçalho */}
      <div className="max-w-4xl mx-auto mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-blue-600 flex items-center gap-2 mb-4 text-sm">
          <ArrowLeft size={16} /> Voltar para Ministérios
        </button>
        
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{ministry.name}</h1>
            <p className="text-gray-500">{ministry.description || "Gestão de equipe e escalas"}</p>
          </div>
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
            {teamMembers.length} Membros
          </div>
        </div>

        {/* Abas */}
        <div className="flex gap-6 mt-8 border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('scales')}
            className={`pb-3 px-2 text-sm font-medium transition ${activeTab === 'scales' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Escalas e Agenda
          </button>
          <button 
            onClick={() => setActiveTab('members')}
            className={`pb-3 px-2 text-sm font-medium transition ${activeTab === 'members' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Membros da Equipe
          </button>
        </div>
      </div>

      {/* Conteúdo das Abas */}
      <div className="max-w-4xl mx-auto mt-6">
        
        {/* ABA: ESCALAS */}
        {activeTab === 'scales' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-700">Próximos Eventos</h2>
              <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700">
                <Plus size={16} /> Criar Escala
              </button>
            </div>

            <div className="space-y-4">
              {scales.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg border border-dashed text-gray-400">
                  Nenhuma escala agendada.
                </div>
              ) : (
                scales.map(scale => (
                  <div key={scale.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar size={18} className="text-blue-500" />
                        <span className="font-bold text-gray-800">
                          {new Date(scale.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="text-gray-600 font-medium">{scale.title}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        {scale.members.map(memId => {
                          const mem = teamMembers.find(m => m.id === memId);
                          return mem ? (
                            <span key={memId} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded border">
                              {mem.fullName}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                    
                    <button onClick={() => handleDeleteScale(scale.id!)} className="text-gray-400 hover:text-red-500 self-start">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ABA: MEMBROS (Visualização simples) */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
             {teamMembers.map(member => (
               <div key={member.id} className="p-4 border-b border-gray-100 last:border-0 flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                    {member.fullName.charAt(0)}
                 </div>
                 <span>{member.fullName}</span>
               </div>
             ))}
             {teamMembers.length === 0 && <div className="p-8 text-center text-gray-400">Equipe vazia.</div>}
          </div>
        )}
      </div>

      {/* MODAL: NOVA ESCALA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold mb-4">Agendar Escala</h2>
            <form onSubmit={handleCreateScale} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500">Data</label>
                  <input type="date" className="w-full p-2 border rounded" value={newScale.date} onChange={e => setNewScale({...newScale, date: e.target.value})} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Evento</label>
                  <input type="text" className="w-full p-2 border rounded" placeholder="Ex: Culto Domingo" value={newScale.title} onChange={e => setNewScale({...newScale, title: e.target.value})} required />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">Quem vai participar?</label>
                <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                  {teamMembers.map(member => (
                    <div 
                      key={member.id} 
                      onClick={() => toggleMemberInScale(member.id!)}
                      className={`p-2 rounded flex items-center gap-2 cursor-pointer border ${newScale.members.includes(member.id!) ? 'bg-blue-50 border-blue-200' : 'border-transparent hover:bg-gray-50'}`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${newScale.members.includes(member.id!) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                        {newScale.members.includes(member.id!) && <CheckCircle size={12} className="text-white" />}
                      </div>
                      <span className="text-sm">{member.fullName}</span>
                    </div>
                  ))}
                  {teamMembers.length === 0 && <p className="text-xs text-red-500">Adicione membros à equipe primeiro.</p>}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border rounded">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded">Salvar Escala</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}