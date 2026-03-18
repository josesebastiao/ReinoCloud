"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ministryService } from "../../services/ministryService";
import { memberService } from "../../services/memberService";
import { useChurch } from "../../contexts/ChurchContext";
import { Ministry } from "../../types/ministry";
import { Member } from "../../types/member";
import { Music, Plus, Users, Search, Loader2, X, Star, Calendar, Trash2 } from "lucide-react";

export default function MinistriesPage() {
  const router = useRouter();
  const { churchId, userRole, hasPermission, userName } = useChurch();

  const [loading, setLoading] = useState(true);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  // Estados do Modal de Criar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMinistry, setNewMinistry] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  // Estados do Modal de Líder
  const [isLeaderModalOpen, setIsLeaderModalOpen] = useState(false);
  const [selectedMinistryId, setSelectedMinistryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const canManage = userRole === 'admin' || userRole === 'pastor' || userRole === 'secretary' || hasPermission('secretary');

  useEffect(() => {
    if (churchId) {
      loadData();
    }
  }, [churchId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allMinistries, allMembers] = await Promise.all([
        ministryService.listByChurch(churchId!),
        memberService.listByChurch(churchId!)
      ]);
      setMinistries(allMinistries);
      setMembers(allMembers);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId || !newMinistry.name.trim()) return;

    setSaving(true);
    try {
      await ministryService.create({
        churchId,
        name: newMinistry.name,
        description: newMinistry.description,
      });
      setIsModalOpen(false);
      setNewMinistry({ name: "", description: "" });
      loadData();
    } catch (error) {
      console.error(error);
      alert("Erro ao criar ministério.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja apagar a equipe "${name}"? Todas as escalas serão perdidas.`)) {
      try {
        await ministryService.delete(id);
        loadData();
      } catch (error) {
        console.error(error);
        alert("Erro ao excluir.");
      }
    }
  };

  const handleSetLeader = async (memberId: string, memberName: string) => {
    if (!selectedMinistryId) return;
    try {
      // CORREÇÃO TS AQUI: 'as any' para aceitar o leaderName
      await ministryService.update(selectedMinistryId, {
        leaderId: memberId,
        leaderName: memberName
      } as any);
      
      setIsLeaderModalOpen(false);
      setSearchTerm("");
      loadData();
    } catch (error) {
      console.error(error);
      alert("Erro ao definir líder.");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
  }

  let visibleMinistries = ministries;
  
  if (!canManage) {
      const me = members.find(m => m.fullName === userName);
      if (me) {
          // CORREÇÃO TS AQUI: Forçando a leitura como any para ignorar a tipagem estrita
          visibleMinistries = ministries.filter((m: any) => 
              m.leaderId === me.id || 
              m.leaderName === me.fullName || 
              m.leaderName === userName
          );
      } else {
          visibleMinistries = ministries.filter((m: any) => m.leaderName === userName);
      }
  }

  const filteredMembers = members.filter(m =>
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <div className="bg-blue-800 pt-10 pb-32 px-4 md:px-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Users className="text-blue-300" size={32} /> Ministérios
            </h1>
            <p className="text-blue-100 text-lg opacity-90">Gestão de departamentos, equipes e escalas.</p>
          </div>
          {canManage && (
            <button onClick={() => setIsModalOpen(true)} className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition shadow-sm backdrop-blur-sm">
              <Plus size={20} /> Nova Equipe
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-0 -mt-20 relative z-10">
        {visibleMinistries.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Users size={40} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-700">Nenhum ministério disponível.</h3>
            <p className="text-gray-400 mt-2 max-w-md">
              {canManage
                ? "Clique no botão 'Nova Equipe' acima para começar a organizar os departamentos da igreja."
                : "Você ainda não foi definido como líder de nenhum ministério. Peça ao administrador."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleMinistries.map((ministry: any) => {
              const teamSize = members.filter(m => m.ministries?.includes(ministry.id)).length;

              return (
                <div key={ministry.id} className="bg-white rounded-3xl p-6 shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col h-full hover:-translate-y-1 transition duration-300 group">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition border border-blue-100">
                      <Music size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-800 truncate leading-tight" title={ministry.name}>{ministry.name}</h3>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">{teamSize} MEMBROS</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-6 flex-1 line-clamp-2">{ministry.description || "Sem descrição."}</p>

                  <div className="mt-auto space-y-3">
                    <div
                      onClick={() => {
                        if (canManage) {
                          setSelectedMinistryId(ministry.id);
                          setIsLeaderModalOpen(true);
                        }
                      }}
                      className={`p-3 rounded-xl flex items-center gap-2 text-xs font-bold border transition ${ministry.leaderId ? 'bg-yellow-50 border-yellow-100 text-yellow-700' : 'bg-gray-50 border-gray-200 text-gray-500'} ${canManage ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}
                      title={canManage ? "Clique para alterar o líder" : "Líder atual"}
                    >
                      <Star size={16} className={ministry.leaderId ? "fill-yellow-500 text-yellow-600" : ""} />
                      Líder: {ministry.leaderName || "Não definido"}
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => router.push(`/ministries/${ministry.id}`)} className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-xs rounded-xl transition flex justify-center items-center gap-2 border border-gray-200">
                        <Users size={16} /> Equipe
                      </button>
                      <button onClick={() => router.push(`/ministries/${ministry.id}`)} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-200 transition flex justify-center items-center gap-2">
                        <Calendar size={16} /> Agenda &rarr;
                      </button>
                      {canManage && (
                        <button onClick={() => handleDelete(ministry.id, ministry.name)} className="px-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition border border-red-100">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Plus className="text-blue-600" /> Nova Equipe</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition bg-white p-2 rounded-full shadow-sm"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block ml-1">Nome do Departamento</label>
                <input required type="text" value={newMinistry.name} onChange={e => setNewMinistry({ ...newMinistry, name: e.target.value })} className="w-full p-3.5 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 ring-blue-50 transition bg-gray-50 focus:bg-white" placeholder="Ex: Coral, Diaconato, Louvor..." />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block ml-1">Descrição (Opcional)</label>
                <textarea rows={3} value={newMinistry.description} onChange={e => setNewMinistry({ ...newMinistry, description: e.target.value })} className="w-full p-3.5 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 ring-blue-50 transition resize-none bg-gray-50 focus:bg-white" placeholder="Qual o propósito desta equipe?" />
              </div>
              <button type="submit" disabled={saving} className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 transition flex items-center justify-center gap-2 disabled:opacity-70 mt-2">
                {saving ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Equipe'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isLeaderModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 h-[80vh] md:h-auto max-h-[600px] flex flex-col">
            <div className="bg-yellow-50 p-6 border-b border-yellow-100 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold text-yellow-800 flex items-center gap-2"><Star className="fill-yellow-500 text-yellow-600" /> Eleger Líder</h2>
                <p className="text-xs font-bold text-yellow-600/70 mt-1 uppercase">Selecione o responsável</p>
              </div>
              <button onClick={() => setIsLeaderModalOpen(false)} className="text-yellow-600/50 hover:text-yellow-700 transition bg-white p-2 rounded-full shadow-sm"><X size={20} /></button>
            </div>

            <div className="p-6 pb-2 shrink-0">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Buscar por nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-yellow-400 focus:bg-white transition text-sm font-medium" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pt-2 space-y-2 custom-scrollbar">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">Nenhum membro encontrado.</div>
              ) : (
                filteredMembers.map(member => (
                  <button key={member.id} onClick={() => handleSetLeader(member.id!, member.fullName)} className="w-full p-4 rounded-2xl border border-gray-100 bg-white hover:border-yellow-300 hover:bg-yellow-50 hover:shadow-md transition flex items-center gap-4 text-left group">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden shrink-0 group-hover:bg-white group-hover:border group-hover:border-yellow-200 transition">
                      {member.photoUrl ? <img src={member.photoUrl} className="w-full h-full object-cover" /> : <Users size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm group-hover:text-yellow-800 transition">{member.fullName}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{member.role === 'admin' ? 'Pastor' : member.role === 'leader' ? 'Líder' : 'Membro'}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}