"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Import para redirecionar intrusos
import { churchService } from "../../services/churchService";
import { Church } from "../../types/church";
import { Trash2, Lock, Unlock, UserCog, Plus, ShieldAlert } from "lucide-react";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"; 
import { db } from "../../lib/firebase";

// SEU E-MAIL DE SUPER ADMIN (O ÚNICO QUE PODE VER ESSA TELA)
const SUPER_ADMIN_EMAIL = "alfaministro1@hotmail.com"; 

export default function SuperAdminPage() {
  const router = useRouter();
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false); // Trava de segurança

  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoteChurchId, setPromoteChurchId] = useState("");

  useEffect(() => {
    // 1. VERIFICAÇÃO DE SEGURANÇA
    const currentUserEmail = localStorage.getItem("userEmail"); // Vamos garantir que salvamos isso no login
    
    if (currentUserEmail !== SUPER_ADMIN_EMAIL) {
      alert("⛔ Acesso Negado! Esta área é restrita ao Super Admin.");
      router.push("/"); // Chuta para o dashboard
      return;
    }

    setIsAuthorized(true);
    loadChurches();
  }, [router]);

  const loadChurches = async () => {
    setLoading(true);
    const data = await churchService.listAll();
    setChurches(data);
    setLoading(false);
  };

  const handleCreateChurch = async () => {
    const churchName = prompt("Nome da Nova Igreja:");
    if (!churchName) return;
    const pastorEmail = prompt(`E-mail do Pastor da ${churchName}:`);
    if (!pastorEmail) return;
    const pastorName = prompt("Nome do Pastor:");
    if (!pastorName) return;

    try {
      await churchService.create(
        { name: churchName, plan: "basic" }, 
        { name: pastorName, email: pastorEmail }
      );
      alert(`✅ Sucesso! Igreja e Pastor criados.`);
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

  // Se não estiver autorizado ou carregando, mostra tela preta
  if (!isAuthorized || loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Carregando acesso seguro...</div>;

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8 text-white overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-blue-500 flex items-center gap-2">
               <ShieldAlert /> ReinoCloud | Super Admin
            </h1>
            <p className="text-gray-400 text-sm">Gestão dos Tenants (Clientes)</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={loadChurches} className="flex-1 md:flex-none bg-slate-800 px-4 py-2 rounded border border-slate-700 text-sm">Atualizar</button>
            <button onClick={handleCreateChurch} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-bold shadow-lg text-sm">
                <Plus size={18} /> Nova Igreja
            </button>
          </div>
        </div>

        {/* ÁREA DE EMERGÊNCIA */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-8 shadow-lg">
          <h3 className="font-bold text-yellow-400 flex items-center gap-2 mb-2 text-sm md:text-base">
            <UserCog size={18}/> Área de Emergência
          </h3>
          <p className="text-xs text-gray-400 mb-4">Promover Pastor manualmente.</p>
          <div className="flex flex-col md:flex-row gap-2">
            <input type="text" placeholder="ID da Igreja" value={promoteChurchId} onChange={e => setPromoteChurchId(e.target.value)} className="bg-slate-900 border border-slate-600 p-3 rounded text-sm text-white" />
            <input type="email" placeholder="E-mail do usuário" value={promoteEmail} onChange={e => setPromoteEmail(e.target.value)} className="bg-slate-900 border border-slate-600 p-3 rounded text-sm text-white" />
            <button onClick={handlePromoteToAdmin} className="bg-yellow-600 hover:bg-yellow-700 px-4 py-3 md:py-2 rounded font-bold text-sm text-slate-900">Promover</button>
          </div>
        </div>

        {/* LISTA RESPONSIVA */}
        <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
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
                  <td className="p-4 text-xs font-mono text-gray-500 select-all max-w-[100px] truncate">{church.id}</td>
                  <td className="p-4"><p className="font-bold text-white text-base">{church.name}</p></td>
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