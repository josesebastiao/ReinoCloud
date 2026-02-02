"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserCheck, Loader2, ArrowLeft } from "lucide-react";

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. VERIFICAR SE O E-MAIL EXISTE NA LISTA DE MEMBROS
      // Só permitimos cadastro se um Pastor já tiver adicionado a pessoa antes
      const membersRef = collection(db, "members");
      const q = query(membersRef, where("email", "==", formData.email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Se não achou na lista de membros, BLOQUEIA.
        throw new Error("Este e-mail não foi encontrado em nenhuma igreja. Peça ao seu pastor para te cadastrar primeiro.");
      }

      // 2. SE EXISTE, CRIA O LOGIN (SENHA)
      await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      alert(`Conta ativada com sucesso, ${formData.name}!`);
      router.push("/login");

    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
          setError("Este e-mail já tem uma conta ativa. Tente fazer login.");
      } else {
          setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl w-full max-w-md border border-gray-100">
        
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
             <div className="bg-green-100 p-4 rounded-full">
                <UserCheck className="text-green-600" size={32} />
             </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Ativar Acesso</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Crie sua senha para acessar o painel da sua igreja.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
             {error}
          </div>
        )}

        <form onSubmit={handleActivate} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Seu Nome</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:bg-white focus:ring-2 ring-blue-100 transition" placeholder="Como quer ser chamado" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">E-mail Cadastrado</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:bg-white focus:ring-2 ring-blue-100 transition" placeholder="O mesmo que o pastor cadastrou" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Crie uma Senha</label>
            <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:bg-white focus:ring-2 ring-blue-100 transition" placeholder="Mínimo 6 caracteres" minLength={6} />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-200 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : "Ativar Minha Conta"}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <Link href="/login" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 font-bold text-sm transition">
            <ArrowLeft size={16}/> Voltar para Login
          </Link>
        </div>
      </div>
    </div>
  );
}