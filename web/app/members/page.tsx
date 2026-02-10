"use client";
import { useState, useEffect } from "react";
import { useChurch } from "../../contexts/ChurchContext";
import { memberService } from "../../services/memberService";
import { ministryService } from "../../services/ministryService";
import { Member } from "../../types/member"; 
import { Ministry } from "../../types/ministry";
import { createSystemUser } from "../../services/adminAuthService";
import { getDirectImageUrl } from "../../utils/imageHelper"; 
import { 
  Users, Search, PlusCircle, Edit, Trash2, Key, Printer,
  MapPin, Phone, Mail, ChevronLeft, ChevronRight, Loader2, HandCoins, Lock, X, Building2, Heart, Briefcase, Camera, ShieldCheck, User, CreditCard, AlertTriangle, Shield 
} from "lucide-react";

export default function MembersPage() {
  const { churchId, churchName, logoUrl, userRole } = useChurch(); 
  
  const [members, setMembers] = useState<Member[]>([]);
  const [ministryOptions, setMinistryOptions] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // MODAIS
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printing, setPrinting] = useState(false);
  
  const [viewMember, setViewMember] = useState<Member | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMemberForAccess, setSelectedMemberForAccess] = useState<Member | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [creatingAccess, setCreatingAccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "", email: "", phone: "", document: "", 
    birthDate: "", baptismDate: "", photoUrl: "", 
    gender: "male", maritalStatus: "single", 
    role: "member", status: "active", isTither: false,
    street: "", number: "", neighborhood: "", city: "", state: "", zipCode: "",
    selectedMinistries: [] as string[],
    permissions: [] as string[]
  });

  useEffect(() => {
    if (churchId) {
        loadData();
    }
  }, [churchId]);

  const loadData = async () => {
    if (!churchId) return;
    setLoading(true);
    try {
      const [membersList, ministriesList] = await Promise.all([
          memberService.listByChurch(churchId),
          ministryService.listByChurch(churchId)
      ]);
      setMembers(membersList);
      setMinistryOptions(ministriesList);
    } catch (error) { 
        console.error(error); 
    } finally { 
        setLoading(false); 
    }
  };

  const translateRole = (role: string | undefined) => {
      switch (role) {
          case 'admin': return 'Pastor Titular';
          case 'deacon': return 'Diácono(a)';
          case 'leader': return 'Líder';
          case 'secretary': return 'Secretaria';
          case 'treasurer': return 'Tesouraria';
          default: return 'Membro';
      }
  };

  const filteredMembers = members.filter(m => m.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const currentMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- AÇÕES ---

  const handleOpenView = (member: Member) => {
      setViewMember(member);
      setShowViewModal(true);
  };

  const handleOpenEdit = (member?: Member) => {
    setShowViewModal(false);
    if (member) {
      setEditingId(member.id || null);
      let addr: any = member.address || {};
      setFormData({
        fullName: member.fullName, email: member.email || "", phone: member.phone || "",
        document: member.document || "", birthDate: member.birthDate || "", baptismDate: member.baptismDate || "",
        photoUrl: member.photoUrl || "", 
        gender: (member.gender as string) || "male", 
        maritalStatus: member.maritalStatus || "single", 
        role: member.role || "member", status: member.status || "active",
        isTither: member.isTither || false, 
        street: addr.street || "", number: addr.number || "", neighborhood: addr.neighborhood || "",
        city: addr.city || "", state: addr.state || "", zipCode: addr.zipCode || "",
        selectedMinistries: member.ministries || [],
        permissions: member.permissions || [] 
      });
    } else {
      setEditingId(null);
      setFormData({
        fullName: "", email: "", phone: "", document: "", birthDate: "", baptismDate: "", photoUrl: "",
        gender: "male", maritalStatus: "single", role: "member", status: "active", isTither: false,
        street: "", number: "", neighborhood: "", city: "", state: "", zipCode: "",
        selectedMinistries: [],
        permissions: []
      });
    }
    setShowModal(true);
  };

  const toggleMinistry = (ministryId: string) => {
      if (formData.selectedMinistries.includes(ministryId)) {
          setFormData({ ...formData, selectedMinistries: formData.selectedMinistries.filter(id => id !== ministryId) });
      } else {
          setFormData({ ...formData, selectedMinistries: [...formData.selectedMinistries, ministryId] });
      }
  };

  const togglePermission = (permission: string) => {
      if (userRole !== 'admin') return; 

      if (formData.permissions.includes(permission)) {
          setFormData({ ...formData, permissions: formData.permissions.filter(p => p !== permission) });
      } else {
          setFormData({ ...formData, permissions: [...formData.permissions, permission] });
      }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId) return;
    setLoading(true);
    try {
      const payload: Member = {
        fullName: formData.fullName, churchId, email: formData.email, phone: formData.phone,
        document: formData.document, birthDate: formData.birthDate, baptismDate: formData.baptismDate,
        photoUrl: formData.photoUrl, 
        gender: formData.gender, maritalStatus: formData.maritalStatus, 
        role: formData.role, status: formData.status, isTither: formData.isTither,
        ministries: formData.selectedMinistries, 
        permissions: formData.permissions, 
        address: { 
            street: formData.street, number: formData.number, neighborhood: formData.neighborhood, 
            city: formData.city, state: formData.state, zipCode: formData.zipCode 
        }
      };
      if (editingId) await memberService.update(editingId, payload);
      else await memberService.create(payload);
      setShowModal(false); 
      loadData(); 
    } catch (error) { alert("Erro ao salvar."); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => { if (confirm("Excluir membro?")) { await memberService.delete(id); loadData(); } };
  const openAccessModal = (member: Member) => { if(!member.email) { alert("Este membro precisa de um e-mail."); return; } setSelectedMemberForAccess(member); setNewPassword(""); setShowAccessModal(true); };
  const handleCreateAccess = async (e: React.FormEvent) => { e.preventDefault(); if(!selectedMemberForAccess?.email) return; setCreatingAccess(true); try { await createSystemUser(selectedMemberForAccess.email, newPassword); alert(`✅ Acesso criado!\nLogin: ${selectedMemberForAccess.email}\nSenha: ${newPassword}`); setShowAccessModal(false); } catch (error: any) { alert("Erro: " + error.message); } finally { setCreatingAccess(false); } };

  // --- IMPRESSÃO DE LISTA (COM ORDENAÇÃO A-Z E BOTÃO DE FECHAR) ---
  const handlePrintExecute = async () => {
    setPrinting(true);
    const printWindow = window.open('', '', 'width=900,height=600');
    if (!printWindow) { setPrinting(false); return; }
    
    const today = new Date().toLocaleDateString('pt-BR');
    
    // LOGO: Usa o link direto tratado
    const directLogo = getDirectImageUrl(logoUrl);
    const logoHtml = directLogo ? `<img src="${directLogo}" style="height: 60px; margin-bottom: 10px;" />` : '';

    const sortedMembers = [...filteredMembers].sort((a, b) => a.fullName.localeCompare(b.fullName));

    const rows = sortedMembers.map((m, index) => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px;">${index + 1}</td>
            <td style="padding: 8px;"><strong>${m.fullName}</strong></td>
            <td style="padding: 8px;">${translateRole(m.role)}</td>
            <td style="padding: 8px;">${m.phone || '-'}</td>
            <td style="padding: 8px;">${m.status === 'active' ? 'Ativo' : 'Inativo'}</td>
        </tr>
    `).join('');

    const html = `
        <html>
        <head>
            <title>Lista de Membros</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: sans-serif; padding: 20px; text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; text-align: left; }
                th { background: #f9fafb; padding: 8px; border-bottom: 2px solid #eee; }
                
                .close-btn {
                    position: fixed; top: 15px; left: 15px; z-index: 9999;
                    background: #ef4444; color: white; border: none;
                    padding: 10px 20px; border-radius: 50px; font-weight: bold;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.3); cursor: pointer;
                    text-decoration: none; font-size: 14px;
                }
                @media print { .close-btn { display: none; } }
            </style>
        </head>
        <body>
            <button onclick="window.close()" class="close-btn">← FECHAR</button>
            
            ${logoHtml}
            <h1>${churchName}</h1>
            <p>Relatório de Membros • ${today}</p>
            <table><thead><tr><th>#</th><th>Nome</th><th>Cargo</th><th>Telefone</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
            
            <script>setTimeout(() => window.print(), 1000);</script>
        </body>
        </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    setPrinting(false);
  };

  // --- IMPRESSÃO DE CARTEIRINHA (CORRIGIDA: FOTO e LOGO) ---
  const handlePrintCard = async (member: Member) => {
    setPrinting(true);
    const printWindow = window.open('', '', 'width=900,height=600');
    if (!printWindow) { setPrinting(false); return; }

    // FOTO E LOGO: Usando o link direto tratado pelo Helper
    // Isso evita bloqueios de CORS e faz a imagem aparecer
    const directLogo = getDirectImageUrl(logoUrl);
    const directPhoto = getDirectImageUrl(member.photoUrl);
    
    const baptismText = member.baptismDate 
        ? new Date(member.baptismDate).toLocaleDateString('pt-BR') 
        : '---';

    const html = `
      <html>
        <head>
          <title>Carteirinha - ${member.fullName}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&display=swap');
            body { font-family: 'Montserrat', sans-serif; background: #eef2f5; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card-wrapper { display: flex; gap: 30px; flex-wrap: wrap; justify-content: center; }
            .card { width: 324px; height: 204px; background: #fff; border-radius: 12px; position: relative; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #ddd; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            
            /* FRENTE */
            .card.front { background: linear-gradient(120deg, #0f172a 0%, #1e3a8a 100%); color: white; display: flex; flex-direction: column; }
            .front-header { display: flex; align-items: center; gap: 10px; padding: 15px 15px 5px 15px; border-bottom: 1px solid rgba(255,255,255,0.1); }
            .front-logo { width: 35px; height: 35px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); }
            .church-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
            .front-body { flex: 1; display: flex; align-items: center; padding: 0 15px; gap: 15px; }
            .photo-frame { width: 75px; height: 75px; border-radius: 12px; background: #fff; border: 3px solid rgba(255,255,255,0.3); overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 8px rgba(0,0,0,0.3); }
            .photo-frame img { width: 100%; height: 100%; object-fit: cover; }
            .member-info { display: flex; flex-direction: column; justify-content: center; }
            .label { font-size: 7px; text-transform: uppercase; opacity: 0.7; letter-spacing: 1px; margin-bottom: 2px; }
            .name { font-size: 14px; font-weight: 800; text-transform: uppercase; line-height: 1.2; margin-bottom: 6px; }
            .role-badge { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 20px; font-size: 8px; font-weight: 700; text-transform: uppercase; width: fit-content; }
            .front-footer { background: rgba(0,0,0,0.2); padding: 6px 15px; text-align: right; font-size: 7px; letter-spacing: 2px; text-transform: uppercase; opacity: 0.8; }

            /* VERSO */
            .card.back { background: #fff; color: #333; display: flex; flex-direction: column; background-image: radial-gradient(#e5e7eb 1px, transparent 1px); background-size: 10px 10px; }
            .back-body { padding: 20px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
            .data-row { display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding-bottom: 4px; margin-bottom: 8px; }
            .data-col { display: flex; flex-direction: column; }
            .data-label { font-size: 6px; font-weight: 700; text-transform: uppercase; color: #888; }
            .data-value { font-size: 9px; font-weight: 600; color: #000; }
            .signature-box { text-align: center; margin-top: 10px; }
            .line { height: 1px; background: #000; width: 100%; margin: 2px auto; }
            .sig-label { font-size: 7px; font-weight: 700; text-transform: uppercase; }

            /* BOTÃO FLUTUANTE DE FECHAR (SÓ APARECE NA TELA) */
            .close-btn {
                position: fixed; top: 15px; left: 15px; z-index: 9999;
                background: #ef4444; color: white; border: none;
                padding: 10px 20px; border-radius: 50px; font-weight: bold;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3); cursor: pointer;
                text-decoration: none; font-size: 14px;
            }

            @media print { 
                body { background: white; height: auto; display: block; } 
                .card-wrapper { margin-bottom: 20px; page-break-inside: avoid; } 
                .card { border: 1px solid #ccc; -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
                .close-btn { display: none !important; }
            }
          </style>
        </head>
        <body>
          <button onclick="window.close()" class="close-btn">← FECHAR</button>

          <div class="card-wrapper">
            <div class="card front">
              <div class="front-header">
                 ${directLogo ? `<img src="${directLogo}" class="front-logo" />` : ''}
                 <div class="church-title">${churchName}</div>
              </div>
              <div class="front-body">
                 <div class="photo-frame">
                    ${directPhoto ? `<img src="${directPhoto}" />` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:30px;">👤</div>`}
                 </div>
                 <div class="member-info">
                    <span class="label">Membro</span>
                    <span class="name">${member.fullName}</span>
                    <span class="role-badge">Batismo: ${baptismText}</span>
                 </div>
              </div>
              <div class="front-footer">Cartão de Membro</div>
            </div>

            <div class="card back">
               <div class="back-body">
                   <div>
                       <div class="data-row">
                           <div class="data-col"><span class="data-label">Data de Nascimento</span><span class="data-value">${member.birthDate ? new Date(member.birthDate).toLocaleDateString('pt-BR') : '---'}</span></div>
                           <div class="data-col" style="text-align:right"><span class="data-label">Desde</span><span class="data-value">${member.baptismDate ? new Date(member.baptismDate).getFullYear() : new Date().getFullYear()}</span></div>
                       </div>
                       <div class="data-row" style="border:none">
                           <div class="data-col"><span class="data-label">Validade</span><span class="data-value">INDETERMINADA</span></div>
                       </div>
                   </div>
                   <div class="signature-box"><div style="height:25px"></div><div class="line"></div><div class="sig-label">Pastor Presidente</div></div>
                   <div style="display:flex; align-items:flex-end; justify-content:space-between; margin-top:10px;">
                       <span style="font-size:6px; color:#999; width: 60%;">Este cartão é pessoal e intransferível.</span>
                       <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(member.fullName)}" style="width:35px; height:35px; opacity:0.8;" />
                   </div>
               </div>
            </div>
          </div>
          <script>setTimeout(function(){ window.print(); }, 1000);</script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setPrinting(false);
  };

  if (loading && members.length === 0) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50 pb-24">
      {/* CABEÇALHO */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div><h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Users className="text-blue-600"/> Membros</h1><p className="text-sm text-gray-500">{members.length} membros cadastrados</p></div>
        <div className="flex gap-2 w-full md:w-auto">
            <button onClick={handlePrintExecute} disabled={printing} className="flex-1 md:flex-none justify-center bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition shadow-sm">
                {printing ? <Loader2 className="animate-spin" size={20}/> : <Printer size={20}/>} <span className="hidden md:inline">Imprimir Lista</span>
            </button>
            <button onClick={() => handleOpenEdit()} className="flex-1 md:flex-none justify-center bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200"><PlusCircle size={20}/> Novo Membro</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mb-6 relative"><Search className="absolute left-3 top-3 text-gray-400" size={20}/><input type="text" placeholder="Buscar por nome..." className="w-full pl-10 p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}/></div>

      {/* TABELA DE MEMBROS (COM BLINDAGEM VISUAL) */}
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr><th className="p-4 text-xs font-bold text-gray-500 uppercase">Nome</th><th className="p-4 text-xs font-bold text-gray-500 uppercase">Contato</th><th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Ações</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentMembers.map(member => (
                <tr key={member.id} onClick={() => handleOpenView(member)} className="hover:bg-blue-50/50 transition group cursor-pointer">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border border-gray-300">
                            {member.photoUrl ? (<img src={getDirectImageUrl(member.photoUrl)} alt={member.fullName} className="w-full h-full object-cover"/>) : (<div className="w-full h-full flex items-center justify-center text-gray-400"><Users size={20}/></div>)}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-800 flex items-center gap-2">
                                {member.fullName}
                                {member.permissions && member.permissions.includes('secretary') && <span title="Acesso Secretaria"><Shield size={14} className="text-blue-500 fill-blue-100"/></span>}
                                {member.permissions && member.permissions.includes('financial') && <span title="Acesso Tesouraria"><Shield size={14} className="text-green-500 fill-green-100"/></span>}
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] px-2 rounded uppercase font-bold ${member.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {translateRole(member.role)}
                                </span>
                            </div>
                        </div>
                    </div>
                  </td>
                  <td className="p-4"><div className="flex flex-col gap-1">{member.phone && <span className="flex items-center gap-1 text-xs text-gray-500"><Phone size={12}/> {member.phone}</span>}{member.email && <span className="flex items-center gap-1 text-xs text-gray-500"><Mail size={12}/> {member.email}</span>}</div></td>
                  <td className="p-4 text-right"><div className="flex justify-end gap-2">{member.email && <button onClick={(e) => { e.stopPropagation(); openAccessModal(member); }} className="p-2 bg-yellow-50 rounded-lg text-yellow-600 hover:bg-yellow-100 transition"><Key size={16}/></button>}<button onClick={(e) => { e.stopPropagation(); handleOpenEdit(member); }} className="p-2 bg-gray-100 rounded-lg text-blue-600 hover:bg-blue-100 transition"><Edit size={16}/></button><button onClick={(e) => { e.stopPropagation(); handleDelete(member.id!); }} className="p-2 bg-gray-100 rounded-lg text-red-600 hover:bg-red-100 transition"><Trash2 size={16}/></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (<div className="p-4 border-t border-gray-100 flex justify-center gap-4 items-center"><button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={20}/></button><span className="text-sm font-bold text-gray-600">Página {currentPage} de {totalPages}</span><button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={20}/></button></div>)}
      </div>

      {/* --- MODAL 1: VISUALIZAÇÃO (SÓ CARTEIRINHA) --- */}
      {showViewModal && viewMember && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 relative">
                <button onClick={() => setShowViewModal(false)} className="absolute top-4 right-4 z-10 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition"><X size={18}/></button>
                
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-white/30 shadow-lg relative z-10 overflow-hidden">
                        {viewMember.photoUrl ? <img src={getDirectImageUrl(viewMember.photoUrl)} className="w-full h-full object-cover"/> : <User className="text-blue-300" size={48}/>}
                    </div>
                    <h3 className="text-xl font-bold text-white relative z-10">{viewMember.fullName}</h3>
                    <p className="text-blue-200 text-sm uppercase font-bold tracking-wider relative z-10">{translateRole(viewMember.role)}</p>
                    
                    <div className="absolute bottom-4 left-0 right-0 px-4 z-20 flex justify-center">
                         <button onClick={() => handlePrintCard(viewMember)} disabled={printing} className="bg-white/20 hover:bg-white/40 text-white p-2 rounded-lg backdrop-blur-sm transition flex items-center gap-2 text-xs font-bold border border-white/30" title="Imprimir Carteirinha">
                            {printing ? <Loader2 className="animate-spin" size={14}/> : <CreditCard size={16}/>} Carteirinha
                         </button>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {/* DADOS DETALHADOS */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Status</span>
                            <p className={`font-bold ${viewMember.status === 'active' ? 'text-green-600' : 'text-red-500'}`}>{viewMember.status === 'active' ? 'Ativo' : 'Inativo'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Estado Civil</span>
                            <p className="font-bold text-gray-700 capitalize">{viewMember.maritalStatus === 'single' ? 'Solteiro(a)' : viewMember.maritalStatus === 'married' ? 'Casado(a)' : viewMember.maritalStatus === 'divorced' ? 'Divorciado(a)' : 'Viúvo(a)'}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0"><Phone size={18}/></div>
                            <div><p className="text-xs text-gray-400 font-bold uppercase">Telefone</p><p className="font-medium text-gray-800">{viewMember.phone || "—"}</p></div>
                        </div>
                        <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition">
                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center shrink-0"><Mail size={18}/></div>
                            <div><p className="text-xs text-gray-400 font-bold uppercase">E-mail</p><p className="font-medium text-gray-800 text-sm truncate max-w-[200px]">{viewMember.email || "—"}</p></div>
                        </div>
                        <div className="flex items-center gap-3 p-3 hover:bg-orange-50 rounded-xl transition">
                            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center shrink-0"><MapPin size={18}/></div>
                            <div><p className="text-xs text-gray-400 font-bold uppercase">Endereço</p><p className="font-medium text-gray-800 text-sm">{viewMember.address?.street || "—"}</p></div>
                        </div>
                    </div>

                    <button onClick={() => handleOpenEdit(viewMember)} className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition shadow-lg flex justify-center items-center gap-2">
                        <Edit size={18}/> Editar Cadastro Completo
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL DE EDIÇÃO (BLINDADO) --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Editar Membro' : 'Novo Cadastro'}</h2>
                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 font-bold">FECHAR</button>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-6">
                    {/* DADOS PESSOAIS */}
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><h3 className="text-xs font-bold text-blue-600 uppercase mb-3 flex items-center gap-2"><Users size={14}/> Dados Pessoais</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="md:col-span-2"><label className="text-[10px] font-bold text-gray-400 uppercase">Link da Foto (URL)</label><div className="relative"><Camera className="absolute left-3 top-3 text-gray-400" size={16}/><input type="text" value={formData.photoUrl} onChange={e => setFormData({...formData, photoUrl: e.target.value})} className="w-full pl-10 p-3 border rounded-xl bg-white" placeholder="https://..." /></div></div><div className="md:col-span-2"><label className="text-[10px] font-bold text-gray-400 uppercase">Nome Completo</label><input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-3 border rounded-xl bg-white" /></div><div><label className="text-[10px] font-bold text-gray-400 uppercase">E-mail</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 border rounded-xl bg-white" />
                    {/* AVISO DE BLINDAGEM DO EMAIL */}
                    {editingId && formData.email && (
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-amber-600 font-bold">
                            <AlertTriangle size={12}/> Atenção: Mudar o e-mail não altera o login.
                        </div>
                    )}
                    </div><div><label className="text-[10px] font-bold text-gray-400 uppercase">Telefone</label><input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 border rounded-xl bg-white" /></div><div><label className="text-[10px] font-bold text-gray-400 uppercase">Sexo</label><select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full p-3 border rounded-xl bg-white"><option value="male">Masculino</option><option value="female">Feminino</option></select></div><div><label className="text-[10px] font-bold text-gray-400 uppercase">Estado Civil</label><div className="relative"><Heart className="absolute left-3 top-3 text-pink-400" size={16}/><select value={formData.maritalStatus} onChange={e => setFormData({...formData, maritalStatus: e.target.value})} className="w-full pl-10 p-3 border rounded-xl bg-white appearance-none"><option value="single">Solteiro(a)</option><option value="married">Casado(a)</option><option value="divorced">Divorciado(a)</option><option value="widowed">Viúvo(a)</option></select></div></div><div><label className="text-[10px] font-bold text-gray-400 uppercase">Nascimento</label><input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} className="w-full p-3 border rounded-xl bg-white"/></div></div></div>
                    
                    {/* DADOS ECLESIÁSTICOS */}
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><h3 className="text-xs font-bold text-blue-600 uppercase mb-3 flex items-center gap-2"><Building2 size={14}/> Dados Eclesiásticos</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Cargo</label>
                            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-3 border rounded-xl bg-white">
                                <option value="member">Membro</option>
                                <option value="deacon">Diácono</option>
                                <option value="leader">Líder</option>
                                <option value="secretary">Secretaria</option>
                                <option value="treasurer">Tesouraria</option>
                                <option value="admin">Pastor (Admin)</option>
                            </select>
                        </div>
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase">Status</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full p-3 border rounded-xl bg-white"><option value="active">Ativo</option><option value="inactive">Inativo</option></select></div><div><label className="text-[10px] font-bold text-gray-400 uppercase">Data Batismo</label><input type="date" value={formData.baptismDate} onChange={e => setFormData({...formData, baptismDate: e.target.value})} className="w-full p-3 border rounded-xl bg-white"/></div><div className="flex items-end"><div className="w-full bg-white p-3 rounded-xl border border-amber-200 flex items-center gap-3 cursor-pointer hover:bg-amber-50" onClick={() => setFormData({...formData, isTither: !formData.isTither})}><div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.isTither ? 'bg-amber-500 border-amber-500' : 'border-gray-300'}`}>{formData.isTither && <HandCoins size={12} className="text-white"/>}</div><span className="text-sm font-bold text-gray-700">É Dizimista?</span></div></div></div></div>

                    {/* BLINDAGEM: ÁREA DE PERMISSÃO APENAS PARA ADMIN */}
                    {userRole === 'admin' && (
                        <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 animate-in fade-in">
                            <h3 className="text-xs font-bold text-purple-700 uppercase mb-3 flex items-center gap-2">
                                <ShieldCheck size={14}/> Permissões de Acesso (Login)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div 
                                    onClick={() => togglePermission('secretary')}
                                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${formData.permissions.includes('secretary') ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'}`}
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.permissions.includes('secretary') ? 'bg-white' : 'bg-gray-100 border-gray-300'}`}>
                                        {formData.permissions.includes('secretary') && <div className="w-3 h-3 bg-purple-600 rounded-sm" />}
                                    </div>
                                    <div>
                                        <span className="block text-xs font-bold uppercase">Secretaria</span>
                                        <span className={`text-[10px] ${formData.permissions.includes('secretary') ? 'text-purple-200' : 'text-gray-400'}`}>Acessa e edita membros</span>
                                    </div>
                                </div>

                                <div 
                                    onClick={() => togglePermission('financial')}
                                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${formData.permissions.includes('financial') ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'}`}
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.permissions.includes('financial') ? 'bg-white' : 'bg-gray-100 border-gray-300'}`}>
                                        {formData.permissions.includes('financial') && <div className="w-3 h-3 bg-purple-600 rounded-sm" />}
                                    </div>
                                    <div>
                                        <span className="block text-xs font-bold uppercase">Tesouraria</span>
                                        <span className={`text-[10px] ${formData.permissions.includes('financial') ? 'text-purple-200' : 'text-gray-400'}`}>Acessa dízimos e ofertas</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <h3 className="text-xs font-bold text-blue-600 uppercase mb-3 flex items-center gap-2"><Briefcase size={14}/> Ministérios & Departamentos</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {ministryOptions.map(dept => (
                                <div 
                                    key={dept.id} 
                                    onClick={() => toggleMinistry(dept.id!)}
                                    className={`p-2 rounded-lg border text-xs font-bold cursor-pointer transition flex items-center gap-2 ${formData.selectedMinistries.includes(dept.id!) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}`}
                                >
                                    <div className={`w-3 h-3 rounded-full border ${formData.selectedMinistries.includes(dept.id!) ? 'bg-white border-white' : 'bg-transparent border-gray-300'}`}></div>
                                    {dept.name}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><h3 className="text-xs font-bold text-blue-600 uppercase mb-3 flex items-center gap-2"><MapPin size={14}/> Endereço</h3><div className="grid grid-cols-2 gap-4"><div className="col-span-2"><input placeholder="Rua / Avenida" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} className="w-full p-3 border rounded-xl bg-white" /></div><div><input placeholder="Cidade" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full p-3 border rounded-xl bg-white" /></div><div><input placeholder="Estado/Província" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full p-3 border rounded-xl bg-white" /></div></div></div>

                    <div className="flex justify-end pt-4 gap-3">
                        <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200">{loading ? 'Salvando...' : 'Salvar Dados'}</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* MODAL ACESSO (SENHA) */}
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