"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Lock, Mail } from "lucide-react";

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
      // 1. Autentica no Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Descobre qual é a Igreja desse usuário
      // Buscamos na coleção 'churches' qual tem o adminEmail igual ao logado
      const q = query(collection(db, "churches"), where("adminEmail", "==", user.email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Usuário não vinculado a nenhuma igreja.");
        setLoading(false);
        return;
      }

      // 3. Salva o ID da Igreja no navegador (Local Storage) para usarmos depois
      const churchData = querySnapshot.docs[0];
      localStorage.setItem("churchId", churchData.id);
      localStorage.setItem("churchName", churchData.data().name);

      // 4. Redireciona para a Dashboard
      router.push("/");

    } catch (err: any) {
      console.error(err);
      setError("E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">ReinoCloud</h1>
          <p className="text-gray-500">Acesse sua conta</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-black"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-black"
                placeholder="******"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition font-medium disabled:bg-blue-300"
          >
            {loading ? "Entrando..." : "Acessar Sistema"}
          </button>
        </form>
        <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">É seu primeiro acesso? </span>
            <a href="/register" className="text-blue-600 font-medium hover:underline">
                Ativar minha conta
            </a>
        </div>
      </div>
    </div>
  );
}