"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";

// Firebase
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  
  // Estados de Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Estados de Reset de Senha
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // --- LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Auth Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. MODO DEUS (Super Admin)
      if (user.email === "alfaministro1@gmail.com") {
          localStorage.setItem("token", await user.getIdToken());
          localStorage.setItem("churchId", "master_admin");
          localStorage.setItem("userRole", "admin");
          localStorage.setItem("userName", "Super Admin");
          localStorage.setItem("churchName", "ReinoCloud HQ");
          router.push("/");
          return;
      }

      // 3. Busca dados no banco (Membros normais)
      const userDocRef = doc(db, "members", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        throw new Error("Usuário não encontrado no sistema.");
      }

      const userData = userDocSnap.data();
      
      // Busca nome da igreja (opcional)
      let churchName = "Minha Igreja";
      if (userData.churchId) {
          try {
            const churchDocRef = doc(db, "churches", userData.churchId);
            const churchDocSnap = await getDoc(churchDocRef);
            if (churchDocSnap.exists()) {
                churchName = churchDocSnap.data().name;
            }
          } catch (err) { console.warn(err); }
      }

      // 4. Salva sessão
      localStorage.setItem("token", await user.getIdToken());
      localStorage.setItem("churchId", userData.churchId || "");
      localStorage.setItem("userRole", userData.role || "member");
      localStorage.setItem("userName", userData.fullName || "Usuário");
      localStorage.setItem("churchName", churchName);

      router.push("/");

    } catch (err: any) {
      console.error("Erro login:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
          setError("E-mail ou senha incorretos.");
      } else {
          setError("Erro ao conectar. Verifique seus dados.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- RESET DE SENHA ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
        await sendPasswordResetEmail(auth, email);
        setResetSent(true);
    } catch (err: any) {
        console.error("Erro reset:", err);
        if(err.code === 'auth/user-not-found') {
            setError("E-mail não cadastrado.");
        } else {
            setError("Erro ao enviar e-mail. Tente novamente.");
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-gray-600 font-sans selection:bg-blue-100">
      
      {/* CABEÇALHO COM LOGO */}
      <header className="w-full p-6 md:p-8 flex items-center gap-3 animate-in slide-in-from-top-4 duration-500">
         {/* Se tiver a imagem 'icon.png' ou 'logo.png' na pasta public, ela aparecerá aqui */}
         {/* Caso não tenha, o texto ReinoCloud já serve como logo */}
         <img src="/favicon.ico" alt="Logo" className="w-10 h-10 object-contain" /> 
         
         <div>
            <h1 className="text-xl md:text-2xl font-bold text-blue-900 tracking-tight leading-none">ReinoCloud</h1>
            <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">Gestão Eclesiástica</p>
         </div>
      </header>

      {/* CARD CENTRAL */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 md:p-10 border border-gray-100 transition-all duration-300">
          
          {/* MODO RESET DE SENHA */}
          {isResetMode ? (
              <>
                <div className="text-center mb-8">
                    <button onClick={() => { setIsResetMode(false); setResetSent(false); setError(""); }} className="mb-4 flex items-center gap-2 text-sm text-gray-400 hover:text-blue-600 transition mx-auto">
                        <ArrowLeft size={14}/> Voltar para Login
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Recuperar Senha</h2>
                    <p className="text-gray-500 text-sm">Digite seu e-mail para receber o link de redefinição.</p>
                </div>

                {resetSent ? (
                    <div className="text-center space-y-4 animate-in fade-in zoom-in">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                            <ShieldCheck size={32}/>
                        </div>
                        <h3 className="font-bold text-gray-800">E-mail Enviado!</h3>
                        <p className="text-sm text-gray-500">Verifique sua caixa de entrada (e spam) para criar uma nova senha.</p>
                        <button onClick={() => setIsResetMode(false)} className="mt-4 text-blue-600 font-bold text-sm hover:underline">Voltar para Login</button>
                    </div>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-5">
                        {error && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">{error}</div>}
                        
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">E-mail Cadastrado</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail size={18} className="text-gray-400 group-focus-within:text-blue-600 transition" /></div>
                                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900" placeholder="exemplo@igreja.com" />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all">
                            {loading ? <Loader2 className="animate-spin" size={20} /> : "Enviar Link de Recuperação"}
                        </button>
                    </form>
                )}
              </>
          ) : (
              /* MODO LOGIN (PADRÃO) */
              <>
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
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail size={18} className="text-gray-400 group-focus-within:text-blue-600 transition" />
                            </div>
                            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900" placeholder="exemplo@igreja.com" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Senha</label>
                            <button type="button" onClick={() => setIsResetMode(true)} className="text-xs text-blue-600 hover:text-blue-800 font-bold transition">Esqueceu a senha?</button>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock size={18} className="text-gray-400 group-focus-within:text-blue-600 transition" />
                            </div>
                            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900" placeholder="••••••••" />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-70">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <>Entrar <ArrowRight size={18}/></>}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-500 mb-3">Sua igreja ainda não tem conta?</p>
                    {/* Alterado texto conforme solicitado */}
                    <Link href="/register" className="inline-block px-6 py-2 rounded-full border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-50 transition">
                        Ative sua igreja
                    </Link>
                </div>
              </>
          )}

        </div>
      </main>

      <footer className="w-full p-6 md:px-10 md:py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] md:text-xs text-gray-400 border-t border-gray-200 bg-white">
          <div className="flex gap-6 font-medium"><a href="#" className="hover:text-blue-600">Privacidade</a><a href="#" className="hover:text-blue-600">Termos</a></div>
          <div className="font-medium text-center md:text-right">COPYRIGHT © {new Date().getFullYear()} SEBASTEC SYSTEMS.</div>
      </footer>
    </div>
  );
}