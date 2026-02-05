"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ministryService } from "../../../services/ministryService"; 
import { scaleService } from "../../../services/scaleService";
import { memberService } from "../../../services/memberService";
import { useChurch } from "../../../contexts/ChurchContext";
import { Ministry } from "../../../types/ministry";
import { Scale } from "../../../types/scale";
import { Member } from "../../../types/member";
import { Calendar, User, ArrowLeft, Plus, Trash2, Crown, AlertTriangle } from "lucide-react";

export default function MinistryDetails() {
  const params = useParams();
  const router = useRouter();
  const { user, userRole } = useChurch();
  const ministryId = params.id as string;

  const [ministry, setMinistry] = useState<Ministry | null>(null);
  const [teamMembers, setTeamMembers] = useState<Member[]>([]);
  const [scales, setScales] = useState<Scale[]>([]);
  const [activeTab, setActiveTab] = useState<'members' | 'scales'>('scales');
  const [leaderName, setLeaderName] = useState("");

  const [isLeader, setIsLeader] = useState(false);
  const canEdit = userRole === 'admin' || isLeader;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newScale, setNewScale] = useState({ date: "", title: "", members: [] as string[] });

  useEffect(() => {
    if (ministryId) carregarDados();
  }, [ministryId, user]);

  const carregarDados = async () => {
    try {
      const churchId = localStorage.getItem("churchId");
      if(!churchId) return;

      const [allMinistries, allMembers] = await Promise.all([
          ministryService.listByChurch(churchId),
          memberService.listByChurch(churchId)
      ]);

      const currentMinistry = allMinistries.find(m => m.id === ministryId);
      if (!currentMinistry) return;
      
      setMinistry(currentMinistry);

      const team = allMembers.filter(m => m.ministries?.includes(ministryId));
      setTeamMembers(team);

      if (currentMinistry.leaderId) {
          const leader = allMembers.find(m => m.id === currentMinistry.leaderId);
          setLeaderName(leader?.fullName || "Não definido");
          if (user?.email && leader?.email === user.email) {
              setIsLeader(true);
          }
      }

      const ministryScales = await scaleService.listByMinistry(ministryId);
      ministryScales.sort((a:any, b:any) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
    alert("✅ Escala criada com sucesso!");
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

  if (!ministry) return <div className="flex justify-center p-10">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      
      <div className="max-w-4xl mx-auto mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-blue-600 flex items-center gap-2 mb-4 text-sm font-bold transition">
          <ArrowLeft size={18} /> Voltar para Ministérios
        </button>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">{ministry.name}</h1>
            <p className="text-gray-500 text-sm mb-3">{ministry.description || "Gestão de equipe e escalas"}</p>
            
            <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-yellow-100">
                <Crown size={14} className="fill-yellow-500 text-yellow-600"/>
                Líder: {leaderName}
            </div>
          </div>

          <div className="flex gap-3">
             <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold border border-blue-100 flex flex-col items-center">
                <span className="text-xl leading-none">{teamMembers.length}</span>
                <span className="text-[10px] uppercase">Membros</span>
             </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6 p-1 bg-gray-200/50 rounded-xl w-fit">
          <button onClick={() => setActiveTab('scales')} className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'scales' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Escalas</button>
          <button onClick={() => setActiveTab('members')} className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'members' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Equipe</button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-6">
        
        {/* ABA: ESCALAS */}
        {activeTab === 'scales' && (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2"><Calendar size={20}/> Agenda</h2>
              {canEdit && (
                  <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 transition">
                    <Plus size={18} /> Nova Escala
                  </button>
              )}
            </div>

            <div className="space-y-4">
              {scales.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300">
                  <Calendar size={40} className="mx-auto mb-2 text-gray-300"/>
                  <p className="text-gray-400 font-medium">Nenhuma escala agendada.</p>
                  {canEdit && <p className="text-xs text-gray-400 mt-1">Clique em "Nova Escala" para começar.</p>}
                </div>
              ) : (
                scales.map(scale => {
                  const scaleDate = new Date(scale.date + 'T12:00:00');
                  const isPast = scaleDate < new Date();

                  return (
                    <div key={scale.id} className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-4 transition hover:shadow-md ${isPast ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold border ${isPast ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                             <span className="text-lg leading-none">{scaleDate.getDate()}</span>
                             <span className="text-[10px] uppercase">{scaleDate.toLocaleDateString('pt-BR', {month:'short'}).replace('.','')}</span>
                          </div>
                          <div>
                              <h3 className="font-bold text-gray-800 text-lg">{scale.title}</h3>
                              <p className="text-xs text-gray-500 uppercase font-bold">{scaleDate.toLocaleDateString('pt-BR', {weekday: 'long'})}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-2 pl-2 border-l-2 border-gray-100">
                          {scale.members.map(memId => {
                            const mem = teamMembers.find(m => m.id === memId);
                            return mem ? (
                              <span key={memId} className="bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded-md font-medium border border-gray-200 flex items-center gap-1">
                                <User size={10}/> {mem.fullName}
                              </span>
                            ) : null;
                          })}
                          {scale.members.length === 0 && <span className="text-xs text-red-400 italic">Ninguém escalado</span>}
                        </div>
                      </div>
                      
                      {canEdit && (
                          <button onClick={() => handleDeleteScale(scale.id!)} className="text-gray-300 hover:text-red-500 self-start p-2 hover:bg-red-50 rounded-lg transition">
                            <Trash2 size={20} />
                          </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ABA: MEMBROS */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 shadow-sm">
             {teamMembers.map(member => (
               <div key={member.id} className="p-4 border-b border-gray-100 last:border-0 flex items-center justify-between hover:bg-gray-50 transition">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200">
                       {member.photoUrl ? <img src={member.photoUrl} className="w-full h-full object-cover"/> : <User size={20}/>}
                    </div>
                    <div>
                        <p className="font-bold text-gray-800 text-sm">{member.fullName}</p>
                        <p className="text-xs text-gray-400">{member.phone || "Sem telefone"}</p>
                    </div>
                 </div>
                 
                 {ministry.leaderId === member.id && (
                     <div className="bg-yellow-100 text-yellow-700 p-2 rounded-lg" title="Líder da Equipe">
                         <Crown size={18} className="fill-yellow-500"/>
                     </div>
                 )}
               </div>
             ))}
             {teamMembers.length === 0 && <div className="p-10 text-center text-gray-400 italic">Equipe vazia.</div>}
          </div>
        )}
      </div>

      {/* MODAL: NOVA ESCALA (COM VERIFICAÇÃO DE INDISPONIBILIDADE) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-in zoom-in-95">
            <h2 className="text-xl font-bold mb-6 text-gray-800">Agendar Escala</h2>
            <form onSubmit={handleCreateScale} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Data</label>
                  <input type="date" className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 ring-blue-100" value={newScale.date} onChange={e => setNewScale({...newScale, date: e.target.value})} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Evento</label>
                  <input type="text" className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 ring-blue-100" placeholder="Ex: Culto Domingo" value={newScale.title} onChange={e => setNewScale({...newScale, title: e.target.value})} required />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 ml-1 block uppercase">Quem vai participar?</label>
                <div className="max-h-48 overflow-y-auto border rounded-xl p-2 space-y-1 custom-scrollbar bg-gray-50">
                  {teamMembers.map(member => {
                    // VERIFICAÇÃO DE INDISPONIBILIDADE
                    const isUnavailable = newScale.date && member.unavailableDates?.includes(newScale.date);

                    return (
                      <div 
                        key={member.id} 
                        onClick={() => toggleMemberInScale(member.id!)}
                        className={`p-3 rounded-lg flex items-center justify-between gap-3 cursor-pointer border transition ${newScale.members.includes(member.id!) ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white border-transparent hover:bg-gray-100 text-gray-600'} ${isUnavailable ? 'opacity-60 grayscale' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${newScale.members.includes(member.id!) ? 'bg-white border-white' : 'bg-gray-100 border-gray-300'}`}>
                              {newScale.members.includes(member.id!) && <div className="w-3 h-3 bg-blue-600 rounded-sm" />}
                            </div>
                            <span className="text-sm font-bold">{member.fullName}</span>
                        </div>
                        
                        {/* AVISO DE INDISPONÍVEL */}
                        {isUnavailable && (
                            <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded flex items-center gap-1">
                                <AlertTriangle size={10} /> Indisponível
                            </span>
                        )}
                      </div>
                    );
                  })}
                  {teamMembers.length === 0 && <p className="text-xs text-red-500 text-center py-4">Adicione membros à equipe primeiro.</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition">Salvar Escala</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}