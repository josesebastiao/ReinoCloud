"use client";
import { useState, useEffect } from "react";
import { memberService } from "../services/memberService";
import { Member } from "../types/member";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [membros, setMembros] = useState<Member[]>([]); // Estado para guardar a lista

  // Função para buscar os membros no banco
  const carregarMembros = async () => {
    try {
      const lista = await memberService.listByChurch("igreja-teste-01");
      setMembros(lista);
    } catch (error) {
      console.error("Erro ao listar membros:", error);
    }
  };

  // useEffect roda assim que a tela abre
  useEffect(() => {
    carregarMembros();
  }, []);

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await memberService.create({
        fullName: nome,
        email: email,
        churchId: "igreja-teste-01",
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

      alert("✅ Membro cadastrado com sucesso!");
      setNome("");
      setEmail("");
      carregarMembros(); // Atualiza a lista na hora!
    } catch (error) {
      alert("❌ Erro ao cadastrar");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LADO ESQUERDO: Formulário */}
        <div className="bg-white p-6 rounded-lg shadow-md h-fit">
          <h2 className="text-xl font-bold mb-4 text-blue-600">Novo Membro</h2>
          <form onSubmit={handleCadastro} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loading ? "Salvando..." : "Cadastrar"}
            </button>
          </form>
        </div>

        {/* LADO DIREITO: Lista de Membros */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex justify-between items-center">
            Membros da Igreja
            <span className="text-sm font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Total: {membros.length}
            </span>
          </h2>
          
          {membros.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhum membro cadastrado.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {membros.map((membro) => (
                <li key={membro.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{membro.fullName}</p>
                    <p className="text-sm text-gray-500">{membro.email}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    membro.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {membro.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}