"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { memberService } from "../../services/memberService";
import { Member } from "../../types/member";
import { ministryService } from "../../services/ministryService"; // <--- NOVO IMPORT
import { Ministry } from "../../types/ministry"; // <--- NOVO IMPORT
import { 
  Pencil, Trash2, X, User, MapPin, 
  Phone, FileText, Search, Users // <--- NOVO ÍCONE
} from "lucide-react";

export default function MembersPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [churchId, setChurchId] = useState("");
  const [churchName, setChurchName] = useState("");
  const [membros, setMembros] = useState<Member[]>([]);
  
  // --- NOVO: Lista de Ministérios Disponíveis ---
  const [availableMinistries, setAvailableMinistries] = useState<Ministry[]>([]);

  const [busca, setBusca] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Estados do Formulário (Adicionado o array de ministries)
  const [formData, setFormData] = useState({
    fullName: "", email: "", phone: "", document: "", birthDate: "", baptismDate: "",
    street: "", number: "", neighborhood: "", city: "", state: "",
    ministries: [] as string[] // <--- ARRAY DE IDs DOS MINISTÉRIOS
  });

  useEffect(() => {
    const idSalvo = localStorage.getItem("churchId");
    const nomeSalvo = localStorage.getItem("churchName");

    if (!idSalvo) {
      router.push("/login");
      return;
    }

    setChurchId(idSalvo);
    if (nomeSalvo) setChurchName(nomeSalvo);
    
    // Carrega Membros E Ministérios
    carregarDados(idSalvo);
  }, [router]);

  const carregarDados = async (idDaIgreja: string) => {
    // Carregamos os dois em paralelo para ser rápido
    const [listaMembros, listaMinisterios] = await Promise.all([
      memberService.listByChurch(idDaIgreja),
      ministryService.listByChurch(idDaIgreja)
    ]);
    
    setMembros(listaMembros);
    setAvailableMinistries(listaMinisterios);
  };

  const membrosFiltrados = membros.filter(membro => 
    membro.fullName.toLowerCase().includes(busca.toLowerCase()) ||
    membro.email.toLowerCase().includes(busca.toLowerCase()) ||
    (membro.document && membro.document.includes(busca))
  );

  const abrirModalCriacao = () => {
    setEditingId(null);
    setFormData({
      fullName: "", email: "", phone: "", document: "", birthDate: "", baptismDate: "",
      street: "", number: "", neighborhood: "", city: "", state: "",
      ministries: [] // Começa vazio
    });
    setIsModalOpen(true);
  };

  const abrirModalEdicao = (membro: Member) => {
    setEditingId(membro.id || null);
    setFormData({
      fullName: membro.fullName,
      email: membro.email,
      phone: membro.phone || "",
      document: membro.document || "",
      birthDate: membro.birthDate || "",
      baptismDate: membro.baptismDate || "",
      street: membro.address?.street || "",
      number: membro.address?.number || "",
      neighborhood: membro.address?.neighborhood || "",
      city: membro.address?.city || "",
      state: membro.address?.state || "",
      ministries: membro.ministries || [] // Carrega o que ele já participa
    });
    setIsModalOpen(true);
  };

  // --- NOVA LÓGICA: Marcar/Desmarcar Ministério ---
  const toggleMinistry = (ministryId: string) => {
    setFormData(prev => {
      const exists = prev.ministries.includes(ministryId);
      if (exists) {
        // Se já tem, remove
        return { ...prev, ministries: prev.ministries.filter(id => id !== ministryId) };
      } else {
        // Se não tem, adiciona
        return { ...prev, ministries: [...prev.ministries, ministryId] };
      }
    });
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const dadosParaSalvar: Partial<Member> = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      document: formData.document,
      birthDate: formData.birthDate,
      baptismDate: formData.baptismDate,
      address: {
        street: formData.street,
        number: formData.number,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        zipCode: ""
      },
      ministries: formData.ministries, // <--- SALVANDO AS EQUIPES
      churchId: churchId,
      status: "active",
      role: "member"
    };

    try {
      if (editingId) {
        await memberService.update(editingId, dadosParaSalvar);
        alert("✅ Dados atualizados!");
      } else {
        await memberService.create(dadosParaSalvar as any); 
        alert("✅ Membro cadastrado!");
      }
      setIsModalOpen(false);
      // Recarrega apenas a lista de membros
      const lista = await memberService.listByChurch(churchId);
      setMembros(lista);
    } catch (error) {
      alert("Erro ao salvar.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir?")) {
        await memberService.delete(id);
        const lista = await memberService.listByChurch(churchId);
        setMembros(lista);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  // Helper para mostrar os nomes dos ministérios na lista (opcional, visual)
  const getMinistryNames = (ids: string[]) => {
    if (!ids || ids.length === 0) return null;
    return ids.map(id => {
      const min = availableMinistries.find(m => m.id === id);
      return min ? min.name : null;
    }).filter(Boolean).join(", ");
  };

  if (!churchId) return <div className="flex h-screen items-center justify-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Topo */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Membros</h1>
          <p className="text-gray-500">{churchName}</p>
        </div>
        <button onClick={abrirModalCriacao} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm w-full md:w-auto justify-center">
          <User size={20} /> Novo Membro
        </button>
      </div>

      {/* Busca */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar por nome, e-mail ou documento..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 p-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {membrosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {busca ? "Nenhum membro encontrado." : "Nenhum membro cadastrado."}
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
              <tr>
                <th className="p-4 font-medium">Nome / Equipes</th>
                <th className="p-4 font-medium hidden md:table-cell">Contato</th>
                <th className="p-4 font-medium hidden md:table-cell">Cidade</th>
                <th className="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {membrosFiltrados.map((membro) => (
                <tr 
                  key={membro.id} 
                  onClick={() => abrirModalEdicao(membro)} 
                  className="hover:bg-blue-50/50 transition cursor-pointer group"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {getInitials(membro.fullName)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{membro.fullName}</p>
                        {/* Mostra as etiquetas dos ministérios na lista */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {membro.ministries && membro.ministries.length > 0 ? (
                             membro.ministries.map(minId => {
                               const min = availableMinistries.find(m => m.id === minId);
                               if(!min) return null;
                               return (
                                 <span key={minId} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                   {min.name}
                                 </span>
                               )
                             })
                          ) : (
                            <p className="text-xs text-gray-400">{membro.document || "Sem doc"}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <p className="text-sm text-gray-700">{membro.email}</p>
                    <p className="text-xs text-gray-500">{membro.phone}</p>
                  </td>
                  <td className="p-4 text-sm text-gray-600 hidden md:table-cell">
                    {membro.address?.city}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={(e) => { e.stopPropagation(); abrirModalEdicao(membro); }} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg">
                        <Pencil size={18} />
                      </button>
                      <button onClick={(e) => handleExcluir(e, membro.id!)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? "Ficha do Membro" : "Novo Cadastro"}
              </h2>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            
            <form onSubmit={handleSalvar} className="p-6 overflow-y-auto">
              
              {/* Seção 1: Dados Pessoais */}
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                <User size={14}/> Dados Pessoais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Nome Completo</label>
                  <input name="fullName" value={formData.fullName} onChange={handleChange} className="w-full p-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">CPF / Doc</label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-2.5 top-2.5 text-gray-400" />
                    <input name="document" value={formData.document} onChange={handleChange} className="w-full pl-9 p-2 border rounded-lg" />
                  </div>
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-700">Telefone</label>
                    <div className="relative">
                        <Phone size={16} className="absolute left-2.5 top-2.5 text-gray-400" />
                        <input name="phone" value={formData.phone} onChange={handleChange} className="w-full pl-9 p-2 border rounded-lg" />
                    </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-gray-700">E-mail</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded-lg" />
                </div>
              </div>

              {/* Seção 2: Endereço (Compactado para caber mais coisa) */}
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2 border-t pt-4">
                <MapPin size={14}/> Localização
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-700">Cidade</label>
                    <input name="city" value={formData.city} onChange={handleChange} className="w-full p-2 border rounded-lg" />
                </div>
                <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-700">Estado</label>
                    <input name="state" value={formData.state} onChange={handleChange} className="w-full p-2 border rounded-lg" />
                </div>
              </div>

              {/* Seção 3: Ministérios (NOVA!) */}
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2 border-t pt-4">
                <Users size={14}/> Ministérios e Equipes
              </h3>
              
              {availableMinistries.length === 0 ? (
                <div className="bg-gray-50 p-4 rounded-lg text-center text-sm text-gray-500 mb-6">
                  Nenhum ministério cadastrado na igreja.
                  <br/>
                  <a href="/ministries" className="text-blue-600 hover:underline">Crie as equipes primeiro.</a>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {availableMinistries.map(min => {
                    const isSelected = formData.ministries.includes(min.id!);
                    return (
                      <div 
                        key={min.id}
                        onClick={() => toggleMinistry(min.id!)}
                        className={`
                          cursor-pointer p-3 rounded-lg border flex items-center gap-3 transition
                          ${isSelected 
                            ? "bg-blue-50 border-blue-200 text-blue-800" 
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}
                        `}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
                          {isSelected && <span className="text-white text-[10px]">✓</span>}
                        </div>
                        <span className="text-sm font-medium">{min.name}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Botões */}
              <div className="pt-2 flex gap-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400">
                  {loading ? "Salvando..." : "Salvar Ficha"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}