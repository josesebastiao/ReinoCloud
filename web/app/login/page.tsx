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
      // 1. Login no Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Busca quem é o usuário no banco de Membros
      const membersRef = collection(db, "members");
      const q = query(membersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // --- É ALGUÉM DA EQUIPE (OU PASTOR CADASTRADO) ---
        const memberData = querySnapshot.docs[0].data();
        
        localStorage.setItem("churchId", memberData.churchId);
        localStorage.setItem("userRole", memberData.role);
        // SALVAMOS O NOME PARA O "OLÁ, FULANO"
        localStorage.setItem("userName", memberData.fullName); 
        
        router.push("/");
      
      } else {
        // --- É O DONO (ADMIN) ---
        const savedChurchId = localStorage.getItem("churchId");
        if (savedChurchId) {
             localStorage.setItem("userRole", "admin");
             // Se não tiver nome salvo, usamos "Pastor"
             if (!localStorage.getItem("userName")) {
                 localStorage.setItem("userName", "Pastor");
             }
             router.push("/");
        } else {
             setError("Usuário não vinculado. Fale com seu Pastor.");
        }
      }

    } catch (err: any) {
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
          <p>É sua primeira vez?</p>
          {/* MUDANÇA AQUI: Link mais genérico */}
          <Link href="/register" className="text-blue-600 hover:underline font-bold">
            Criar Conta / Primeiro Acesso
          </Link>
          <p className="mt-2 text-xs text-gray-400">
            Válido para Pastores (Nova Igreja) e Equipe (Já cadastrados).
          </p>
        </div>
      </div>
    </div>
  );
}