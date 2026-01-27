"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { memberService } from "../../services/memberService";
import { ministryService } from "../../services/ministryService";
import { Member } from "../../types/member";
import { Ministry } from "../../types/ministry";
import { 
  Users, UserPlus, Search, Edit, Trash2, X, MapPin, Calendar, CreditCard, Phone, User
} from "lucide-react";

export default function MembersPage() {
  const router = useRouter();
  const [churchId, setChurchId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Formulário com GENDER
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    document: "",
    birthDate: "",
    baptismDate: "",
    gender: "male", // Padrão
    role: "member",
    status: "active",
    street: "", number: "", neighborhood: "", city: "", state: "", zipCode: "",
    selectedMinistries: [] as string[]
  });

  useEffect(() => {
    const idSalvo = localStorage.getItem("churchId");
    if (!idSalvo) { router.push("/login"); return; }
    setChurchId(idSalvo);
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
        gender: formData.gender as 'male' | 'female', // Salva o Gênero
        status: formData.status as any,
        role: formData.role as any,
        address: {
          street: formData.street, number: formData.number, neighborhood: formData.neighborhood,
          city: formData.city, state: formData.state, zipCode: formData.zipCode
        },
        ministries: formData.selectedMinistries
      };

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
      setLoading(false);
    }
  };

  const handleEdit = (m: Member) => {
    setEditingId(m.id!);
    setFormData({
      fullName: m.fullName,
      email: m.email || "",
      phone: m.phone || "",
      document: m.document || "",
      birthDate: m.birthDate || "",
      baptismDate: m.baptismDate || "",
      gender: m.gender || "male", // Carrega o Gênero
      role: m.role,
      status: m.status,
      street: m.address?.street || "",
      number: m.address?.number || "",
      neighborhood: m.address?.neighborhood || "",
      city: m.address?.city || "",
      state: m.address?.state || "",
      zipCode: m.address?.zipCode || "",
      selectedMinistries: m.ministries || []
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Excluir este membro?")) {
      await memberService.delete(id);
      carregarDados(churchId);
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Membros</h1>
          <p className="text-gray-500">Gerencie o cadastro das ovelhas</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex items-center bg-white border rounded-lg px-3 py-2 w-full md:w-64">
            <Search size={18} className="text-gray-400 mr-2"/>
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="outline-none w-full text-sm"/>
          </div>
          <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap">
            <UserPlus size={20} /> Novo Membro
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
            <tr>
              <th className="p-4 font-medium">Nome</th>
              <th className="p-4 font-medium hidden md:table-cell">Status</th>
              <th className="p-4 font-medium hidden md:table-cell">Ministérios</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredMembers.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50/50 transition">
                <td className="p-4">
                  <p className="font-bold text-gray-900">{m.fullName}</p>
                  <p className="text-xs text-gray-400">
                    {m.gender === 'male' ? 'Masculino' : m.gender === 'female' ? 'Feminino' : '-'} • {m.phone}
                  </p>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${m.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                      {m.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-4 hidden md:table-cell">
                   <div className="flex flex-wrap gap-1">
                     {m.ministries?.map(mid => {
                       const min = ministries.find(x => x.id === mid);
                       return min ? <span key={mid} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{min.name}</span> : null
                     })}
                   </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(m)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16}/></button>
                    <button onClick={() => handleDelete(m.id!)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
            <h2 className="text-xl font-bold text-gray-800 mb-6">{editingId ? 'Editar Ficha' : 'Novo Cadastro'}</h2>

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Users size={14}/> Dados Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nome Completo</label>
                        <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">CPF / BI</label>
                        <div className="relative"><CreditCard size={16} className="absolute left-3 top-2.5 text-gray-400"/><input type="text" value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})} className="w-full pl-9 p-2 border rounded-lg"/></div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Telefone</label>
                        <div className="relative"><Phone size={16} className="absolute left-3 top-2.5 text-gray-400"/><input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-9 p-2 border rounded-lg"/></div>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">E-mail</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2 border rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Data de Nascimento</label>
                        <input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} className="w-full p-2 border rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Sexo / Gênero</label>
                        <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full p-2 border rounded-lg bg-white">
                            <option value="male">Masculino</option>
                            <option value="female">Feminino</option>
                        </select>
                    </div>
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
                     <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full p-2 border rounded-lg bg-white">
                            <option value="active">Ativo</option>
                            <option value="inactive">Inativo</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Cargo</label>
                        <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-2 border rounded-lg bg-white">
                            <option value="member">Membro</option>
                            <option value="leader">Líder</option>
                            <option value="secretary">Secretária</option>
                            <option value="treasurer">Tesoureiro</option>
                            <option value="pastor">Pastor</option>
                            <option value="admin">Admin</option>
                        </select>
                     </div>
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
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border rounded-lg text-gray-600 font-medium hover:bg-gray-50">Cancelar</button>
                  <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">
                    {loading ? 'Salvando...' : 'Salvar Ficha'}
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}