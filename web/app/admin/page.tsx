"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChurch } from "../../contexts/ChurchContext"; // Contexto da Igreja
import { Building2, Users, DollarSign, PlusCircle, CheckCircle, ShieldCheck } from "lucide-react";

// FIREBASE DIRETO (Sem Service)
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

export default function AdminPage() {
  const router = useRouter();
  const { userRole } = useChurch(); // Pega do contexto, ou pode pegar do localStorage
  const [loading, setLoading] = useState(false);
  
  const [newChurch, setNewChurch] = useState({
    churchName: "", name: "", email: "", password: ""
  });

  useEffect(() => {
    // Segurança básica
    if (typeof window !== 'undefined') {
        const role = localStorage.getItem("userRole");
        if (role !== 'admin') router.push("/");
    }
  }, [router]);

  const handleCreateChurch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        // 1. Cria usuário no Auth
        const userCredential = await createUserWithEmailAndPassword(auth, newChurch.email, newChurch.password);
        const user = userCredential.user;

        // 2. Atualiza nome
        await updateProfile(user, { displayName: newChurch.name });

        // 3. Cria Igreja no Banco
        const churchId = `church_${user.uid}`;
        await setDoc(doc(db, "churches", churchId), {
            name: newChurch.churchName,
            createdAt: new Date().toISOString(),
            plan: "pro",
            ownerId: user.uid
        });

        // 4. Cria Membro (Pastor Admin)
        await setDoc(doc(db, "members", user.uid), {
            fullName: newChurch.name,
            email: newChurch.email,
            churchId: churchId,
            role: "admin",
            status: "active",
            createdAt: new Date().toISOString()
        });
        
        alert("✅ Igreja cadastrada com sucesso!");
        setNewChurch({ churchName: "", name: "", email: "", password: "" }); 

    } catch (error: any) {
        console.error(error);
        alert("Erro: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  const stats = [
      { label: "Total de Igrejas", value: "12", icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
      { label: "Vidas Alcançadas", value: "1.450", icon: Users, color: "text-green-600", bg: "bg-green-50" },
      { label: "Receita Mensal", value: "R$ 600,00", icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="p-4 md:p-8 min-h-screen pb-24 bg-gray-50">
      <div className="max-w-5xl mx-auto mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ShieldCheck className="text-red-500"/> Painel Super Admin</h1>
        <p className="text-gray-500 text-sm">Gerencie os clientes do ReinoCloud</p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}><stat.icon size={24} /></div>
                  <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p><h3 className="text-2xl font-extrabold text-gray-800">{stat.value}</h3></div>
              </div>
          ))}
      </div>

      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-8 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-bold text-gray-700 flex items-center gap-2"><PlusCircle size={18} className="text-blue-600"/> Cadastrar Nova Igreja</h2>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded uppercase">Plano Pro</span>
          </div>

          <form onSubmit={handleCreateChurch} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1 md:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nome da Igreja</label><input type="text" required value={newChurch.churchName} onChange={e => setNewChurch({...newChurch, churchName: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" /></div>
                  <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nome do Pastor</label><input type="text" required value={newChurch.name} onChange={e => setNewChurch({...newChurch, name: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" /></div>
                  <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">E-mail</label><input type="email" required value={newChurch.email} onChange={e => setNewChurch({...newChurch, email: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" /></div>
                  <div className="col-span-1 md:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Senha Inicial</label><input type="password" required value={newChurch.password} onChange={e => setNewChurch({...newChurch, password: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" /></div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                  <button type="submit" disabled={loading} className="px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center gap-2">
                      {loading ? 'Criando...' : <><CheckCircle size={18}/> Criar Igreja</>}
                  </button>
              </div>
          </form>
      </div>
    </div>
  );
}