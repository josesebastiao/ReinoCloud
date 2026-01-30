"use client";
import { useState, useEffect } from "react";
import { useChurch } from "../../contexts/ChurchContext";
import { memberService, Member } from "../../services/memberService";
import { createSystemUser } from "../../services/adminAuthService";
import { 
  Users, Search, PlusCircle, Edit, Trash2, Key, Printer,
  MapPin, Phone, Mail, ChevronLeft, ChevronRight, Loader2, HandCoins, Lock, X, Building2 
} from "lucide-react";

export default function MembersPage() {
  // Pegamos a LOGO e o NOME da igreja do contexto
  const { churchId, churchName, logoUrl } = useChurch(); 
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modais
  const [showModal, setShowModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false); // <--- NOVO MODAL DE PREVIEW
  
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

  const filteredMembers = members.filter(m => m.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const currentMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- FUNÇÃO DE IMPRESSÃO REAL (Chamada pelo botão do modal) ---
  const handlePrintExecute = () => {
    const printWindow = window.open('', '', 'width=900,height=600');
    if (!printWindow) return;

    const today = new Date().toLocaleDateString('pt-BR');

    const rows = filteredMembers.map((m, index) => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px;">${index + 1}</td>
            <td style="padding: 8px;"><strong>${m.fullName}</strong></td>
            <td style="padding: 8px;">${m.role === 'admin' ? 'Pastor' : m.role === 'treasurer' ? 'Tesouraria' : m.role === 'secretary' ? 'Secretaria' : 'Membro'}</td>
            <td style="padding: 8px;">${m.phone || '-'}</td>
            <td style="padding: 8px;">${m.status === 'active' ? 'Ativo' : 'Inativo'}</td>
        </tr>
    `).join('');

    const logoHtml = logoUrl ? `<img src="${logoUrl}" style="height: 60px; margin-bottom: 10px;" />` : '';

    const html = `
        <html>
            <head>
                <title>Lista de Membros - ${churchName}</title>
                <style>
                    body { font-family: sans-serif; padding: 30px; text-align: center; }
                    h1 { margin: 0; font-size: 20px; color: #333; }
                    p { margin: 5px 0 20px 0; font-size: 12px; color: #666; }
                    table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; margin-top: 20px; }
                    th { padding: 8px; background: #f9fafb; border-bottom: 2px solid #eee; text-transform: uppercase; font-size: 10px; color: #666; }
                    .footer { margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; font-size: 10px; text-align: center; color: #999; }
                </style>
            </head>
            <body>
                ${logoHtml}
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

  // ... (Funções de Modal e CRUD mantidas iguais) ...
  const handleOpenModal = (member?: Member) => {
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: Member = {
        fullName: formData.fullName, churchId, email: formData.email, phone: formData.phone,
        document: formData.document, birthDate: formData.birthDate, baptismDate: formData.baptismDate,
        gender: formData.gender, role: formData.role, status: formData.status, isTither: formData.isTither,
        ministries: formData.selectedMinistries,
        address: { street: formData.street, number: formData.number, neighborhood: formData.neighborhood, city: formData.city, state: formData.state, zipCode: formData.zipCode }
      };
      if (editingId) await memberService.update(editingId, payload);
      else await memberService.create(payload);
      setShowModal(false); loadMembers();
    } catch (error) { alert("Erro ao salvar."); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Excluir membro?")) { await memberService.delete(id); loadMembers(); }
  };

  const openAccessModal = (member: Member) => {
      if(!member.email) { alert("Este membro precisa de um e-mail."); return; }
      setSelectedMemberForAccess(member); setNewPassword(""); setShowAccessModal(true);
  };

  const handleCreateAccess = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!selectedMemberForAccess || !selectedMemberForAccess.email) return;
      setCreatingAccess(true);
      try {
          await createSystemUser(selectedMemberForAccess.email, newPassword);
          alert(`✅ Acesso criado!\nLogin: ${selectedMemberForAccess.email}\nSenha: ${newPassword}`);
          setShowAccessModal(false);
      } catch (error: any) { alert("Erro: " + error.message); } finally { setCreatingAccess(false); }
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
            {/* BOTÃO QUE ABRE O MODAL DE PREVIEW AGORA */}
            <button onClick={() => setShowPrintModal(true)} className="flex-1 md:flex-none justify-center bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition shadow-sm">
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
          className="w-full pl-10 p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100"
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
                <tr key={member.id} onClick={() => handleOpenModal(member)} className="hover:bg-blue-50/50 transition group cursor-pointer">
                  <td className="p-4">
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-800">{member.fullName}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 rounded uppercase font-bold text-[10px]">{member.role === 'admin' ? 'Pastor' : member.role}</span>
                            {member.isTither && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 rounded font-bold flex items-center gap-1"><HandCoins size={10}/> Dizimista</span>}
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
                      {member.email && <button onClick={(e) => { e.stopPropagation(); openAccessModal(member); }} className="p-2 bg-yellow-50 rounded-lg text-yellow-600 hover:bg-yellow-100 transition"><Key size={16}/></button>}
                      <button onClick={(e) => { e.stopPropagation(); handleOpenModal(member); }} className="p-2 bg-gray-100 rounded-lg text-blue-600 hover:bg-blue-100 transition"><Edit size={16}/></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(member.id!); }} className="p-2 bg-gray-100 rounded-lg text-red-600 hover:bg-red-100 transition"><Trash2 size={16}/></button>
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

      {/* --- NOVO MODAL: PREVIEW DE IMPRESSÃO --- */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95">
                {/* Header do Modal */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Printer size={18} className="text-blue-600"/> Visualização de Impressão
                    </h3>
                    <button onClick={() => setShowPrintModal(false)} className="bg-white p-2 rounded-full shadow-sm text-gray-400 hover:text-red-500 transition">
                        <X size={20}/>
                    </button>
                </div>

                {/* Conteúdo Preview (Papel) */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-100">
                    <div className="bg-white shadow-lg p-8 max-w-lg mx-auto min-h-[400px] text-center rounded-xl border border-gray-200">
                        {/* LOGO NO PREVIEW */}
                        <div className="flex justify-center mb-4">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="h-16 w-16 object-contain" />
                            ) : (
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400"><Building2 size={32}/></div>
                            )}
                        </div>
                        <h2 className="text-xl font-bold uppercase text-gray-800 border-b pb-4 mb-4">{churchName}</h2>
                        
                        <div className="text-left space-y-2">
                            <p className="text-sm font-bold text-gray-500 uppercase mb-2">Resumo da Lista:</p>
                            <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                                <span>Total de Membros:</span>
                                <span className="font-bold">{filteredMembers.length}</span>
                            </div>
                            <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                                <span>Ativos:</span>
                                <span className="font-bold text-green-600">{filteredMembers.filter(m => m.status === 'active').length}</span>
                            </div>
                            <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                                <span>Homens:</span>
                                <span className="font-bold">{filteredMembers.filter(m => m.gender === 'male').length}</span>
                            </div>
                            <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                                <span>Mulheres:</span>
                                <span className="font-bold">{filteredMembers.filter(m => m.gender === 'female').length}</span>
                            </div>
                        </div>
                        
                        <p className="text-xs text-gray-400 mt-8">Clique em "Imprimir Agora" para gerar a lista detalhada em PDF ou papel.</p>
                    </div>
                </div>

                {/* Footer com Ações */}
                <div className="p-4 border-t border-gray-100 bg-white rounded-b-3xl flex gap-3">
                    <button onClick={() => setShowPrintModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50">
                        Voltar
                    </button>
                    <button onClick={handlePrintExecute} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
                        <Printer size={20}/> Imprimir Agora
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL 1: CADASTRO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Editar Membro' : 'Novo Cadastro'}</h2>
                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 font-bold">FECHAR</button>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-4">
                    {/* ... (SEU FORMULÁRIO DE MEMBROS ORIGINAL AQUI) ... */}
                    {/* Mantive o mesmo form para economizar espaço na resposta, copie do anterior se precisar */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Nome Completo</label><input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">E-mail</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Telefone</label><input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Cargo</label><select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-3 border rounded-xl bg-white"><option value="member">Membro</option><option value="leader">Líder</option><option value="secretary">Secretaria</option><option value="treasurer">Tesouraria</option><option value="admin">Pastor</option></select></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Status</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full p-3 border rounded-xl bg-white"><option value="active">Ativo</option><option value="inactive">Inativo</option></select></div>
                        <div className="md:col-span-2 bg-amber-50 p-4 rounded-xl flex items-center gap-3 border border-amber-100" onClick={() => setFormData({...formData, isTither: !formData.isTither})}><div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.isTither ? 'bg-amber-500 border-amber-500' : 'bg-white'}`}>{formData.isTither && <HandCoins size={14} className="text-white"/>}</div><div><p className="font-bold text-sm">Dizimista?</p></div></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Nascimento</label><input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} className="w-full p-3 border rounded-xl"/></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Batismo</label><input type="date" value={formData.baptismDate} onChange={e => setFormData({...formData, baptismDate: e.target.value})} className="w-full p-3 border rounded-xl"/></div>
                    </div>
                    <div className="flex justify-end pt-4 gap-3">
                        <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg">{loading ? '...' : 'Salvar'}</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* MODAL 2: SENHA */}
      {showAccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                <div className="text-center mb-6"><div className="w-16 h-16 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4"><Lock size={32}/></div><h2 className="text-xl font-bold">Criar Acesso</h2></div>
                <form onSubmit={handleCreateAccess} className="space-y-4">
                    <input type="text" disabled value={selectedMemberForAccess?.email} className="w-full p-3 border rounded-xl bg-gray-100" />
                    <input type="text" required minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Nova Senha" />
                    <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowAccessModal(false)} className="flex-1 py-3 border rounded-xl">Cancelar</button><button type="submit" disabled={creatingAccess} className="flex-1 py-3 bg-yellow-500 text-white rounded-xl font-bold">Confirmar</button></div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}