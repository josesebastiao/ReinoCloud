"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { memberService } from "../services/memberService";
import { Member } from "../types/member";
import { Pencil, Trash2, X, User, CheckCircle } from "lucide-react"; // Novos ícones

export default function Home() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [churchId, setChurchId] = useState("");
  const [churchName, setChurchName] = useState("");
  const [membros, setMembros] = useState<Member[]>([]);

  // Estado para EDIÇÃO (Modal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Campos do formulário (Usados tanto para criar quanto editar)
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const idSalvo = localStorage.getItem("churchId");
    const nomeSalvo = localStorage.getItem("churchName");

    if (!idSalvo) {
      router.push("/login");
      return;
    }

    setChurchId(idSalvo);
    if (nomeSalvo) setChurchName(nomeSalvo);
    carregarMembros(idSalvo);
  }, [router]);

  const carregarMembros = async (idDaIgreja: string) => {
    const lista = await memberService.listByChurch(idDaIgreja);
    setMembros(lista);
  };

  // Prepara o modal para CRIAR
  const abrirModalCriacao = () => {
    setEditingId(null);
    setNome("");
    setEmail("");
    setIsModalOpen(true);
  };

  // Prepara o modal para EDITAR
  const abrirModalEdicao = (membro: Member) => {
    setEditingId(membro.id || null);
    setNome(membro.fullName);
    setEmail(membro.email);
    setIsModalOpen(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        // --- MODO EDIÇÃO ---
        await memberService.update(editingId, {
          fullName: nome,
          email: email
        });
        alert("✅ Membro atualizado!");
      } else {
        // --- MODO CRIAÇÃO ---
        await memberService.create({
          fullName: nome,
          email: email,
          churchId: churchId,
          role: "member",
          status: "active",
          photoUrl: "",
          phone: "",
          address: { street: "", district: "", city: "", state: "", zipCode: "" },
          birthDate: "",
          gender: "M",
          maritalStatus: "single",
          ministries: []
        });
        alert("✅ Membro cadastrado!");
      }
      
      setIsModalOpen(false); // Fecha modal
      carregarMembros(churchId); // Atualiza lista
    } catch (error) {
      alert("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este membro?")) {
        await memberService.delete(id);
        carregarMembros(churchId);
    }
  };

  // Gera as iniciais para o avatar (Ex: José Silva -> JS)
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (!churchId) return <div className="flex h-screen items-center justify-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Cabeçalho */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Membros</h1>
          <p className="text-gray-500">Gerenciando: {churchName}</p>
        </div>
        <button 
          onClick={abrirModalCriacao}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition"
        >
          <User size={20} /> Novo Membro
        </button>
      </div>

      {/* Lista de Membros (Card Style) */}
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {membros.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 p-4 rounded-full w-fit mx-auto mb-4">
              <User size={40} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Nenhum membro ainda</h3>
            <p className="text-gray-500">Comece adicionando o primeiro fiel da igreja.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
              <tr>
                <th className="p-4 font-medium">Nome</th>
                <th className="p-4 font-medium">Contato</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {membros.map((membro) => (
                <tr key={membro.id} className="hover:bg-gray-50/50 transition group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {getInitials(membro.fullName)}
                      </div>
                      <span className="font-medium text-gray-900">{membro.fullName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-500 text-sm">{membro.email}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle size={12} /> Ativo
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => abrirModalEdicao(membro)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" 
                        title="Editar"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => handleExcluir(membro.id!)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Excluir"
                      >
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

      {/* --- MODAL (JANELA FLUTUANTE) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? "Editar Membro" : "Novo Membro"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSalvar} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  required
                />
              </div>
              
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-blue-400"
                >
                  {loading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}