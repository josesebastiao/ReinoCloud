"use client";
import { useState, useEffect } from "react";
import { churchService } from "../../services/churchService";
import { Church } from "../../types/church";
import { Trash2, Lock, Unlock, ShieldAlert, UserCog } from "lucide-react";
// Precisamos acessar o banco para promover membros
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"; 
import { db } from "../../lib/firebase";

export default function SuperAdminPage() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para promover membro
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

  const handleToggleStatus = async (id: string, current: boolean) => {
    await churchService.toggleStatus(id, current);
    loadChurches();
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmText = prompt(`Para deletar a igreja "${name}", digite DELETAR abaixo:`);
    if (confirmText === "DELETAR") {
      await churchService.delete(id);
      alert("Igreja removida!");
      loadChurches();
    }
  };

  // --- FUNÇÃO SALVA-VIDAS: PROMOVER ALGUÉM A PASTOR ---
  const handlePromoteToAdmin = async () => {
    if (!promoteEmail || !promoteChurchId) return alert("Preencha e-mail e ID da igreja");
    
    try {
      const q = query(collection(db, "members"), where("email", "==", promoteEmail), where("churchId", "==", promoteChurchId));
      const snap = await getDocs(q);

      if (snap.empty) {
        alert("Membro não encontrado com esse e-mail nesta igreja.");
        return;
      }

      // Atualiza o primeiro que achar
      const memberDoc = snap.docs[0];
      await updateDoc(doc(db, "members", memberDoc.id), {
        role: "admin" // VIRA PASTOR
      });

      alert(`Sucesso! ${promoteEmail} agora é ADMIN (Pastor) desta igreja.`);
      setPromoteEmail("");
      setPromoteChurchId("");
    } catch (error) {
      console.error(error);
      alert("Erro ao promover.");
    }
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
          <button onClick={loadChurches} className="bg-slate-800 px-4 py-2 rounded hover:bg-slate-700">Atualizar Lista</button>
        </div>

        {/* ÁREA DE EMERGÊNCIA: PROMOVER MEMBRO */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-8">
          <h3 className="font-bold text-yellow-400 flex items-center gap-2 mb-2">
            <UserCog size={20}/> Área de Emergência: Definir Pastor
          </h3>
          <p className="text-xs text-gray-400 mb-4">Se algum pastor ficou preso como "membro", coloque o e-mail dele aqui para virar Admin novamente.</p>
          <div className="flex gap-2">
            <input 
              type="text" placeholder="ID da Igreja (Copie da tabela abaixo)" 
              value={promoteChurchId} onChange={e => setPromoteChurchId(e.target.value)}
              className="bg-slate-900 border border-slate-600 p-2 rounded text-sm w-1/3"
            />
            <input 
              type="email" placeholder="E-mail do usuário" 
              value={promoteEmail} onChange={e => setPromoteEmail(e.target.value)}
              className="bg-slate-900 border border-slate-600 p-2 rounded text-sm w-1/3"
            />
            <button onClick={handlePromoteToAdmin} className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded font-bold text-sm">Promover a Admin</button>
          </div>
        </div>

        {/* LISTA DE IGREJAS */}
        <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-gray-400 text-sm">
              <tr>
                <th className="p-4">ID (Copie para usar acima)</th>
                <th className="p-4">Igreja</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {churches.map((church) => (
                <tr key={church.id} className="hover:bg-slate-700/50">
                  <td className="p-4 text-xs font-mono text-gray-500 select-all">{church.id}</td>
                  <td className="p-4">
                    <p className="font-bold text-white">{church.name}</p>
                    <p className="text-xs text-gray-400">Criada em: {church.createdAt?.seconds ? new Date(church.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                  </td>
                  <td className="p-4">
                    {church.active ? (
                      <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded border border-green-700">Ativa</span>
                    ) : (
                      <span className="text-xs bg-red-900 text-red-300 px-2 py-1 rounded border border-red-700">Bloqueada</span>
                    )}
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button 
                      onClick={() => handleToggleStatus(church.id!, church.active)}
                      className="p-2 bg-slate-900 rounded hover:bg-slate-600 text-gray-300"
                      title={church.active ? "Bloquear" : "Desbloquear"}
                    >
                      {church.active ? <Lock size={16}/> : <Unlock size={16}/>}
                    </button>
                    
                    <button 
                      onClick={() => handleDelete(church.id!, church.name)}
                      className="p-2 bg-red-900/20 rounded hover:bg-red-900 text-red-500 border border-red-900/50"
                      title="Excluir Igreja"
                    >
                      <Trash2 size={16}/>
                    </button>
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