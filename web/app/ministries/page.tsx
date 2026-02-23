"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ministryService } from "../../services/ministryService";
import { memberService } from "../../services/memberService";
import { useChurch } from "../../contexts/ChurchContext"; 
import { Ministry } from "../../types/ministry";
import { Member } from "../../types/member";
import { 
  Users, Plus, Pencil, Trash2, Music, Heart, BookOpen, 
  Mic2, X, Search, UserPlus, UserMinus, ShieldCheck, Star, Calendar, ArrowRight, Lock, Loader2 
} from "lucide-react";

export default function Ministries() {
  const router = useRouter();
  
  // Pegamos o 'loading' do auth para garantir que não vamos redirecionar antes da hora
  const { user, userRole, hasPermission, loading: authLoading } = useChurch(); 
  
  const [churchId, setChurchId] = useState("");
  
  // Dados
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal CRIAR/EDITAR
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Modal GERENCIAR EQUIPE
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [searchMember, setSearchMember] = useState("");

  // --- 1. BLINDAGEM DE ROTA ---
  useEffect(() => {
    if (!authLoading) {
        // Lista de quem PODE entrar nesta página
        const allowedRoles = ['admin', 'pastor', 'leader', 'secretary'];
        
        // CORREÇÃO: Garante que userRole é string para o .includes()
        const currentRole = userRole || "";
        const isAllowed = allowedRoles.includes(currentRole) || hasPermission('secretary');

        // Se for membro comum, manda para a home
        if (!isAllowed) {
            router.push("/");
        }
    }
  }, [userRole, authLoading, hasPermission, router]);

  // --- 2. CARREGAMENTO DE DADOS ---
  useEffect(() => {
    const idSalvo = localStorage.getItem("churchId");
    
    // Só carrega se tiver ID, Usuário e o Auth já tiver terminado
    if (idSalvo && user && !authLoading) {
        setChurchId(idSalvo);
        carregarDados(idSalvo);
    }
  }, [user, authLoading]);

  const carregarDados = async (id: string) => {
    try {
        const [listaMin, listaMembros] = await Promise.all([
            ministryService.listByChurch(id),
            memberService.listByChurch(id)
        ]);

        setAllMembers(listaMembros);

        // --- LÓGICA DE FILTRO (LÍDER VÊ APENAS O SEU) ---
        // Encontra o cadastro do usuário logado na lista de membros
        const me = listaMembros.find(m => m.email === user?.email);
        
        const canViewAll = userRole === 'admin' || userRole === 'pastor' || userRole === 'secretary' || hasPermission('secretary');

        if (canViewAll) {
            // Admin vê tudo
            setMinistries(listaMin);
        } else if (userRole === 'leader' && me) {
            // Líder vê apenas onde ele é o líder (leaderId == me.id)
            const myMinistries = listaMin.filter(m => m.leaderId === me.id);
            setMinistries(myMinistries);
        } else {
            // Caso de borda
            setMinistries([]);
        }

    } catch(e) { console.error(e); }
  };

  const countMembers = (ministryId: string) => {
    return allMembers.filter(m => m.ministries?.includes(ministryId)).length;
  };

  const abrirGestaoEquipe = (ministry: Ministry) => {
    setSelectedMinistry(ministry);
    setSearchMember("");
    setIsTeamModalOpen(true);
  };

  const handleAddMemberToMinistry = async (member: Member) => {
    if (!selectedMinistry) return;
    const currentMinistries = member.ministries || [];
    if (currentMinistries.includes(selectedMinistry.id!)) return;
    const newMinistries = [...currentMinistries, selectedMinistry.id!];
    await memberService.update(member.id!, { ministries: newMinistries });
    setAllMembers(prev => prev.map(m => m.id === member.id ? { ...m, ministries: newMinistries } : m));
  };

  const handleRemoveMemberFromMinistry = async (member: Member) => {
    if (!selectedMinistry) return;
    if (selectedMinistry.leaderId === member.id) {
        await ministryService.update(selectedMinistry.id!, { leaderId: null });
        setSelectedMinistry({...selectedMinistry, leaderId: undefined});
        setMinistries(prev => prev.map(m => m.id === selectedMinistry.id ? { ...m, leaderId: undefined } : m));
    }
    const currentMinistries = member.ministries || [];
    const newMinistries = currentMinistries.filter(id => id !== selectedMinistry.id);
    await memberService.update(member.id!, { ministries: newMinistries });
    setAllMembers(prev => prev.map(m => m.id === member.id ? { ...m, ministries: newMinistries } : m));
  };

  const handleSetLeader = async (memberId: string) => {
      if (!selectedMinistry) return;
      const newLeaderId = selectedMinistry.leaderId === memberId ? null : memberId;
      await ministryService.update(selectedMinistry.id!, { leaderId: newLeaderId });
      setSelectedMinistry({ ...selectedMinistry, leaderId: newLeaderId || undefined });
      setMinistries(prev => prev.map(m => m.id === selectedMinistry.id ? { ...m, leaderId: newLeaderId || undefined } : m));
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
      carregarDados(churchId);
    } catch (error) {
      alert("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este ministério?")) {
      await ministryService.delete(id);
      carregarDados(churchId);
    }
  };

  const getRandomIcon = (index: number) => {
    const icons = [Music, Heart, BookOpen, Mic2, Users];
    const IconComponent = icons[index % icons.length];
    return <IconComponent size={24} />;
  };

  const membersInTeam = selectedMinistry 
    ? allMembers.filter(m => m.ministries?.includes(selectedMinistry.id!)) 
    : [];

  const membersNotInTeam = selectedMinistry
    ? allMembers.filter(m => 
        !m.ministries?.includes(selectedMinistry.id!) && 
        m.fullName.toLowerCase().includes(searchMember.toLowerCase())
      )
    : [];

  // Permissão para CRIAR/EDITAR ministérios (Só Admin/Pastor)
  const canManageStructure = userRole === 'admin' || userRole === 'pastor';

  // Se estiver carregando auth, mostra loader
  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* CABEÇALHO */}
      <div className="bg-[#1D4ED8] pt-10 pb-24 px-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  <Users className="text-blue-300"/> Ministérios
                </h1>
                <p className="text-blue-100 text-lg opacity-90">Gestão de departamentos, equipes e escalas.</p>
            </div>
            
            {/* Botão de Criar (Só aparece para Admin/Pastor) */}
            {canManageStructure && (
                <button onClick={() => abrirModal()} className="hidden md:flex bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-xl font-bold transition items-center gap-2">
                    <Plus size={20} /> Nova Equipe
                </button>
            )}
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="max-w-6xl mx-auto px-4 md:px-0 -mt-16 relative z-10">
          
          {canManageStructure && (
              <button onClick={() => abrirModal()} className="md:hidden w-full mb-6 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2">
                 <Plus size={20}/> Criar Nova Equipe
              </button>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Mensagem se não tiver nada */}
            {ministries.length === 0 && (
                <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300 shadow-sm">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock size={30} className="text-gray-400"/>
                    </div>
                    <p className="text-gray-600 font-bold text-lg">Nenhum ministério disponível.</p>
                    <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
                        {userRole === 'leader' 
                            ? "Você ainda não foi definido como líder de nenhum ministério. Peça ao administrador." 
                            : "Nenhum ministério cadastrado na igreja."}
                    </p>
                </div>
            )}

            {ministries.map((m, index) => (
              <div key={m.id} className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition duration-300 group relative flex flex-col">
                
                {/* Ações de Edição (Só Admin/Pastor) */}
                {canManageStructure && (
                    <div className="absolute top-4 right-4 flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10">
                      <button onClick={() => abrirModal(m)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition"><Pencil size={16} /></button>
                      <button onClick={() => handleExcluir(m.id!)} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                    </div>
                )}

                {/* Ícone e Título */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner shrink-0">
                        {getRandomIcon(index)}
                    </div>
                    <div>
                        <Link href={`/ministries/${m.id}`} className="hover:text-blue-600 transition cursor-pointer">
                            <h3 className="text-xl font-bold text-gray-800 leading-tight">{m.name}</h3>
                        </Link>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{countMembers(m.id!)} Membros</span>
                    </div>
                </div>

                <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px] mb-4 leading-relaxed">{m.description || "Sem descrição."}</p>
                
                {/* Badge do Líder */}
                {m.leaderId && (
                    <div className="mb-6 flex items-center gap-2 bg-yellow-50 p-2 rounded-lg border border-yellow-100">
                        <Star size={12} className="text-yellow-600 fill-yellow-600"/>
                        <span className="text-xs font-bold text-yellow-700 truncate">
                            Líder: {allMembers.find(mem => mem.id === m.leaderId)?.fullName || "Desconhecido"}
                        </span>
                    </div>
                )}

                {/* BOTÕES DE AÇÃO */}
                <div className="mt-auto pt-4 border-t border-gray-50 flex gap-2">
                  <button 
                    onClick={() => abrirGestaoEquipe(m)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-50 text-gray-600 font-bold text-xs hover:bg-gray-100 transition flex items-center justify-center gap-2"
                  >
                    <Users size={14}/> Equipe
                  </button>
                  
                  <Link 
                    href={`/ministries/${m.id}`}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-md shadow-blue-200 transition flex items-center justify-center gap-2"
                  >
                    <Calendar size={14}/> Agenda <ArrowRight size={12}/>
                  </Link>
                </div>

              </div>
            ))}
          </div>
      </div>

      {/* --- MODAIS DE GESTÃO --- */}
      
      {/* Modal 1: Criar/Editar (Só renderiza se for Admin/Pastor) */}
      {isModalOpen && canManageStructure && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95">
            <h2 className="text-xl font-bold text-gray-800 mb-6">{editingId ? 'Editar Ministério' : 'Novo Ministério'}</h2>
            <form onSubmit={handleSalvar} className="space-y-4">
              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome da Equipe</label>
                  <input value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border rounded-xl focus:ring-2 ring-blue-100 outline-none" placeholder="Ex: Louvor" required />
              </div>
              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Descrição</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 border rounded-xl focus:ring-2 ring-blue-100 outline-none" placeholder="Objetivo do grupo..." rows={3}/>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition">{loading ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Gerenciar Equipe */}
      {isTeamModalOpen && selectedMinistry && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl h-[650px] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Gerenciar Equipe</h2>
                <p className="text-sm text-blue-600 font-bold flex items-center gap-1"><ShieldCheck size={14}/> {selectedMinistry.name}</p>
              </div>
              <button onClick={() => setIsTeamModalOpen(false)} className="bg-gray-200 hover:bg-red-100 hover:text-red-500 p-2 rounded-full transition"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              <div className="flex-1 p-6 overflow-y-auto border-r border-gray-100 bg-white custom-scrollbar">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider">Membros Atuais ({membersInTeam.length})</h3>
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 mb-4 text-xs text-yellow-800">💡 Clique na <strong>Estrela</strong> para definir o Líder.</div>
                {membersInTeam.length === 0 && <div className="text-center py-10 opacity-50"><Users size={40} className="mx-auto mb-2 text-gray-300"/><p className="text-sm text-gray-400 italic">Equipe vazia.</p></div>}
                <div className="space-y-2">
                  {membersInTeam.map(member => (
                    <div key={member.id} className={`flex justify-between items-center p-3 rounded-xl transition border ${selectedMinistry.leaderId === member.id ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}>
                      <div className="flex items-center gap-3">
                          <button onClick={() => handleSetLeader(member.id!)} className={`p-1 rounded hover:bg-black/5 transition ${selectedMinistry.leaderId === member.id ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`} title="Definir como Líder"><Star size={18} fill={selectedMinistry.leaderId === member.id ? "currentColor" : "none"} /></button>
                          <div><span className={`text-sm font-bold ${selectedMinistry.leaderId === member.id ? 'text-yellow-800' : 'text-gray-700'}`}>{member.fullName}</span>{selectedMinistry.leaderId === member.id && <p className="text-[10px] text-yellow-600 font-bold uppercase">Líder</p>}</div>
                      </div>
                      <button onClick={() => handleRemoveMemberFromMinistry(member)} className="text-gray-400 hover:text-red-600 p-2 bg-white rounded-lg shadow-sm hover:shadow transition" title="Remover da equipe"><UserMinus size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 p-6 bg-gray-50/50 overflow-y-auto custom-scrollbar">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider">Adicionar Membro</h3>
                <div className="relative mb-4"><Search className="absolute left-3 top-3 text-gray-400" size={18} /><input type="text" placeholder="Buscar nome..." value={searchMember} onChange={(e) => setSearchMember(e.target.value)} className="w-full pl-10 p-3 border rounded-xl text-sm focus:ring-2 ring-blue-100 outline-none bg-white shadow-sm"/></div>
                <div className="space-y-2">
                  {membersNotInTeam.slice(0, 10).map(member => (
                    <div key={member.id} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-300 transition shadow-sm group">
                      <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]">{member.fullName}</span>
                      <button onClick={() => handleAddMemberToMinistry(member)} className="text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-50 p-1.5 rounded-lg transition"><UserPlus size={18} /></button>
                    </div>
                  ))}
                  {searchMember && membersNotInTeam.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Ninguém encontrad.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}