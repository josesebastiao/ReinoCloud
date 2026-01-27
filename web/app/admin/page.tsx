"use client";
import { useState, useEffect } from "react";
import { churchService } from "../../services/churchService";
import { Church } from "../../types/church";
import { Trash2, Lock, Unlock, UserCog, Plus } from "lucide-react";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"; 
import { db } from "../../lib/firebase";

export default function SuperAdminPage() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para promover membro (Área de Emergência)
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoteChurchId, setPromoteChurchId] = useState("");

  useEffect(() => {
    loadChurches();
  }, []);

  const loadChurches = async () => {
    setLoading(true);
    const data = await churchService.listAll();
    setChurches(data);
    setLoading(false);
  };

  // --- NOVO FLUXO DE CRIAÇÃO ---
  const handleCreateChurch = async () => {
    // 1. Pergunta os dados da Igreja
    const churchName = prompt("Nome da Nova Igreja:");
    if (!churchName) return;

    // 2. Pergunta os dados do Pastor Responsável
    const pastorEmail = prompt(`E-mail do Pastor da ${churchName}:`);
    if (!pastorEmail) return;

    const pastorName = prompt("Nome do Pastor:");
    if (!pastorName) return;

    try {
      // Chama o serviço que cria TUDO junto
      await churchService.create(
        { name: churchName, plan: "basic" }, 
        { name: pastorName, email: pastorEmail }
      );
      
      alert(`✅ Sucesso!\nIgreja: ${churchName}\nPastor: ${pastorName} (${pastorEmail})\n\nO Pastor já pode fazer login (Criar Senha).`);
      loadChurches();
    } catch (error) {
      alert("Erro ao criar igreja.");
    }
  };

  const handleToggleStatus = async (id: string, current: boolean) => {
    await churchService.toggleStatus(id, current);
    loadChurches();
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmText = prompt(`Para deletar a igreja "${name}", digite DELETAR abaixo:`);
    if (confirmText === "DELETAR") {
      await churchService.delete(id);
      loadChurches();
    }
  };

  // Área de Emergência (Mantida para correções)
  const handlePromoteToAdmin = async () => {
    if (!promoteEmail || !promoteChurchId) return alert("Preencha e-mail e ID");
    try {
      const q = query(collection(db, "members"), where("email", "==", promoteEmail), where("churchId", "==", promoteChurchId));
      const snap = await getDocs(q);
      if (snap.empty) return alert("Membro não encontrado nesta igreja.");
      
      await updateDoc(doc(db, "members", snap.docs[0].id), { role: "admin" });
      alert("Promovido com sucesso!");
      setPromoteEmail(""); setPromoteChurchId("");
    } catch (error) { alert("Erro ao promover."); }
  };

  if (loading) return <div className="p-8 text-center text-white">Carregando império...</div>;

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-500">ReinoCloud | Super Admin</h1>
            <p className="text-gray-400">Gestão dos Tenants (Clientes)</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadChurches} className="bg-slate-800 px-4 py-2 rounded border border-slate-700">Atualizar</button>
            <button onClick={handleCreateChurch} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-lg">
                <Plus size={20} /> Nova Igreja + Pastor
            </button>
          </div>
        </div>

        {/* ÁREA DE EMERGÊNCIA */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-8 shadow-lg">
          <h3 className="font-bold text-yellow-400 flex items-center gap-2 mb-2">
            <UserCog size={20}/> Área de Emergência
          </h3>
          <p className="text-xs text-gray-400 mb-4">Use apenas se precisar corrigir um acesso manualmente.</p>
          <div className="flex gap-2">
            <input type="text" placeholder="ID da Igreja" value={promoteChurchId} onChange={e => setPromoteChurchId(e.target.value)} className="bg-slate-900 border border-slate-600 p-2 rounded text-sm w-1/3 text-white" />
            <input type="email" placeholder="E-mail do usuário" value={promoteEmail} onChange={e => setPromoteEmail(e.target.value)} className="bg-slate-900 border border-slate-600 p-2 rounded text-sm w-1/3 text-white" />
            <button onClick={handlePromoteToAdmin} className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded font-bold text-sm text-slate-900">Promover</button>
          </div>
        </div>

        {/* LISTA */}
        <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-gray-400 text-sm">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Igreja</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {churches.map((church) => (
                <tr key={church.id} className="hover:bg-slate-700/50">
                  <td className="p-4 text-xs font-mono text-gray-500 select-all">{church.id}</td>
                  <td className="p-4"><p className="font-bold text-white text-lg">{church.name}</p></td>
                  <td className="p-4">
                    {church.active ? <span className="text-xs bg-green-900/50 text-green-300 px-2 py-1 rounded border border-green-700">Ativa</span> : <span className="text-xs bg-red-900/50 text-red-300 px-2 py-1 rounded border border-red-700">Bloqueada</span>}
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => handleToggleStatus(church.id!, church.active)} className="p-2 bg-slate-900 rounded border border-slate-700 text-gray-300">{church.active ? <Lock size={16}/> : <Unlock size={16}/>}</button>
                    <button onClick={() => handleDelete(church.id!, church.name)} className="p-2 bg-red-900/20 rounded border border-red-900/50 text-red-500"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}