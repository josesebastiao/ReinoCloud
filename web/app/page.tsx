"use client";
import { useState } from "react";
import { memberService } from "../services/memberService";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Cria um membro de teste
      await memberService.create({
        fullName: nome,
        email: email,
        churchId: "igreja-teste-01", // Simula uma igreja logada
        role: "member",
        status: "active",
        searchKeywords: [], // O serviço gera isso automático
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
    } catch (error) {
      alert("❌ Erro ao cadastrar (veja o console)");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">ReinoCloud</h1>
        <h2 className="text-lg mb-4 text-gray-700">Teste de Cadastro</h2>
        
        <form onSubmit={handleCadastro} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
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
            {loading ? "Salvando..." : "Cadastrar Membro"}
          </button>
        </form>
      </div>
    </div>
  );
}