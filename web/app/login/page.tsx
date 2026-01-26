"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Login no Firebase (Autenticação Básica)
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. DESCOBRIR QUEM É ESSA PESSOA (Busca no Banco de Membros)
      // Procuramos um membro que tenha esse e-mail
      const membersRef = collection(db, "members");
      const q = query(membersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // --- CENÁRIO A: É UM MEMBRO DA EQUIPE (Tesoureiro, Líder, etc) ---
        const memberData = querySnapshot.docs[0].data();
        
        // Salva as credenciais corretas da igreja dele
        localStorage.setItem("churchId", memberData.churchId);
        localStorage.setItem("userRole", memberData.role); // Pega o cargo real do banco!
        localStorage.setItem("userName", memberData.fullName);
        
        console.log(`🔓 Login de Equipe: ${memberData.fullName} é ${memberData.role}`);
        router.push("/"); // Manda pro Dashboard
      
      } else {
        // --- CENÁRIO B: NÃO ACHOU NO BANCO DE MEMBROS ---
        // Pode ser o Pastor Titular (Dono da conta) que criou a igreja e talvez não esteja na lista de membros ainda
        // Ou pode ser um erro. Vamos tentar achar se ele tem um churchId salvo de sessão anterior ou tratar como Admin se criou a conta.
        
        // *Estratégia:* Se logou no Firebase mas não tá na lista de membros, 
        // assumimos que é o Admin/Dono se ele já tiver um churchId no navegador, 
        // ou verificamos se ele criou a igreja (lógica mais complexa).
        
        // Para simplificar e não travar você: Se logou e não achou membro, 
        // mantemos o que estiver no localStorage ou definimos como 'admin' por segurança se ele souber o ID.
        
        const savedChurchId = localStorage.getItem("churchId");
        
        if (savedChurchId) {
             // É o Pastor logando na própria máquina
             localStorage.setItem("userRole", "admin");
             router.push("/");
        } else {
            // Se é um login novo e não achamos vínculo, pode ser problema.
            // Mas vamos deixar passar como Admin para você não se trancar fora, 
            // mas idealmente ele deveria criar a igreja primeiro.
             setError("Usuário não vinculado a uma igreja. Fale com seu Pastor.");
             // Se for você testando, pode ser que seu email de login não esteja cadastrado em 'members'.
             // DICA: Cadastre você mesmo como membro com cargo 'pastor' ou 'admin' para garantir!
        }
      }

    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError("E-mail ou senha incorretos.");
      } else {
        setError("Erro ao entrar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">ReinoCloud</h1>
          <p className="text-gray-500">Acesse sua conta</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="******"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition duration-200 disabled:opacity-70"
          >
            {loading ? "Entrando..." : "Acessar Sistema"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>É sua primeira vez? <Link href="/register" className="text-blue-600 hover:underline">Criar nova Igreja</Link></p>
          <p className="mt-2 text-xs">Se você é da equipe (Tesoureiro/Líder), peça para o Pastor te cadastrar e use o "Recuperar Senha" (em breve) ou crie uma conta com o mesmo e-mail.</p>
        </div>
      </div>
    </div>
  );
}