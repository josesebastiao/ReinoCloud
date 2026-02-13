"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChurch } from "../../contexts/ChurchContext"; 
import { 
  Building2, Users, DollarSign, PlusCircle, CheckCircle, 
  ShieldCheck, Trash2, Ban, Check, Search, Mail, User, Crown 
} from "lucide-react";

// FIREBASE
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

// Tipo para a Igreja
interface ChurchData {
  id: string;
  name: string;
  ownerName?: string; 
  email?: string;     
  plan: string;
  planLimit: number; // ADDED: Campo para armazenar o limite numérico
  status: 'active' | 'blocked';
  createdAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  
  // Dados Reais
  const [churches, setChurches] = useState<ChurchData[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, revenue: 0 });

  // ADDED: Campo plan e planLimit no estado da nova igreja
  const [newChurch, setNewChurch] = useState({
    churchName: "", name: "", email: "", password: "", plan: "congr", planLimit: 100
  });

  // CARREGAR DADOS AO ABRIR
  useEffect(() => {
    if (typeof window !== 'undefined') {
       fetchChurches();
    }
  }, [router]);

  const fetchChurches = async () => {
    try {
        const q = query(collection(db, "churches"));
        const snapshot = await getDocs(q);
        
        const list: ChurchData[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            list.push({
                id: doc.id,
                name: data.name,
                ownerName: data.ownerName || "Pastor N/A",
                email: data.email || "Sem e-mail",         
                plan: data.plan || 'congr',
                planLimit: data.planLimit || 100, // Se não tiver limite salvo, assume 100
                status: data.status || 'active',
                createdAt: data.createdAt
            });
        });

        setChurches(list);

        // Ajuste de estimativa de receita baseado no plano
        let estRevenue = 0;
        list.forEach(c => {
            if(c.status === 'active') {
                if(c.planLimit <= 100) estRevenue += 60; // Ex: R$ 59,90
                else if(c.planLimit <= 400) estRevenue += 120; // Ex: R$ 119,90
                else estRevenue += 200; // Ex: Ilimitado R$ 199,90
            }
        });

        setStats({
            total: list.length,
            active: list.filter(c => c.status === 'active').length,
            revenue: estRevenue 
        });

    } catch (error) {
        console.error("Erro ao buscar igrejas:", error);
    }
  };

  const handlePlanChangeSelect = (value: string) => {
      let limit = 100;
      if (value === 'sede') limit = 400;
      if (value === 'min') limit = 999999; // Ilimitado

      setNewChurch({...newChurch, plan: value, planLimit: limit});
  };

  const handleCreateChurch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        // 1. CRIAR USUÁRIO NO FIREBASE AUTH
        const userCredential = await createUserWithEmailAndPassword(auth, newChurch.email, newChurch.password);
        const user = userCredential.user;
        
        // Atualiza o nome do perfil Auth
        await updateProfile(user, { displayName: newChurch.name });

        // 2. SALVAR NO FIRESTORE (BANCO DE DADOS)
        const churchId = `church_${user.uid}`;
        
        await setDoc(doc(db, "churches", churchId), {
            name: newChurch.churchName,
            ownerName: newChurch.name,  
            email: newChurch.email,     
            createdAt: new Date().toISOString(),
            plan: newChurch.plan,
            planLimit: newChurch.planLimit, // Salva o limite no banco
            status: "active", 
            ownerId: user.uid
        });

        // Cria o registro do Membro Admin (Pastor)
        await setDoc(doc(db, "members", user.uid), {
            fullName: newChurch.name,
            email: newChurch.email,
            churchId: churchId,
            role: "admin",
            status: "active",
            createdAt: new Date().toISOString()
        });
        
        alert("✅ Igreja criada com sucesso!");
        setNewChurch({ churchName: "", name: "", email: "", password: "", plan: "congr", planLimit: 100 }); 
        fetchChurches(); 

    } catch (error: any) {
        console.error(error);
        if (error.code === 'auth/email-already-in-use') {
            alert("⚠️ ERRO: Este e-mail já está cadastrado no sistema de Login.\n\nComo você excluiu a igreja mas o login ficou preso, vá no console do Firebase > Authentication e exclua o usuário manualmente, ou use outro e-mail.");
        } else {
            alert("Erro: " + error.message);
        }
    } finally {
        setLoading(false);
    }
  };

  const toggleStatus = async (church: ChurchData) => {
      const newStatus = church.status === 'active' ? 'blocked' : 'active';
      const action = newStatus === 'blocked' ? 'BLOQUEAR' : 'DESBLOQUEAR';

      if(confirm(`Tem certeza que deseja ${action} a igreja "${church.name}"?`)) {
          try {
              await updateDoc(doc(db, "churches", church.id), {
                  status: newStatus
              });
              fetchChurches(); 
          } catch (error) {
              alert("Erro ao atualizar status.");
          }
      }
  };

  // ADDED: Função para mudar o plano de uma igreja existente
  const handleUpgradePlan = async (church: ChurchData) => {
      const currentLabel = church.planLimit > 400 ? 'Ministério (Ilimitado)' : church.planLimit > 100 ? 'Sede (400)' : 'Congregação (100)';
      
      const promptResult = prompt(
          `PLANOS DISPONÍVEIS:\n1 - Congregação (Até 100 membros)\n2 - Sede (Até 400 membros)\n3 - Ministério (Ilimitado)\n\nPlano Atual: ${currentLabel}\n\nDigite o NÚMERO do novo plano (1, 2 ou 3):`
      );

      if (!promptResult) return;

      let newPlan = church.plan;
      let newLimit = church.planLimit;

      if (promptResult === "1") { newPlan = "congr"; newLimit = 100; }
      else if (promptResult === "2") { newPlan = "sede"; newLimit = 400; }
      else if (promptResult === "3") { newPlan = "min"; newLimit = 999999; }
      else { alert("Opção inválida."); return; }

      if(confirm(`Mudar o limite da igreja "${church.name}" para ${newLimit > 400 ? 'ILIMITADO' : newLimit + ' membros'}?`)) {
          try {
              await updateDoc(doc(db, "churches", church.id), {
                  plan: newPlan,
                  planLimit: newLimit
              });
              alert("Plano atualizado com sucesso!");
              fetchChurches(); 
          } catch (error) {
              alert("Erro ao atualizar plano.");
          }
      }
  };

  const deleteChurch = async (id: string) => {
      if(confirm("⚠️ ATENÇÃO: Isso vai apagar os DADOS da igreja, mas o LOGIN (e-mail/senha) continuará existindo no Firebase Auth.\n\nPara liberar o e-mail novamente, você precisará excluir o usuário manualmente no Console do Firebase.\n\nDeseja continuar?")) {
          try {
              await deleteDoc(doc(db, "churches", id));
              alert("Igreja removida do banco de dados.");
              fetchChurches();
          } catch (error) {
              alert("Erro ao excluir.");
          }
      }
  };

  return (
    <div className="p-4 md:p-8 min-h-screen pb-24 bg-gray-50">
      
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShieldCheck className="text-red-600"/> Gestão ReinoCloud
        </h1>
        <p className="text-gray-500 text-sm">Controle total dos seus clientes</p>
      </div>

      {/* STATS */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600"><Building2 size={24} /></div>
              <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Clientes</p><h3 className="text-2xl font-extrabold text-gray-800">{stats.total}</h3></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-50 text-green-600"><CheckCircle size={24} /></div>
              <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ativos</p><h3 className="text-2xl font-extrabold text-gray-800">{stats.active}</h3></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600"><DollarSign size={24} /></div>
              <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Receita (Est.)</p><h3 className="text-2xl font-extrabold text-gray-800">R$ {stats.revenue},00</h3></div>
          </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* FORMULÁRIO */}
          <div className="lg:col-span-1 h-fit bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden sticky top-8">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h2 className="font-bold text-gray-700 flex items-center gap-2"><PlusCircle size={18} className="text-blue-600"/> Nova Igreja</h2>
              </div>
              <form onSubmit={handleCreateChurch} className="p-6 space-y-4">
                  <div><label className="text-[10px] font-bold text-gray-500 uppercase">Nome da Igreja</label><input type="text" required value={newChurch.churchName} onChange={e => setNewChurch({...newChurch, churchName: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl text-sm" placeholder="Ex: Igreja Batista..." /></div>
                  <div><label className="text-[10px] font-bold text-gray-500 uppercase">Pastor Responsável</label><input type="text" required value={newChurch.name} onChange={e => setNewChurch({...newChurch, name: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl text-sm" placeholder="Ex: Pr. João" /></div>
                  <div><label className="text-[10px] font-bold text-gray-500 uppercase">E-mail de Login</label><input type="email" required value={newChurch.email} onChange={e => setNewChurch({...newChurch, email: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl text-sm" placeholder="email@igreja.com" /></div>
                  <div><label className="text-[10px] font-bold text-gray-500 uppercase">Senha Inicial</label><input type="text" required value={newChurch.password} onChange={e => setNewChurch({...newChurch, password: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl text-sm" placeholder="******" /></div>
                  
                  {/* ADDED: Seleção de Plano */}
                  <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Plano (Limite de Membros)</label>
                      <select value={newChurch.plan} onChange={e => handlePlanChangeSelect(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl text-sm font-bold bg-gray-50">
                          <option value="congr">Plano Congregação (Até 100)</option>
                          <option value="sede">Plano Sede (Até 400)</option>
                          <option value="min">Plano Ministério (Ilimitado)</option>
                      </select>
                  </div>

                  <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center justify-center gap-2 text-sm">{loading ? 'Criando...' : 'Cadastrar Cliente'}</button>
              </form>
          </div>

          {/* LISTA DE CLIENTES */}
          <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                      <h2 className="font-bold text-gray-700 flex items-center gap-2"><Users size={18} className="text-gray-500"/> Lista de Igrejas</h2>
                      <span className="text-xs font-bold text-gray-400">{churches.length} Cadastros</span>
                  </div>

                  <div className="divide-y divide-gray-100">
                      {churches.length === 0 ? (
                          <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                              <Search size={40} className="mb-2 opacity-20"/>
                              <p>Nenhuma igreja cadastrada ainda.</p>
                          </div>
                      ) : (
                          churches.map((church) => (
                              <div key={church.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50 transition">
                                  <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
                                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs ${church.status === 'active' ? 'bg-blue-600' : 'bg-red-500'}`}>
                                          {church.name.substring(0,2).toUpperCase()}
                                      </div>
                                      
                                      <div className="min-w-0">
                                          <h3 className={`font-bold text-sm truncate ${church.status === 'blocked' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{church.name}</h3>
                                          
                                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-gray-500 mt-1">
                                              <span className="flex items-center gap-1"><User size={10}/> {church.ownerName}</span>
                                              <span className="hidden sm:inline text-gray-300">•</span>
                                              <span className="flex items-center gap-1"><Mail size={10}/> {church.email}</span>
                                          </div>
                                          
                                          <div className="mt-1.5 flex items-center gap-2">
                                            <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${church.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {church.status === 'active' ? 'Ativo' : 'Bloqueado'}
                                            </span>
                                            {/* Tag do Plano Atual */}
                                            <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${church.planLimit > 400 ? 'bg-purple-100 text-purple-700' : church.planLimit > 100 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                                Limite: {church.planLimit > 400 ? 'Ilimitado' : church.planLimit}
                                            </span>
                                          </div>
                                      </div>
                                  </div>

                                  <div className="flex items-center gap-2 w-full sm:w-auto">
                                      
                                      {/* ADDED: Botão Upgrade de Plano */}
                                      <button 
                                        onClick={() => handleUpgradePlan(church)}
                                        className="px-3 py-2 rounded-lg text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 transition flex items-center gap-1"
                                        title="Mudar Plano"
                                      >
                                          <Crown size={14}/>
                                      </button>

                                      <button 
                                        onClick={() => toggleStatus(church)}
                                        className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition border ${
                                            church.status === 'active' 
                                            ? 'border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200' 
                                            : 'bg-green-600 text-white border-transparent hover:bg-green-700'
                                        }`}
                                      >
                                          {church.status === 'active' ? <><Ban size={14}/> Bloq</> : <><Check size={14}/> Liberar</>}
                                      </button>

                                      <button 
                                        onClick={() => deleteChurch(church.id)}
                                        className="px-3 py-2 rounded-lg text-gray-300 hover:bg-red-100 hover:text-red-600 transition"
                                        title="Excluir Definitivamente"
                                      >
                                          <Trash2 size={16}/>
                                      </button>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>

      </div>
    </div>
  );
}