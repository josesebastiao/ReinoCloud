"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { memberService } from "../../services/memberService";
import { ministryService } from "../../services/ministryService";
import { Member } from "../../types/member";
import { Ministry } from "../../types/ministry";
import { 
  Users, UserPlus, Search, Edit, Trash2, X, MapPin, Calendar, 
  IdCard, Printer, Shield, Phone 
} from "lucide-react";

export default function MembersPage() {
  const router = useRouter();
  const [churchId, setChurchId] = useState("");
  const [churchName, setChurchName] = useState("Igreja");
  const [members, setMembers] = useState<Member[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "", email: "", phone: "", document: "", 
    birthDate: "", baptismDate: "", gender: "male", role: "member", status: "active",
    street: "", number: "", neighborhood: "", city: "", state: "", zipCode: "",
    selectedMinistries: [] as string[]
  });

  useEffect(() => {
    const idSalvo = localStorage.getItem("churchId");
    const nomeIgreja = localStorage.getItem("churchName");
    if (!idSalvo) { router.push("/login"); return; }
    setChurchId(idSalvo);
    if(nomeIgreja) setChurchName(nomeIgreja);
    carregarDados(idSalvo);
  }, [router]);

  const carregarDados = async (id: string) => {
    try {
      const [listaMembros, listaMinisterios] = await Promise.all([
        memberService.listByChurch(id),
        ministryService.listByChurch(id)
      ]);
      setMembers(listaMembros);
      setMinistries(listaMinisterios);
    } catch (error) { console.error(error); }
  };

  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const memberData: Member = {
        churchId,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        document: formData.document,
        birthDate: formData.birthDate,
        baptismDate: formData.baptismDate,
        gender: formData.gender as 'male'|'female',
        status: formData.status as any,
        role: formData.role as any,
        address: {
          street: formData.street, number: formData.number, neighborhood: formData.neighborhood,
          city: formData.city, state: formData.state, zipCode: formData.zipCode
        },
        ministries: formData.selectedMinistries
      };

      // --- MODO OFFLINE (PULO DO GATO) ---
      if (!navigator.onLine) {
          if (editingId) { 
              memberService.update(editingId, memberData); 
          } else { 
              memberService.create(memberData); 
          }
          
          alert("Salvo no dispositivo (Offline)!");
          setIsModalOpen(false);
          resetForm();
          setLoading(false);
          
          // Atualiza a tela localmente
          setTimeout(() => carregarDados(churchId), 500);
          return;
      }

      // --- MODO ONLINE (NORMAL) ---
      if (editingId) { 
          await memberService.update(editingId, memberData); 
      } else { 
          await memberService.create(memberData); 
      }
      
      setIsModalOpen(false); 
      resetForm(); 
      carregarDados(churchId);

    } catch (error: any) { 
        alert("Erro ao salvar: " + error.message); 
    } finally { 
        if(navigator.onLine) setLoading(false); 
    }
  };

  const handleEdit = (m: Member) => {
    setEditingId(m.id!);
    setFormData({
      fullName: m.fullName, email: m.email || "", phone: m.phone || "", document: m.document || "",
      birthDate: m.birthDate || "", baptismDate: m.baptismDate || "", gender: m.gender || "male",
      role: m.role, status: m.status,
      street: m.address?.street || "", number: m.address?.number || "", neighborhood: m.address?.neighborhood || "",
      city: m.address?.city || "", state: m.address?.state || "", zipCode: m.address?.zipCode || "",
      selectedMinistries: m.ministries || []
    });
    setIsModalOpen(true);
  };

  const handleOpenCard = (m: Member) => { setSelectedMember(m); setIsCardModalOpen(true); };

  const handleDelete = async (id: string) => {
    if (confirm("Excluir este membro?")) { 
        // Lógica Offline para Deletar
        if (!navigator.onLine) {
            memberService.delete(id);
            alert("Exclusão agendada (Offline).");
            setTimeout(() => carregarDados(churchId), 500);
        } else {
            await memberService.delete(id); 
            carregarDados(churchId); 
        }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      fullName: "", email: "", phone: "", document: "", 
      birthDate: "", baptismDate: "", gender: "male", role: "member", status: "active",
      street: "", number: "", neighborhood: "", city: "", state: "", zipCode: "",
      selectedMinistries: []
    });
  };

  const toggleMinistry = (minId: string) => {
    setFormData(prev => {
      const exists = prev.selectedMinistries.includes(minId);
      if (exists) return { ...prev, selectedMinistries: prev.selectedMinistries.filter(id => id !== minId) };
      return { ...prev, selectedMinistries: [...prev.selectedMinistries, minId] };
    });
  };

  const printList = () => window.print();
  const printCard = () => window.print();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 print:p-0 print:bg-white pb-24">
      
      {/* HEADER MOBILE-FIRST */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Membros</h1>
          <p className="text-sm text-gray-500">Gerencie o cadastro das ovelhas</p>
        </div>
        
        <div className="w-full md:w-auto flex flex-col gap-3">
            <div className="relative w-full md:w-64">
                <Search size={18} className="absolute left-3 top-3 text-gray-400"/>
                <input 
                    type="text" 
                    placeholder="Buscar membro..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="w-full pl-10 pr-4 py-2 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
                />
            </div>
            <div className="flex gap-2">
                <button onClick={printList} className="flex-1 md:flex-none justify-center bg-white border text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 flex items-center gap-2 text-sm font-bold shadow-sm">
                    <Printer size={18} /> <span className="hidden md:inline">Lista</span> <span className="md:hidden">Imprimir</span>
                </button>
                <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex-1 md:flex-none justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg">
                    <UserPlus size={18} /> Novo <span className="hidden md:inline">Membro</span>
                </button>
            </div>
        </div>
      </div>

      {/* CABEÇALHO IMPRESSÃO */}
      <div className="hidden print:block text-center mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold uppercase">{churchName}</h1>
          <p className="text-sm text-gray-500">Relatório Geral de Membros</p>
          <p className="text-xs text-gray-400 mt-1">Gerado em {new Date().toLocaleDateString()}</p>
      </div>

      {/* LISTA DE MEMBROS */}
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-0">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs font-bold border-b uppercase hidden md:table-header-group">
            <tr>
              <th className="p-4">Nome</th>
              <th className="p-4 print:table-cell">Status</th>
              <th className="p-4 print:hidden">Ministérios</th>
              <th className="p-4 text-right print:hidden">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredMembers.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50 transition flex flex-col md:table-row p-4 md:p-0 relative">
                
                <td className="md:p-4 flex items-center gap-3 mb-2 md:mb-0">
                  <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex-shrink-0 flex items-center justify-center text-blue-600 print:hidden font-bold text-xs">
                     {m.fullName.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-base md:text-sm">{m.fullName}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                        {m.role === 'admin' || m.role === 'pastor' ? <Shield size={10} className="text-yellow-500"/> : null}
                        <span className="capitalize">{m.role === 'admin' ? 'Pastor/Admin' : m.role}</span>
                        {m.phone && <span className="hidden md:inline">• {m.phone}</span>}
                    </p>
                    {m.phone && (
                        <p className="text-xs text-gray-500 md:hidden flex items-center gap-1 mt-0.5">
                            <Phone size={10}/> {m.phone}
                        </p>
                    )}
                  </div>
                  
                  <div className="absolute top-4 right-4 md:hidden">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${m.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                        {m.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </td>

                <td className="md:p-4 hidden md:table-cell print:table-cell">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase border ${m.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'} print:border-0 print:p-0`}>
                      {m.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>

                <td className="md:p-4 hidden md:table-cell print:hidden">
                   <div className="flex flex-wrap gap-1">
                     {m.ministries?.map(mid => {
                       const min = ministries.find(x => x.id === mid);
                       return min ? <span key={mid} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">{min.name}</span> : null
                     })}
                   </div>
                </td>

                <td className="md:p-4 text-right print:hidden mt-2 md:mt-0 border-t pt-3 md:border-0 md:pt-0">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleOpenCard(m)} className="p-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg flex items-center gap-1 text-xs font-bold">
                        <IdCard size={16}/> <span className="md:hidden">Cartão</span>
                    </button>
                    <button onClick={() => handleEdit(m)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg flex items-center gap-1 text-xs font-bold">
                        <Edit size={16}/> <span className="md:hidden">Editar</span>
                    </button>
                    <button onClick={() => handleDelete(m.id!)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg">
                        <Trash2 size={16}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
             <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-50 p-1 rounded-full"><X size={20} /></button>
            <h2 className="text-xl font-bold text-gray-800 mb-6">{editingId ? 'Editar Ficha' : 'Novo Cadastro'}</h2>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Users size={14}/> Dados Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1">Nome Completo</label><input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">CPF / BI</label><input type="text" value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})} className="w-full p-2 border rounded-lg"/></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">Telefone</label><input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2 border rounded-lg"/></div>
                    <div className="md:col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1">E-mail</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">Nascimento</label><input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">Sexo</label><select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full p-2 border rounded-lg bg-white"><option value="male">Masculino</option><option value="female">Feminino</option></select></div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><MapPin size={14}/> Localização</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-2 md:col-span-3"><label className="block text-xs font-medium text-gray-500 mb-1">Rua</label><input type="text" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">Nº</label><input type="text" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
                    <div className="col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1">Bairro</label><input type="text" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">Cidade</label><input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">Província</label><input type="text" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Calendar size={14}/> Vida Eclesiástica</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                     <div><label className="block text-xs font-medium text-gray-500 mb-1">Status</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full p-2 border rounded-lg bg-white"><option value="active">Ativo</option><option value="inactive">Inativo</option></select></div>
                     <div><label className="block text-xs font-medium text-gray-500 mb-1">Cargo</label><select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-2 border rounded-lg bg-white"><option value="member">Membro</option><option value="leader">Líder</option><option value="secretary">Secretária</option><option value="treasurer">Tesoureiro</option><option value="pastor">Pastor</option><option value="admin">Admin</option></select></div>
                </div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Ministérios</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border p-2 rounded-lg bg-gray-50">
                    {ministries.map(min => (
                        <label key={min.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 p-1 rounded">
                            <input type="checkbox" checked={formData.selectedMinistries.includes(min.id!)} onChange={() => toggleMinistry(min.id!)} className="rounded text-blue-600"/>
                            {min.name}
                        </label>
                    ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border rounded-xl text-gray-600 font-medium hover:bg-gray-50">Cancelar</button>
                  <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">{loading ? 'Salvando...' : 'Salvar Ficha'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCardModalOpen && selectedMember && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm print:absolute print:inset-0 print:bg-white print:p-0">
          <div className="bg-white rounded-2xl shadow-2xl p-6 relative max-w-lg w-full print:shadow-none print:w-auto print:max-w-none print:p-0">
             <button onClick={() => setIsCardModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 p-1 rounded-full print:hidden"><X size={20} /></button>
             <div className="mb-6 flex justify-between items-center print:hidden">
                <h2 className="text-xl font-bold text-gray-800">Carteirinha Digital</h2>
                <button onClick={printCard} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg"><Printer size={18}/> Imprimir</button>
             </div>
             <div className="print:flex print:items-center print:justify-center print:h-screen">
                <div className="w-[85.6mm] h-[53.98mm] bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl shadow-lg relative overflow-hidden text-white mx-auto print:shadow-none print:rounded-none border border-gray-200">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>
                    <div className="p-4 h-full flex flex-col justify-between relative z-10">
                        <div className="flex justify-between items-start">
                            <div><h3 className="font-bold text-[10px] uppercase tracking-wide opacity-80">Membro</h3><h1 className="font-bold text-sm leading-tight max-w-[160px]">{churchName}</h1></div>
                            <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center"><Shield size={12} className="text-white"/></div>
                        </div>
                        <div className="flex gap-3 items-center mt-1">
                             <div className="w-14 h-14 bg-white/20 rounded-lg border-2 border-white/30 overflow-hidden flex items-center justify-center shrink-0 font-bold text-2xl">
                                {selectedMember.fullName.substring(0,2).toUpperCase()}
                             </div>
                             <div>
                                <h2 className="font-bold text-base truncate w-40">{selectedMember.fullName}</h2>
                                <p className="text-[10px] text-blue-200 uppercase">{selectedMember.role === 'admin' ? 'Pastor' : selectedMember.role}</p>
                                <p className="text-[8px] mt-0.5 opacity-70">Desde {selectedMember.createdAt ? new Date(selectedMember.createdAt.seconds * 1000).getFullYear() : new Date().getFullYear()}</p>
                             </div>
                        </div>
                        <div className="flex justify-between items-end">
                            <div><p className="text-[8px] uppercase opacity-60">Matrícula</p><p className="font-mono text-[10px] tracking-wider">{selectedMember.id?.slice(0,8).toUpperCase()}</p></div>
                            <div className="w-8 h-8 bg-white rounded flex items-center justify-center"><div className="w-6 h-6 border-2 border-black border-dashed opacity-30"></div></div>
                        </div>
                    </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}