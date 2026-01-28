"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChurch } from "../../contexts/ChurchContext"; 
import { 
  Building2, Users, DollarSign, PlusCircle, CheckCircle, 
  ShieldCheck, Trash2, Ban, Check, Search, AlertCircle 
} from "lucide-react";

// FIREBASE
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

// Tipo para a Igreja
interface ChurchData {
  id: string;
  name: string;
  ownerName?: string; // Nome do Pastor (vamos tentar buscar)
  plan: string;
  status: 'active' | 'blocked';
  createdAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { userRole } = useChurch();
  const [loading, setLoading] = useState(false);
  
  // Dados Reais
  const [churches, setChurches] = useState<ChurchData[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, revenue: 0 });

  const [newChurch, setNewChurch] = useState({
    churchName: "", name: "", email: "", password: ""
  });

  // CARREGAR DADOS AO ABRIR
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const role = localStorage.getItem("userRole");
        if (role !== 'admin') router.push("/");
        else fetchChurches();
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
                plan: data.plan || 'free',
                status: data.status || 'active', // Padrão 'active' se não tiver
                createdAt: data.createdAt
            });
        });

        setChurches(list);

        // Calcula Estatísticas na hora
        setStats({
            total: list.length,
            active: list.filter(c => c.status === 'active').length,
            revenue: list.length * 50 // Exemplo: R$ 50 por igreja (Fake calculation)
        });

    } catch (error) {
        console.error("Erro ao buscar igrejas:", error);
    }
  };

  const handleCreateChurch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        // 1. Auth
        const userCredential = await createUserWithEmailAndPassword(auth, newChurch.email, newChurch.password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: newChurch.name });

        // 2. Banco (Firestore)
        const churchId = `church_${user.uid}`;
        
        // Salvando com status 'active' explícito
        await setDoc(doc(db, "churches", churchId), {
            name: newChurch.churchName,
            createdAt: new Date().toISOString(),
            plan: "pro",
            status: "active", 
            ownerId: user.uid
        });

        await setDoc(doc(db, "members", user.uid), {
            fullName: newChurch.name,
            email: newChurch.email,
            churchId: churchId,
            role: "admin",
            status: "active",
            createdAt: new Date().toISOString()
        });
        
        alert("✅ Igreja criada!");
        setNewChurch({ churchName: "", name: "", email: "", password: "" }); 
        fetchChurches(); // Recarrega a lista

    } catch (error: any) {
        alert("Erro: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  // --- AÇÕES DE GESTÃO (O Poder na sua mão) ---

  const toggleStatus = async (church: ChurchData) => {
      const newStatus = church.status === 'active' ? 'blocked' : 'active';
      const action = newStatus === 'blocked' ? 'BLOQUEAR' : 'DESBLOQUEAR';

      if(confirm(`Tem certeza que deseja ${action} a igreja "${church.name}"?`)) {
          try {
              await updateDoc(doc(db, "churches", church.id), {
                  status: newStatus
              });
              fetchChurches(); // Atualiza tela
          } catch (error) {
              alert("Erro ao atualizar status.");
          }
      }
  };

  const deleteChurch = async (id: string) => {
      if(confirm("⚠️ PERIGO: Isso vai apagar a igreja do sistema. Continuar?")) {
          try {
              await deleteDoc(doc(db, "churches", id));
              // Idealmente deletaríamos os membros também, mas vamos manter simples por enquanto
              alert("Igreja removida.");
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

      {/* STATS REAIS */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600"><Building2 size={24} /></div>
              <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total de Clientes</p><h3 className="text-2xl font-extrabold text-gray-800">{stats.total}</h3></div>
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
          
          {/* COLUNA DA ESQUERDA: FORMULÁRIO */}
          <div className="lg:col-span-1 h-fit bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden sticky top-8">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h2 className="font-bold text-gray-700 flex items-center gap-2"><PlusCircle size={18} className="text-blue-600"/> Nova Igreja</h2>
              </div>
              <form onSubmit={handleCreateChurch} className="p-6 space-y-4">
                  <div><label className="text-[10px] font-bold text-gray-500 uppercase">Nome da Igreja</label><input type="text" required value={newChurch.churchName} onChange={e => setNewChurch({...newChurch, churchName: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl text-sm" placeholder="Ex: Igreja Batista..." /></div>
                  <div><label className="text-[10px] font-bold text-gray-500 uppercase">Pastor Responsável</label><input type="text" required value={newChurch.name} onChange={e => setNewChurch({...newChurch, name: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl text-sm" placeholder="Ex: Pr. João" /></div>
                  <div><label className="text-[10px] font-bold text-gray-500 uppercase">E-mail de Login</label><input type="email" required value={newChurch.email} onChange={e => setNewChurch({...newChurch, email: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl text-sm" placeholder="email@igreja.com" /></div>
                  <div><label className="text-[10px] font-bold text-gray-500 uppercase">Senha Inicial</label><input type="text" required value={newChurch.password} onChange={e => setNewChurch({...newChurch, password: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl text-sm" placeholder="******" /></div>
                  <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center justify-center gap-2 text-sm">{loading ? 'Criando...' : 'Cadastrar Cliente'}</button>
              </form>
          </div>

          {/* COLUNA DA DIREITA: LISTA DE CLIENTES */}
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
                                  <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs ${church.status === 'active' ? 'bg-blue-600' : 'bg-red-500'}`}>
                                          {church.name.substring(0,2).toUpperCase()}
                                      </div>
                                      <div>
                                          <h3 className={`font-bold text-sm ${church.status === 'blocked' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{church.name}</h3>
                                          <div className="flex items-center gap-2">
                                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${church.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                  {church.status === 'active' ? 'Ativo' : 'Bloqueado'}
                                              </span>
                                              <span className="text-[10px] text-gray-400">ID: {church.id.slice(0,8)}...</span>
                                          </div>
                                      </div>
                                  </div>

                                  <div className="flex items-center gap-2 w-full sm:w-auto">
                                      {/* BOTÃO BLOQUEAR / DESBLOQUEAR */}
                                      <button 
                                        onClick={() => toggleStatus(church)}
                                        className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition border ${
                                            church.status === 'active' 
                                            ? 'border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200' 
                                            : 'bg-green-600 text-white border-transparent hover:bg-green-700'
                                        }`}
                                        title={church.status === 'active' ? "Bloquear Acesso" : "Liberar Acesso"}
                                      >
                                          {church.status === 'active' ? <><Ban size={14}/> Bloquear</> : <><Check size={14}/> Liberar</>}
                                      </button>

                                      {/* BOTÃO EXCLUIR */}
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