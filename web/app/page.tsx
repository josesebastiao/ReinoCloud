"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Importante para redirecionar
import { memberService } from "../services/memberService";
import { Member } from "../types/member";

export default function Home() {
  const router = useRouter();
  
  // Estados de controle
  const [loading, setLoading] = useState(false);
  const [churchId, setChurchId] = useState("");
  const [churchName, setChurchName] = useState("");
  
  // Estados do formulário
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [membros, setMembros] = useState<Member[]>([]);

  // 1. Verifica login e Carrega dados ao abrir a tela
  useEffect(() => {
    // Tenta pegar o ID salvo no login (navegador)
    const idSalvo = localStorage.getItem("churchId");
    const nomeSalvo = localStorage.getItem("churchName");

    if (!idSalvo) {
      // Se não tem ID, chuta o usuário para a tela de login
      router.push("/login");
      return;
    }

    // Se tem ID, salva no estado e carrega os membros
    setChurchId(idSalvo);
    if (nomeSalvo) setChurchName(nomeSalvo);
    carregarMembros(idSalvo);
  }, [router]);

  const carregarMembros = async (idDaIgreja: string) => {
    try {
      const lista = await memberService.listByChurch(idDaIgreja);
      setMembros(lista);
    } catch (error) {
      console.error("Erro ao listar membros:", error);
    }
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId) return; // Segurança extra

    setLoading(true);

    try {
      await memberService.create({
        fullName: nome,
        email: email,
        churchId: churchId, // <--- USA O ID REAL DA IGREJA LOGADA
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
      carregarMembros(churchId); // Atualiza a lista na hora
    } catch (error) {
      alert("❌ Erro ao cadastrar");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Enquanto verifica o login, mostra "Carregando" para não piscar a tela errada
  if (!churchId) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500">Verificando acesso...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Cabeçalho */}
      <div className="max-w-4xl mx-auto mb-6">
        {/* MUDANÇA VISUAL AQUI: Mudamos de Dashboard para Painel Principal */}
        <h1 className="text-2xl font-bold text-gray-800">Painel Principal</h1>
        <p className="text-gray-500">Gerenciando: <span className="font-semibold text-blue-600">{churchName}</span></p>
      </div>

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
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">Nenhum membro nesta igreja ainda.</p>
              <p className="text-xs text-gray-400">Cadastre o primeiro ao lado!</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
              {membros.map((membro) => (
                <li key={membro.id} className="py-3 flex justify-between items-center pr-2">
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