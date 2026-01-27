"use client";
import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { Heart } from "lucide-react"; // Importe o coração para dar um charme

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      const membersRef = collection(db, "members");
      const q = query(membersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const accounts = querySnapshot.docs.map(doc => doc.data());
        const bestAccount = accounts.find(acc => acc.role === 'admin' || acc.role === 'pastor') || accounts[0];

        let nomeIgreja = "Minha Igreja";
        try {
            const churchDocRef = doc(db, "churches", bestAccount.churchId);
            const churchSnap = await getDoc(churchDocRef);
            if (churchSnap.exists()) {
                const churchData = churchSnap.data();
                if (churchData.settings && churchData.settings.docs && churchData.settings.docs.churchName) {
                    nomeIgreja = churchData.settings.docs.churchName;
                } else {
                    nomeIgreja = churchData.name;
                }
            }
        } catch (err) { console.log("Erro ao buscar nome", err); }

        localStorage.setItem("churchId", bestAccount.churchId);
        localStorage.setItem("userRole", bestAccount.role);
        localStorage.setItem("userName", bestAccount.fullName);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("churchName", nomeIgreja);
        
        router.push("/");
      } else {
        const savedChurchId = localStorage.getItem("churchId");
        if (savedChurchId) {
             localStorage.setItem("userRole", "admin");
             localStorage.setItem("userName", "Super Admin");
             localStorage.setItem("userEmail", email);
             router.push("/");
        } else {
             setError("Usuário não vinculado a nenhuma igreja.");
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') { setError("E-mail ou senha incorretos."); } 
      else { setError("Erro ao entrar. Tente novamente."); }
    } finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!email) { setError("Digite seu e-mail acima."); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg(`Link enviado para: ${email}`);
      setError("");
    } catch (err: any) { setError("Erro ao enviar e-mail."); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-4 relative">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">ReinoCloud</h1>
          <p className="text-gray-500">Acesse sua conta</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center border border-red-100">{error}</div>}
        {successMsg && <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm text-center border border-green-100">{successMsg}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="seu@email.com"/>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <button type="button" onClick={handleResetPassword} className="text-xs text-blue-600 hover:underline font-bold">Esqueci minha senha</button>
            </div>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="******"/>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-70">
            {loading ? "Entrando..." : "Acessar Sistema"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>É sua primeira vez?</p>
          <Link href="/register" className="text-blue-600 hover:underline font-bold">Criar Conta / Primeiro Acesso</Link>
        </div>
      </div>

      {/* RODAPÉ DA SEBASTEC */}
      <div className="mt-8 text-slate-500 text-xs flex flex-col items-center opacity-60 hover:opacity-100 transition">
        <p className="flex items-center gap-1">
            Desenvolvido com <Heart size={10} className="text-red-500 fill-red-500"/> por <span className="font-bold text-slate-400">Sebastec</span>
        </p>
        <p className="text-[10px] mt-1">© {new Date().getFullYear()} Todos os direitos reservados.</p>
      </div>
    </div>
  );
}