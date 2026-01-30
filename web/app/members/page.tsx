"use client";
import { useState, useEffect } from "react";
import { useChurch } from "../../contexts/ChurchContext";
import { memberService, Member } from "../../services/memberService";
import { createSystemUser } from "../../services/adminAuthService";
import { 
  Users, Search, PlusCircle, Edit, Trash2, Key, Printer,
  MapPin, Phone, Mail, ChevronLeft, ChevronRight, Loader2, HandCoins, Lock 
} from "lucide-react";

export default function MembersPage() {
  const { churchId, churchName } = useChurch(); // <--- Pegamos churchName para o cabeçalho da impressão
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modais
  const [showModal, setShowModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  
  // Estados de Edição/Criação
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

  useEffect(() => {
    if (churchId) loadMembers();
  }, [churchId]);

  const loadMembers = async () => {
    try {
      const list = await memberService.listByChurch(churchId);
      setMembers(list);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  // Filtra membros
  const filteredMembers = members.filter(m => m.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
  
  // Paginação
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const currentMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- NOVA FUNÇÃO: IMPRIMIR LISTA ---
  const handlePrintList = () => {
    const printWindow = window.open('', '', 'width=900,height=600');
    if (!printWindow) return;

    const today = new Date().toLocaleDateString('pt-BR');

    // Gera as linhas da tabela baseadas no filtro atual (se buscou "João", imprime só os Joões)
    const rows = filteredMembers.map((m, index) => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px;">${index + 1}</td>
            <td style="padding: 8px;"><strong>${m.fullName}</strong></td>
            <td style="padding: 8px;">${m.role === 'admin' ? 'Pastor' : m.role === 'treasurer' ? 'Tesouraria' : m.role === 'secretary' ? 'Secretaria' : 'Membro'}</td>
            <td style="padding: 8px;">${m.phone || '-'}</td>
            <td style="padding: 8px;">${m.status === 'active' ? 'Ativo' : 'Inativo'}</td>
        </tr>
    `).join('');

    const html = `
        <html>
            <head>
                <title>Lista de Membros - ${churchName}</title>
                <style>
                    body { font-family: sans-serif; padding: 30px; }
                    h1 { margin: 0; font-size: 20px; color: #333; }
                    p { margin: 5px 0 20px 0; font-size: 12px; color: #666; }
                    table { width: 100%; border-collapse: collapse; font-size: 12px; }
                    th { text-align: left; padding: 8px; background: #f9fafb; border-bottom: 2px solid #eee; text-transform: uppercase; font-size: 10px; color: #666; }
                    .footer { margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; font-size: 10px; text-align: center; color: #999; }
                </style>
            </head>
            <body>
                <h1>${churchName}</h1>
                <p>Relatório de Membros • Gerado em ${today} • Total: ${filteredMembers.length}</p>
                
                <table>
                    <thead>
                        <tr>
                            <th width="30">#</th>
                            <th>Nome Completo</th>
                            <th>Cargo</th>
                            <th>Telefone</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>

                <div class="footer">Sistema ReinoCloud</div>
                <script>window.print();</script>
            </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // --- MODAIS E SALVAMENTO ---
  const handleOpenModal = (member?: Member) => {
    if (member) {
      setEditingId(member.id || null);
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
        role: member.role || "member",
        status: member.status || "active",
        isTither: member.isTither || false,
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
        gender: "male", role: "member", status: "active", isTither: false,
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
        isTither: formData.isTither,
        ministries: formData.selectedMinistries,
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

  const openAccessModal = (member: Member) => {
      if(!member.email) {
          alert("Este membro precisa de um e-mail cadastrado primeiro para ter acesso.");
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
          await createSystemUser(selectedMemberForAccess.email, newPassword);
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

  if (loading && members.length === 0) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50 pb-24">
      {/* CABEÇALHO */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Users className="text-blue-600"/> Membros</h1>
          <p className="text-sm text-gray-500">{members.length} membros cadastrados</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
            {/* BOTÃO DE IMPRIMIR */}
            <button onClick={handlePrintList} className="flex-1 md:flex-none justify-center bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition">
              <Printer size={20}/> <span className="hidden md:inline">Imprimir Lista</span>
            </button>
            
            <button onClick={() => handleOpenModal()} className="flex-1 md:flex-none justify-center bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200">
              <PlusCircle size={20}/> Novo Membro
            </button>
        </div>
      </div>

      {/* BUSCA */}
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

      {/* TABELA */}
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Nome</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Contato</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentMembers.map(member => (
                <tr 
                    key={member.id} 
                    onClick={() => handleOpenModal(member)} 
                    className="hover:bg-blue-50/50 transition group cursor-pointer"
                >
                  <td className="p-4">
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-800">{member.fullName}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 rounded uppercase font-bold text-[10px]">{member.role === 'admin' ? 'Pastor' : member.role === 'treasurer' ? 'Tesouraria' : member.role === 'secretary' ? 'Secretaria' : 'Membro'}</span>
                            {member.isTither && (
                                <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 rounded font-bold flex items-center gap-1">
                                    <HandCoins size={10}/> Dizimista
                                </span>
                            )}
                            <span className={`text-[9px] px-1.5 rounded font-bold uppercase ${member.status === 'inactive' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{member.status === 'inactive' ? 'Inativo' : 'Ativo'}</span>
                        </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                       {member.phone && <span className="flex items-center gap-1 text-xs text-gray-500"><Phone size={12}/> {member.phone}</span>}
                       {member.email && <span className="flex items-center gap-1 text-xs text-gray-500"><Mail size={12}/> {member.email}</span>}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {member.email && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); openAccessModal(member); }} 
                            className="p-2 bg-yellow-50 rounded-lg text-yellow-600 hover:bg-yellow-100 transition" 
                            title="Criar Senha de Acesso"
                          >
                              <Key size={16}/>
                          </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenModal(member); }} 
                        className="p-2 bg-gray-100 rounded-lg text-blue-600 hover:bg-blue-100 transition"
                      >
                          <Edit size={16}/>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(member.id!); }} 
                        className="p-2 bg-gray-100 rounded-lg text-red-600 hover:bg-red-100 transition"
                      >
                          <Trash2 size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex justify-center gap-4 items-center">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={20}/></button>
                <span className="text-sm font-bold text-gray-600">Página {currentPage} de {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={20}/></button>
            </div>
        )}
      </div>

      {/* --- MODAIS DE CADASTRO E SENHA (CÓDIGO ORIGINAL MANTIDO) --- */}
      {/* ... (mantém os modais iguais ao código anterior) ... */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
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
                            <label className="text-xs font-bold text-gray-500 uppercase">Cargo / Função</label>
                            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-3 border rounded-xl bg-white">
                                <option value="member">Membro Comum</option>
                                <option value="leader">Líder de Grupo</option>
                                <option value="secretary">Secretaria</option>
                                <option value="treasurer">Tesouraria</option>
                                <option value="admin">Pastor / Admin</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full p-3 border rounded-xl bg-white">
                                <option value="active">Ativo (Comungante)</option>
                                <option value="inactive">Inativo / Disciplina</option>
                            </select>
                        </div>
                        
                        {/* --- CHECKBOX DIZIMISTA --- */}
                        <div className="md:col-span-2 bg-amber-50 p-4 rounded-xl flex items-center gap-3 border border-amber-100 cursor-pointer hover:bg-amber-100 transition" onClick={() => setFormData({...formData, isTither: !formData.isTither})}>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${formData.isTither ? 'bg-amber-500 border-amber-500' : 'border-gray-300 bg-white'}`}>
                                {formData.isTither && <HandCoins size={14} className="text-white"/>}
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 text-sm">Este membro é Dizimista?</p>
                                <p className="text-xs text-gray-500">Marque para contabilizar nos relatórios financeiros.</p>
                            </div>
                        </div>

                        <div><label className="text-xs font-bold text-gray-500 uppercase">Data Nascimento</label><input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Data Batismo</label><input type="date" value={formData.baptismDate} onChange={e => setFormData({...formData, baptismDate: e.target.value})} className="w-full p-3 border rounded-xl" /></div>

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

      {showAccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-yellow-100">
                        <Lock size={32}/>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Criar Acesso ao Sistema</h2>
                    <p className="text-sm text-gray-500">Defina uma senha para <strong>{selectedMemberForAccess?.fullName}</strong>.</p>
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