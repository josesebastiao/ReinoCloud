"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. TENTA O LOGIN NO FIREBASE (AUTH)
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // --- MODO DEUS (SUPER ADMIN) ---
      // Se for você, pulamos todas as verificações de banco de dados
      if (user.email === "alfaministro1@gmail.com") {
          console.log("⚡ MODO DEUS ATIVADO ⚡");
          localStorage.setItem("token", await user.getIdToken());
          localStorage.setItem("churchId", "master_admin");
          localStorage.setItem("userRole", "admin");
          localStorage.setItem("userName", "Super Admin");
          localStorage.setItem("churchName", "ReinoCloud HQ");
          
          router.push("/"); // Manda pro Dashboard
          return; // Para a execução aqui
      }
      // -------------------------------

      // 2. SE NÃO FOR O CHEFE, SEGUE O FLUXO NORMAL DE MEMBROS
      const userDocRef = doc(db, "members", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        throw new Error("Usuário não encontrado no sistema.");
      }

      const userData = userDocSnap.data();
      
      // Busca nome da igreja
      let churchName = "Minha Igreja";
      if(userData.churchId) {
          try {
             const churchSnap = await getDoc(doc(db, "churches", userData.churchId));
             if(churchSnap.exists()) churchName = churchSnap.data().name;
          } catch(e) {}
      }

      // 3. Salva no navegador
      localStorage.setItem("token", await user.getIdToken());
      localStorage.setItem("churchId", userData.churchId);
      localStorage.setItem("userRole", userData.role || "member");
      localStorage.setItem("userName", userData.fullName || "Usuário");
      localStorage.setItem("churchName", churchName);

      router.push("/");
      
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
          setError("E-mail ou senha incorretos.");
      } else if (err.message === "Usuário não encontrado no sistema.") {
          setError("Login permitido, mas sem cadastro de membro.");
      } else {
          setError("Erro ao acessar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-gray-600 font-sans selection:bg-blue-100">
      <header className="w-full p-6 md:p-8 flex items-center gap-3">
         <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">R</div>
         <div>
            <h1 className="text-xl md:text-2xl font-bold text-blue-900 tracking-tight leading-none">ReinoCloud</h1>
            <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">Gestão Eclesiástica</p>
         </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 md:p-10 border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo!</h2>
            <p className="text-gray-500 text-sm">Insira suas credenciais para acessar.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg flex items-center gap-2 border border-red-100 animate-pulse">
                 <ShieldCheck size={16}/> {error}
              </div>
            )}
            <div className="space-y-1">
               <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">E-mail</label>
               <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail size={18} className="text-gray-400" /></div>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50 font-medium" placeholder="admin@reinocloud.com" />
               </div>
            </div>
            <div className="space-y-1">
               <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">Senha</label>
               <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock size={18} className="text-gray-400" /></div>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50 font-medium" placeholder="••••••••" />
               </div>
            </div>
            <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <>Entrar <ArrowRight size={18}/></>}
            </button>
          </form>
          
          <div className="mt-8 text-center border-t border-gray-100 pt-6">
             <Link href="/register" className="text-xs font-bold text-blue-600 hover:underline">Criar Nova Igreja</Link>
          </div>
        </div>
      </main>

      <footer className="w-full p-6 text-center text-[10px] text-gray-400 border-t border-gray-200 bg-white">
          COPYRIGHT © {new Date().getFullYear()} SEBASTEC SYSTEMS.
      </footer>
    </div>
  );
}