"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // <--- NOVO IMPORT AQUI
import { ministryService } from "../../services/ministryService";
import { memberService } from "../../services/memberService";
import { Ministry } from "../../types/ministry";
import { Member } from "../../types/member";
import { Users, Plus, Pencil, Trash2, Music, Heart, BookOpen, Mic2, X, Search, UserPlus, UserMinus } from "lucide-react";

export default function Ministries() {
  const router = useRouter();
  const [churchId, setChurchId] = useState("");
  
  // Dados
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal CRIAR/EDITAR Ministério
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Modal GERENCIAR EQUIPE
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [searchMember, setSearchMember] = useState("");

  useEffect(() => {
    const idSalvo = localStorage.getItem("churchId");
    if (!idSalvo) {
      router.push("/login");
      return;
    }
    setChurchId(idSalvo);
    carregarDados(idSalvo);
  }, [router]);

  const carregarDados = async (id: string) => {
    const [listaMin, listaMembros] = await Promise.all([
      ministryService.listByChurch(id),
      memberService.listByChurch(id)
    ]);
    setMinistries(listaMin);
    setAllMembers(listaMembros);
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
    const newMinistries = [...currentMinistries, selectedMinistry.id!];

    await memberService.update(member.id!, { ministries: newMinistries });
    carregarDados(churchId);
  };

  const handleRemoveMemberFromMinistry = async (member: Member) => {
    if (!selectedMinistry) return;

    const currentMinistries = member.ministries || [];
    const newMinistries = currentMinistries.filter(id => id !== selectedMinistry.id);

    await memberService.update(member.id!, { ministries: newMinistries });
    carregarDados(churchId);
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
    if (confirm("Tem certeza?")) {
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ministérios</h1>
          <p className="text-gray-500">Gerencie as equipes da igreja</p>
        </div>
        <button onClick={() => abrirModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={20} /> Nova Equipe
        </button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ministries.map((m, index) => (
          <div key={m.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group relative flex flex-col">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => abrirModal(m)} className="p-1.5 text-gray-400 hover:text-blue-600 bg-gray-50 rounded"><Pencil size={16} /></button>
              <button onClick={() => handleExcluir(m.id!)} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 rounded"><Trash2 size={16} /></button>
            </div>

            <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              {getRandomIcon(index)}
            </div>
            
            {/* AQUI ESTÁ A MUDANÇA: O Título agora é um Link clicável */}
            <Link href={`/ministries/${m.id}`} className="hover:underline cursor-pointer block">
                <h3 className="text-lg font-bold text-gray-800 mb-1">{m.name}</h3>
            </Link>

            <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px] mb-4">{m.description || "Sem descrição."}</p>
            
            <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
              <span className="text-xs font-medium text-gray-400 uppercase">Membros: {countMembers(m.id!)}</span>
              
              <button 
                onClick={() => abrirGestaoEquipe(m)}
                className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition font-medium flex items-center gap-1"
              >
                <Users size={12}/> Gerenciar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL 1: CRIAR/EDITAR MINISTÉRIO --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">{editingId ? 'Editar' : 'Novo'}</h2>
            <form onSubmit={handleSalvar} className="space-y-4">
              <input value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="Nome" required />
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="Descrição" rows={3}/>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg">{loading ? '...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: GERENCIAR EQUIPE --- */}
      {isTeamModalOpen && selectedMinistry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden">
            
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Gerenciar Equipe</h2>
                <p className="text-sm text-blue-600 font-medium">{selectedMinistry.name}</p>
              </div>
              <button onClick={() => setIsTeamModalOpen(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              <div className="flex-1 p-4 overflow-y-auto border-r border-gray-100 bg-white">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Membros Atuais ({membersInTeam.length})</h3>
                {membersInTeam.length === 0 && <p className="text-sm text-gray-400 italic">Ninguém nesta equipe ainda.</p>}
                
                <div className="space-y-2">
                  {membersInTeam.map(member => (
                    <div key={member.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg group">
                      <span className="text-sm font-medium text-gray-700">{member.fullName}</span>
                      <button 
                        onClick={() => handleRemoveMemberFromMinistry(member)}
                        className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                        title="Remover da equipe"
                      >
                        <UserMinus size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 p-4 bg-gray-50 overflow-y-auto">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Adicionar Membro</h3>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Buscar para adicionar..." 
                    value={searchMember}
                    onChange={(e) => setSearchMember(e.target.value)}
                    className="w-full pl-9 p-2 border rounded-lg text-sm"
                  />
                </div>

                <div className="space-y-2">
                  {membersNotInTeam.slice(0, 10).map(member => (
                    <div key={member.id} className="flex justify-between items-center p-2 bg-white border border-gray-100 rounded-lg hover:border-blue-300 transition">
                      <span className="text-sm text-gray-700 truncate max-w-[150px]">{member.fullName}</span>
                      <button 
                        onClick={() => handleAddMemberToMinistry(member)}
                        className="text-blue-600 hover:bg-blue-50 p-1 rounded transition"
                      >
                        <UserPlus size={16} />
                      </button>
                    </div>
                  ))}
                  {searchMember && membersNotInTeam.length === 0 && (
                    <p className="text-sm text-gray-400 text-center">Ninguém encontrado.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}