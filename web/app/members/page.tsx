"use client";
import { useState, useEffect } from "react";
import { useChurch } from "../../contexts/ChurchContext";
import { memberService, Member } from "../../services/memberService";
import { 
  Users, Search, PlusCircle, Edit, Trash2, 
  MapPin, Phone, Mail, ChevronLeft, ChevronRight, Loader2 
} from "lucide-react";

export default function MembersPage() {
  const { churchId } = useChurch();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Formulário
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    document: "",
    birthDate: "",
    baptismDate: "",
    gender: "male",
    role: "member",
    status: "active",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    selectedMinistries: [] as string[]
  });

  useEffect(() => {
    if (churchId) loadMembers();
  }, [churchId]);

  const loadMembers = async () => {
    try {
      const list = await memberService.listByChurch(churchId);
      setMembers(list);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Filtragem
  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginação Lógica
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const currentMembers = filteredMembers.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const handleOpenModal = (member?: Member) => {
    if (member) {
      setEditingId(member.id || null);
      
      // Tratamento seguro do endereço (pode vir null, string ou objeto)
      let addr: any = { street: "", number: "", neighborhood: "", city: "", state: "", zipCode: "" };
      
      if (member.address && typeof member.address === 'object') {
          addr = member.address;
      }

      setFormData({
        fullName: member.fullName,
        email: member.email || "",
        phone: member.phone || "",
        document: member.document || "",
        birthDate: member.birthDate || "",
        baptismDate: member.baptismDate || "",
        gender: (member.gender as string) || "male",
        
        // --- AQUI ESTAVA O ERRO (Adicionamos valores padrão) ---
        role: member.role || "member",
        status: member.status || "active",
        // ------------------------------------------------------

        street: addr.street || "",
        number: addr.number || "",
        neighborhood: addr.neighborhood || "",
        city: addr.city || "",
        state: addr.state || "",
        zipCode: addr.zipCode || "",
        selectedMinistries: member.ministries || []
      });
    } else {
      setEditingId(null);
      setFormData({
        fullName: "", email: "", phone: "", document: "", birthDate: "", baptismDate: "",
        gender: "male", role: "member", status: "active",
        street: "", number: "", neighborhood: "", city: "", state: "", zipCode: "",
        selectedMinistries: []
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: Member = {
        fullName: formData.fullName,
        churchId,
        email: formData.email,
        phone: formData.phone,
        document: formData.document,
        birthDate: formData.birthDate,
        baptismDate: formData.baptismDate,
        gender: formData.gender,
        role: formData.role,
        status: formData.status,
        ministries: formData.selectedMinistries,
        // Salvamos endereço sempre como objeto para manter organizado no futuro
        address: { 
            street: formData.street,
            number: formData.number,
            neighborhood: formData.neighborhood,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode
        }
      };

      if (editingId) {
        await memberService.update(editingId, payload);
      } else {
        await memberService.create(payload);
      }
      
      setShowModal(false);
      loadMembers();
    } catch (error) {
      alert("Erro ao salvar membro.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este membro?")) {
      await memberService.delete(id);
      loadMembers();
    }
  };

  if (loading && members.length === 0) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50 pb-24">
      <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Users className="text-blue-600"/> Membros</h1>
          <p className="text-sm text-gray-500">{members.length} membros cadastrados</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition">
          <PlusCircle size={20}/> Novo Membro
        </button>
      </div>

      {/* BARRA DE BUSCA */}
      <div className="max-w-6xl mx-auto mb-6 relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20}/>
        <input 
          type="text" 
          placeholder="Buscar por nome..." 
          className="w-full pl-10 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
        />
      </div>

      {/* TABELA (LISTA) */}
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Nome</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Contato</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentMembers.map(member => (
                <tr key={member.id} className="hover:bg-blue-50/50 transition group">
                  <td className="p-4">
                    <p className="font-bold text-gray-800">{member.fullName}</p>
                    <p className="text-xs text-gray-400">{member.role || 'Membro'}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                       {member.phone && <span className="flex items-center gap-1 text-xs text-gray-500"><Phone size={12}/> {member.phone}</span>}
                       {member.email && <span className="flex items-center gap-1 text-xs text-gray-500"><Mail size={12}/> {member.email}</span>}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${member.status === 'inactive' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {member.status === 'inactive' ? 'Inativo' : 'Ativo'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => handleOpenModal(member)} className="p-2 bg-gray-100 rounded-lg text-blue-600 hover:bg-blue-100"><Edit size={16}/></button>
                      <button onClick={() => handleDelete(member.id!)} className="p-2 bg-gray-100 rounded-lg text-red-600 hover:bg-red-100"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* PAGINAÇÃO */}
        {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex justify-center gap-4 items-center">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={20}/></button>
                <span className="text-sm font-bold text-gray-600">Página {currentPage} de {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={20}/></button>
            </div>
        )}
      </div>

      {/* MODAL DE EDIÇÃO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Editar Membro' : 'Novo Cadastro'}</h2>
                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 font-bold">FECHAR</button>
                </div>
                
                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Nome Completo</label>
                            <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-3 border rounded-xl" />
                        </div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">E-mail</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Telefone</label><input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Cargo</label>
                            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-3 border rounded-xl bg-white">
                                <option value="member">Membro</option>
                                <option value="leader">Líder</option>
                                <option value="pastor">Pastor</option>
                                <option value="secretary">Secretaria</option>
                                <option value="treasurer">Tesouraria</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full p-3 border rounded-xl bg-white">
                                <option value="active">Ativo</option>
                                <option value="inactive">Inativo</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <p className="text-sm font-bold text-gray-400 uppercase mb-3"><MapPin size={14} className="inline mr-1"/> Endereço</p>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="col-span-2"><input placeholder="Rua / Avenida" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                             <div><input placeholder="Cidade" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                             <div><input placeholder="Estado" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 gap-3">
                        <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200">{loading ? 'Salvando...' : 'Salvar Dados'}</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}