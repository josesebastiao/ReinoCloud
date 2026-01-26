"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const [step, setStep] = useState(1); // Passo 1: Conta, Passo 2: Igreja (só se for novo)
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    churchName: "" // Só usado se for criar nova igreja
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. VERIFICAR SE ESSE E-MAIL JÁ FOI CADASTRADO POR UM PASTOR
      // Procuramos na coleção 'members' se alguém já adicionou esse email
      const membersRef = collection(db, "members");
      const q = query(membersRef, where("email", "==", formData.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // --- CENÁRIO A: É O MATIAS (Tesoureiro/Equipe) ---
        // O e-mail já existe como membro. Vamos só criar o Login (Auth) para ele.
        
        await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        
        // Não precisamos criar igreja. O Login vai detectar o cargo dele depois.
        alert(`Bem-vindo à equipe, ${formData.name}! Sua conta foi vinculada à igreja existente.`);
        router.push("/login"); // Manda pro login para carregar as permissões
        return;
      }

      // --- CENÁRIO B: É UM NOVO PASTOR (Criando Igreja do Zero) ---
      // Se chegamos aqui, o email não existe. Precisamos do Nome da Igreja.
      if (step === 1) {
        setStep(2); // Pede o nome da igreja
        setLoading(false);
        return;
      }

      // Passo 2: Criar tudo do zero
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 1. Criar a Igreja
      const churchRef = await addDoc(collection(db, "churches"), {
        name: formData.churchName,
        ownerId: user.uid,
        createdAt: new Date(),
        plan: "free" // Plano inicial
      });

      // 2. Criar o Membro Admin (O Pastor Dono)
      await addDoc(collection(db, "members"), {
        churchId: churchRef.id,
        fullName: formData.name,
        email: formData.email,
        role: "admin", // O dono é Admin Supremo
        status: "active",
        userId: user.uid,
        createdAt: new Date(),
        // Dados obrigatórios do novo modelo
        phone: "", document: "", birthDate: "", baptismDate: "",
        address: { street:"", number:"", neighborhood:"", city:"", state:"", zipCode:"" },
        ministries: []
      });

      alert("Igreja criada com sucesso! Bem-vindo, Pastor.");
      router.push("/login");

    } catch (error: any) {
      console.error(error);
      alert("Erro ao criar conta: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">ReinoCloud</h1>
          <p className="text-gray-500">
            {step === 1 ? "Crie sua conta ou ative seu acesso" : "Dados da sua Igreja"}
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seu Nome Completo</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border rounded-lg" placeholder="Ex: João da Silva" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 border rounded-lg" placeholder="seu@email.com" />
                <p className="text-xs text-gray-500 mt-1">Se você é da equipe, use o e-mail que o Pastor cadastrou.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Crie uma Senha</label>
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-3 border rounded-lg" placeholder="******" minLength={6} />
              </div>
            </>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Igreja / Ministério</label>
                <input required type="text" value={formData.churchName} onChange={e => setFormData({...formData, churchName: e.target.value})} className="w-full p-3 border rounded-lg" placeholder="Ex: Igreja Videira Viva" />
              </div>
              <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded mt-2">
                Identificamos que seu e-mail não está vinculado a nenhuma equipe. Vamos criar uma nova conta de Igreja para você.
              </p>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition duration-200">
            {loading ? "Processando..." : (step === 1 ? "Continuar" : "Finalizar Cadastro")}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Já tem uma conta? <Link href="/login" className="text-blue-600 hover:underline">Fazer Login</Link></p>
        </div>
      </div>
    </div>
  );
}