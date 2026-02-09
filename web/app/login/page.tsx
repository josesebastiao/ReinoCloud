"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, Loader2, ShieldCheck, ArrowLeft, Phone, MessageSquare } from "lucide-react";

// Firebase
import { signInWithEmailAndPassword, sendPasswordResetEmail, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

// INTEGRADO AO CONTEXTO
import { useChurch } from "../../contexts/ChurchContext";

export default function LoginPage() {
  const router = useRouter();
  const { setChurchData } = useChurch(); 
  
  // Controle de Abas (Email ou Telefone)
  const [method, setMethod] = useState<'email' | 'phone'>('email');

  // Estados Gerais
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Estados E-mail
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Estados Telefone
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [step, setStep] = useState<'input_phone' | 'verify_code'>('input_phone');

  // --- FUNÇÃO AUXILIAR: BUSCA DADOS DO USUÁRIO E REDIRECIONA ---
  const fetchUserAndRedirect = async (user: any) => {
      // 1. SUPER ADMIN (BYPASS)
      if (user.email === "alfaministro1@gmail.com" || user.email === "alfaministro1@hotmail.com") {
          setChurchData("master_admin", "ReinoCloud HQ", "admin", "Super Admin", "", "", "AO");
          router.push("/");
          return;
      }

      // 2. BUSCA DADOS DO USUÁRIO NO BANCO
      let userData = null;

      // Tenta pelo ID (Padrão e mais seguro)
      const userDocRef = doc(db, "members", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
          userData = userDocSnap.data();
      } else {
          // Se não achou pelo ID, procura pelo E-MAIL ou TELEFONE
          let querySnapshot;

          if (user.email) {
             const q = query(collection(db, "members"), where("email", "==", user.email));
             querySnapshot = await getDocs(q);
          } else if (user.phoneNumber) {
             // --- LÓGICA INTELIGENTE DE TELEFONE ---
             
             // 1. Tenta formato internacional exato (+244923...)
             const q1 = query(collection(db, "members"), where("phone", "==", user.phoneNumber));
             querySnapshot = await getDocs(q1);

             // 2. Se não achou, tenta sem o código do país (caso a secretaria tenha salvo só 923...)
             if (querySnapshot.empty) {
                 // Remove o +244 ou +55 para tentar achar o número local
                 const localPhone = user.phoneNumber.replace('+244', '').replace('+55', '').trim();
                 const q2 = query(collection(db, "members"), where("phone", "==", localPhone));
                 querySnapshot = await getDocs(q2);
             }
          }

          if (querySnapshot && !querySnapshot.empty) {
              userData = querySnapshot.docs[0].data();
          }
      }

      // 2.1 Se não achou em members, verifica se é ADMIN (Igreja) na coleção churches
      if (!userData) {
          const churchDocRef = doc(db, "churches", user.uid);
          const churchDocSnap = await getDoc(churchDocRef);
          
          if (churchDocSnap.exists()) {
              const data = churchDocSnap.data();
              setChurchData(
                  user.uid, 
                  data.name, 
                  'admin', 
                  data.ownerName || "Pastor", 
                  data.logoUrl || "", 
                  data.signatureUrl || "", 
                  data.currency || "AO"
              );
              router.push("/");
              return;
          }
      }

      // AQUI ESTÁ A TRAVA DE SEGURANÇA
      // Se depois de tudo isso userData continuar null, o login é barrado.
      if (!userData) {
        throw new Error("Usuário sem cadastro no sistema. Fale com a secretaria.");
      }
      
      // 3. BUSCA DADOS DA IGREJA
      let churchName = "Minha Igreja";
      let churchLogo = "";
      let churchSignature = "";
      let churchCurrency = "AO";

      if (userData.churchId) {
          try {
            const churchDocRef = doc(db, "churches", userData.churchId);
            const churchDocSnap = await getDoc(churchDocRef);
            if (churchDocSnap.exists()) {
                const cData = churchDocSnap.data();
                churchName = cData.name;
                churchLogo = cData.logoUrl || "";
                churchSignature = cData.signatureUrl || "";
                churchCurrency = cData.currency || "AO";
            }
          } catch (err) { console.warn("Erro ao buscar igreja:", err); }
      }

      // 4. SALVA TUDO NO CONTEXTO
      setChurchData(
          userData.churchId || "", 
          churchName, 
          userData.role || "member", 
          userData.fullName || "Usuário", 
          churchLogo, 
          churchSignature,
          churchCurrency
      );

      router.push("/");
  };

  // --- LOGIN POR E-MAIL ---
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await fetchUserAndRedirect(userCredential.user);
    } catch (err: any) {
      console.error("Erro login:", err);
      if (err.message === "Usuário sem cadastro no sistema. Fale com a secretaria.") {
          setError(err.message);
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
          setError("E-mail ou senha incorretos.");
      } else if (err.code === 'auth/too-many-requests') {
          setError("Muitas tentativas. Aguarde alguns minutos.");
      } else {
          setError("Erro ao conectar. Verifique seus dados.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- RESET SENHA ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
        await sendPasswordResetEmail(auth, email);
        setResetSent(true);
    } catch (err: any) {
        console.error("Erro reset:", err);
        if(err.code === 'auth/user-not-found') setError("E-mail não cadastrado.");
        else setError("Erro ao enviar e-mail. Tente novamente.");
    } finally {
        setLoading(false);
    }
  };

  // --- LOGIN POR TELEFONE ---
  
  // Inicializa o reCAPTCHA (Necessário para SMS)
  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {}
      });
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Normalização para Angola (Adiciona +244 se faltar)
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+244${formattedPhone}`; 
    }

    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setStep('verify_code');
      // alert("SMS enviado! Verifique seu celular.");

    } catch (err: any) {
      console.error(err);
      setError("Erro ao enviar SMS. Verifique o número.");
      // Limpa o recaptcha se falhar para tentar de novo
      if ((window as any).recaptchaVerifier) {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await confirmationResult.confirm(verificationCode);
      await fetchUserAndRedirect(res.user);
    } catch (err: any) {
      console.error(err);
      if (err.message === "Usuário sem cadastro no sistema. Fale com a secretaria.") {
          setError(err.message);
      } else {
          setError("Código inválido. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-gray-600 font-sans selection:bg-blue-100">
      
      {/* Container Invisível do Recaptcha */}
      <div id="recaptcha-container"></div>

      {/* CABEÇALHO */}
      <header className="w-full p-6 md:p-8 flex items-center gap-3 animate-in slide-in-from-top-4 duration-500">
         <img src="/icon.svg" alt="ReinoCloud Logo" className="w-12 h-12 object-contain" /> 
         <div>
            <h1 className="text-xl md:text-2xl font-bold text-blue-900 tracking-tight leading-none">ReinoCloud</h1>
            <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">Gestão Eclesiástica</p>
         </div>
      </header>

      {/* CARD CENTRAL */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 md:p-10 border border-gray-100 transition-all duration-300">
          
          {isResetMode ? (
              // --- TELA DE RESET DE SENHA ---
              <>
                <div className="text-center mb-8">
                    <button onClick={() => { setIsResetMode(false); setResetSent(false); setError(""); }} className="mb-4 flex items-center gap-2 text-sm text-gray-400 hover:text-blue-600 transition mx-auto">
                        <ArrowLeft size={14}/> Voltar para Login
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Recuperar Senha</h2>
                    <p className="text-gray-500 text-sm">Digite seu e-mail para receber o link.</p>
                </div>

                {resetSent ? (
                    <div className="text-center space-y-4 animate-in fade-in zoom-in">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                            <ShieldCheck size={32}/>
                        </div>
                        <h3 className="font-bold text-gray-800">E-mail Enviado!</h3>
                        <p className="text-sm text-gray-500">Verifique sua caixa de entrada.</p>
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
                            {loading ? <Loader2 className="animate-spin" size={20} /> : "Enviar Link"}
                        </button>
                    </form>
                )}
              </>
          ) : (
              // --- TELA DE LOGIN (COM ABAS) ---
              <>
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo!</h2>
                    <p className="text-gray-500 text-sm">Escolha como deseja entrar.</p>
                </div>

                {/* ABAS DE SELEÇÃO */}
                <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                    <button 
                        onClick={() => { setMethod('email'); setError(""); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition flex items-center justify-center gap-2 ${method === 'email' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Mail size={16}/> E-mail
                    </button>
                    <button 
                        onClick={() => { setMethod('phone'); setError(""); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition flex items-center justify-center gap-2 ${method === 'phone' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Phone size={16}/> Celular
                    </button>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg flex items-center gap-2 border border-red-100 animate-pulse mb-4">
                        <ShieldCheck size={16}/> {error}
                    </div>
                )}

                {method === 'email' ? (
                    // FORMULÁRIO E-MAIL
                    <form onSubmit={handleEmailLogin} className="space-y-5 animate-in fade-in slide-in-from-left-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">E-mail</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail size={18} className="text-gray-400 group-focus-within:text-blue-600 transition" /></div>
                                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900" placeholder="exemplo@igreja.com" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Senha</label>
                                <button type="button" onClick={() => setIsResetMode(true)} className="text-xs text-blue-600 hover:text-blue-800 font-bold transition">Esqueceu a senha?</button>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock size={18} className="text-gray-400 group-focus-within:text-blue-600 transition" /></div>
                                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900" placeholder="••••••••" />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-70">
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <>Entrar <ArrowRight size={18}/></>}
                        </button>
                    </form>
                ) : (
                    // FORMULÁRIO TELEFONE
                    <div className="animate-in fade-in slide-in-from-right-4">
                        {step === 'input_phone' ? (
                            <form onSubmit={handleSendCode} className="space-y-5">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">Número do Celular</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone size={18} className="text-gray-400 group-focus-within:text-blue-600 transition" /></div>
                                        <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900" placeholder="923 000 000" />
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1 ml-1">Basta digitar o número (9xx...). O código +244 é automático.</p>
                                </div>
                                <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-70">
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : <>Receber Código SMS <MessageSquare size={18}/></>}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyCode} className="space-y-5">
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">Enviamos um código para <strong>{phone}</strong></p>
                                    <button type="button" onClick={() => setStep('input_phone')} className="text-xs text-blue-600 font-bold hover:underline mt-1">Corrigir número</button>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">Código de 6 dígitos</label>
                                    <input required type="text" maxLength={6} value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} className="block w-full px-3 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-900 text-center text-xl tracking-[0.5em]" placeholder="------" />
                                </div>
                                <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/30 transition-all active:scale-[0.98] disabled:opacity-70">
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : <>Confirmar Acesso <ShieldCheck size={18}/></>}
                                </button>
                            </form>
                        )}
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-500 mb-3">É membro e ainda não tem cadastro?</p>
                    <Link href="/register" className="inline-block px-6 py-2 rounded-full border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-50 transition">
                        Criar minha conta
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