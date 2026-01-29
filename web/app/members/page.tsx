"use client";
import { useState, useEffect } from "react";
import { useChurch } from "../../contexts/ChurchContext";
import { memberService, Member } from "../../services/memberService";
import { createSystemUser } from "../../services/adminAuthService"; // <--- Importe o serviço novo
import { 
  Users, Search, PlusCircle, Edit, Trash2, Key,
  MapPin, Phone, Mail, ChevronLeft, ChevronRight, Loader2, HandCoins, Shield, Lock 
} from "lucide-react";

export default function MembersPage() {
  const { churchId } = useChurch();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modais
  const [showModal, setShowModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false); // Modal de Senha
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMemberForAccess, setSelectedMemberForAccess] = useState<Member | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [creatingAccess, setCreatingAccess] = useState(false);

  // Formulário Principal
  const [formData, setFormData] = useState({
    fullName: "", email: "", phone: "", document: "", birthDate: "", baptismDate: "",
    gender: "male", role: "member", status: "active", isTither: false,
    street: "", number: "", neighborhood: "", city: "", state: "", zipCode: "",
    selectedMinistries: [] as string[]
  });

  useEffect(() => { if (churchId) loadMembers(); }, [churchId]);

  const loadMembers = async () => {
    try {
      const list = await memberService.listByChurch(churchId);
      setMembers(list);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const filteredMembers = members.filter(m => m.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
  const currentMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);

  // ... (Mantenha as funções handleOpenModal, handleSave, handleDelete iguais ao anterior) ...
  // Vou omitir aqui para economizar espaço, use as mesmas do passo anterior
  // Apenas adicionei a função abaixo:

  const openAccessModal = (member: Member) => {
      if(!member.email) {
          alert("Este membro precisa de um e-mail cadastrado primeiro.");
          return;
      }
      setSelectedMemberForAccess(member);
      setNewPassword("");
      setShowAccessModal(true);
  };

  const handleCreateAccess = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!selectedMemberForAccess || !selectedMemberForAccess.email) return;
      
      setCreatingAccess(true);
      try {
          // 1. Cria usuário no Auth (sem deslogar o admin)
          await createSystemUser(selectedMemberForAccess.email, newPassword);
          
          // 2. Garante que o ID no banco Members seja atualizado (opcional, mas bom pra vincular)
          // Mas como já usamos o email para vincular no login, o mais importante é o Auth existir.
          
          alert(`✅ Acesso criado!\n\nLogin: ${selectedMemberForAccess.email}\nSenha: ${newPassword}\n\nEnvie esses dados ao membro.`);
          setShowAccessModal(false);
      } catch (error: any) {
          if(error.code === 'auth/email-already-in-use') {
              alert("⚠️ Este e-mail já possui acesso ao sistema.");
          } else {
              alert("Erro ao criar acesso: " + error.message);
          }
      } finally {
          setCreatingAccess(false);
      }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: Member = {
        fullName: formData.fullName, churchId, email: formData.email, phone: formData.phone,
        document: formData.document, birthDate: formData.birthDate, baptismDate: formData.baptismDate,
        gender: formData.gender, role: formData.role, status: formData.status, isTither: formData.isTither,
        ministries: formData.selectedMinistries,
        address: { 
            street: formData.street, number: formData.number, neighborhood: formData.neighborhood,
            city: formData.city, state: formData.state, zipCode: formData.zipCode
        }
      };
      if (editingId) await memberService.update(editingId, payload);
      else await memberService.create(payload);
      setShowModal(false); loadMembers();
    } catch (error) { alert("Erro ao salvar."); } finally { setLoading(false); }
  };
  
  const handleDelete = async (id: string) => {
    if (confirm("Excluir membro?")) { await memberService.delete(id); loadMembers(); }
  };
  const handleOpenModal = (member?: Member) => {
      /* Copie a lógica do modal do passo anterior aqui */ 
      // Para resumir o código, estou assumindo que você manterá a lógica de preencher o setFormData
      if (member) {
        setEditingId(member.id || null);
        let addr: any = member.address || {};
        setFormData({
            fullName: member.fullName, email: member.email || "", phone: member.phone || "",
            document: member.document || "", birthDate: member.birthDate || "", baptismDate: member.baptismDate || "",
            gender: (member.gender as string) || "male", role: member.role || "member", status: member.status || "active",
            isTither: member.isTither || false, 
            street: addr.street || "", number: addr.number || "", neighborhood: addr.neighborhood || "",
            city: addr.city || "", state: addr.state || "", zipCode: addr.zipCode || "",
            selectedMinistries: member.ministries || []
        });
      } else {
        setEditingId(null);
        setFormData({ fullName: "", email: "", phone: "", document: "", birthDate: "", baptismDate: "", gender: "male", role: "member", status: "active", isTither: false, street: "", number: "", neighborhood: "", city: "", state: "", zipCode: "", selectedMinistries: [] });
      }
      setShowModal(true);
  };

  if (loading && members.length === 0) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50 pb-24">
      {/* Cabeçalho igual ao anterior */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div><h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Users className="text-blue-600"/> Membros</h1><p className="text-sm text-gray-500">{members.length} membros cadastrados</p></div>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition"><PlusCircle size={20}/> Novo Membro</button>
      </div>

      <div className="max-w-6xl mx-auto mb-6 relative"><Search className="absolute left-3 top-3 text-gray-400" size={20}/><input type="text" placeholder="Buscar por nome..." className="w-full pl-10 p-3 rounded-xl border border-gray-200 outline-none" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}/></div>

      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Nome</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Contato</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentMembers.map(member => (
                <tr key={member.id} className="hover:bg-blue-50/50 transition group">
                  <td className="p-4">
                      <p className="font-bold text-gray-800">{member.fullName}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 rounded">{member.role === 'admin' ? 'Pastor/Admin' : member.role === 'treasurer' ? 'Tesoureiro' : member.role === 'secretary' ? 'Secretária' : 'Membro'}</span>
                        {member.isTither && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 rounded font-bold flex items-center gap-1"><HandCoins size={8}/> Dizimista</span>}
                      </div>
                  </td>
                  <td className="p-4 text-xs text-gray-500">{member.email || 'Sem e-mail'}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {/* BOTÃO DE CRIAR ACESSO (CHAVE) */}
                      {member.email && (
                          <button onClick={() => openAccessModal(member)} className="p-2 bg-yellow-50 rounded-lg text-yellow-600 hover:bg-yellow-100" title="Criar Login de Acesso"><Key size={16}/></button>
                      )}
                      <button onClick={() => handleOpenModal(member)} className="p-2 bg-gray-100 rounded-lg text-blue-600 hover:bg-blue-100"><Edit size={16}/></button>
                      <button onClick={() => handleDelete(member.id!)} className="p-2 bg-gray-100 rounded-lg text-red-600 hover:bg-red-100"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Paginação igual ao anterior */}
      </div>

      {/* MODAL PRINCIPAL (Mantenha o formulário do passo anterior aqui) */}
      {showModal && (
          // ... Cole o modal do passo anterior aqui ...
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-3xl w-full max-w-2xl">
                 {/* ... FORMULÁRIO DE CADASTRO ... use o mesmo do passo anterior para não quebrar */}
                 <button onClick={() => setShowModal(false)}>Fechar (Placeholder)</button>
              </div>
          </div>
      )}

      {/* --- NOVO MODAL: CRIAR ACESSO (LOGIN) --- */}
      {showAccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock size={32}/>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Criar Acesso ao Sistema</h2>
                    <p className="text-sm text-gray-500">Defina uma senha para <strong>{selectedMemberForAccess?.fullName}</strong>.</p>
                    <p className="text-xs font-bold text-blue-600 mt-1 bg-blue-50 py-1 rounded">{selectedMemberForAccess?.role?.toUpperCase()}</p>
                </div>

                <form onSubmit={handleCreateAccess} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">E-mail (Login)</label>
                        <input type="text" disabled value={selectedMemberForAccess?.email} className="w-full p-3 border rounded-xl bg-gray-100 text-gray-500" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Nova Senha</label>
                        <input type="text" required minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3 border rounded-xl focus:ring-2 ring-yellow-200 outline-none" placeholder="Ex: financeiro2024" />
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setShowAccessModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">Cancelar</button>
                        <button type="submit" disabled={creatingAccess} className="flex-1 py-3 rounded-xl bg-yellow-500 text-white font-bold hover:bg-yellow-600 shadow-lg shadow-yellow-200">
                            {creatingAccess ? 'Criando...' : 'Confirmar Acesso'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}