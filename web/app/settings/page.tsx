"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // <--- 1. IMPORTAR ROUTER
import { useChurch } from "../../contexts/ChurchContext"; 
import { auth, db } from "../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { 
  Settings, Save, Building2, Globe, FileText, 
  Image as ImageIcon, Loader2, Lock, ShieldCheck, AlertTriangle 
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter(); // <--- 2. INICIALIZAR ROUTER
  
  const { churchId, user, setChurchData, userRole, userName } = useChurch(); 
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');

  // --- DADOS DA IGREJA ---
  const [name, setName] = useState("");
  const [pastor, setPastor] = useState("");
  const [city, setCity] = useState("");
  const [currency, setCurrency] = useState("AO");
  const [logoUrl, setLogoUrl] = useState("");
  const [textRecommendation, setTextRecommendation] = useState("");
  const [textTransfer, setTextTransfer] = useState("");

  // --- DADOS DE SEGURANÇA ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    // --- 3. LÓGICA DE PROTEÇÃO (ANTI-LOOP) ---
    let isMounted = true;

    const checkAndLoad = async () => {
        // Se já tem ID no contexto, carrega
        if (churchId) {
            await loadSettings();
            return;
        }

        // Se não tem, verifica o localStorage como backup
        const storedId = localStorage.getItem("churchId");
        
        if (!storedId) {
            // Se não tem nem no contexto nem no storage, manda pro login
            router.push("/login");
        } else {
            // Se tem no storage, aguarda o contexto sincronizar
            if (isMounted) setLoading(true);
        }
    };

    const timer = setTimeout(checkAndLoad, 500);
    return () => { isMounted = false; clearTimeout(timer); };
  }, [churchId, router]);

  const loadSettings = async () => {
    try {
      const snap = await getDoc(doc(db, "churches", churchId));
      if (snap.exists()) {
        const data = snap.data();
        setName(data.name || "");
        setPastor(data.ownerName || "");
        setCity(data.city || "");
        setCurrency(data.currency || "AO"); 
        setLogoUrl(data.logoUrl || "");
        setTextRecommendation(data.textRecommendation || "");
        setTextTransfer(data.textTransfer || "");
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Atualiza no Banco de Dados
      await updateDoc(doc(db, "churches", churchId), {
          name, 
          ownerName: pastor, 
          city, 
          currency, 
          logoUrl,
          textRecommendation,
          textTransfer,
          updatedAt: new Date().toISOString()
      });

      // 2. Atualiza o Contexto do App imediatamente
      setChurchData(churchId, name, userRole, userName, logoUrl, currency);

      alert("✅ Configurações salvas e aplicadas!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if(newPassword !== confirmPassword) {
          alert("❌ As novas senhas não coincidem.");
          return;
      }
      if(newPassword.length < 6) {
          alert("❌ A senha deve ter no mínimo 6 caracteres.");
          return;
      }
      if(!user || !user.email) return;

      setSaving(true);
      try {
          const credential = EmailAuthProvider.credential(user.email, currentPassword);
          await reauthenticateWithCredential(user, credential);
          await updatePassword(user, newPassword);

          alert("✅ Senha alterada com sucesso!");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");

      } catch (error: any) {
          console.error(error);
          if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
              alert("❌ A senha atual está incorreta.");
          } else {
              alert("Erro ao atualizar senha: " + error.message);
          }
      } finally {
          setSaving(false);
      }
  };

  if (loading) return <div className="flex justify-center p-10 min-h-screen items-center"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* CABEÇALHO AZUL */}
      <div className="bg-[#1D4ED8] pt-10 pb-24 px-8 shadow-sm">
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Settings className="text-blue-300"/> Configurações
            </h1>
            <p className="text-blue-100 text-lg opacity-90">Dados da igreja e segurança.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-0 -mt-16 relative z-10">
          
          {/* MENU DE ABAS */}
          <div className="bg-white rounded-t-3xl shadow-sm border-b border-gray-100 px-6 pt-4 flex gap-4">
              <button onClick={() => setActiveTab('general')} className={`pb-4 px-2 font-bold text-sm border-b-4 transition ${activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>Dados da Igreja</button>
              <button onClick={() => setActiveTab('security')} className={`pb-4 px-2 font-bold text-sm border-b-4 transition ${activeTab === 'security' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>Segurança</button>
          </div>

          {/* ÁREA DE CONTEÚDO */}
          <div className="bg-white rounded-b-3xl shadow-xl shadow-blue-900/5 border border-gray-100 p-8">
              {activeTab === 'general' && (
                <form onSubmit={handleSaveGeneral} className="space-y-6 animate-in fade-in">
                    {/* IDENTIDADE */}
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Building2 size={14}/> Identidade</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Nome da Igreja (Cabeçalho)</label>
                                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border rounded-xl font-medium bg-white outline-none focus:ring-2 ring-blue-100" />
                            </div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase">Pastor Responsável</label><input type="text" value={pastor} onChange={e => setPastor(e.target.value)} className="w-full p-3 border rounded-xl bg-white outline-none focus:ring-2 ring-blue-100" /></div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase">Cidade / Sede</label><input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full p-3 border rounded-xl bg-white outline-none focus:ring-2 ring-blue-100" /></div>
                        </div>
                    </div>

                    {/* FINANCEIRO */}
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Globe size={14}/> Financeiro & Local</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Moeda do Sistema</label>
                                <div className="flex gap-4">
                                    <button type="button" onClick={() => setCurrency('BR')} className={`flex-1 p-4 rounded-xl border-2 font-bold transition flex flex-col items-center gap-1 ${currency === 'BR' ? 'border-blue-600 bg-white text-blue-700 shadow-sm' : 'border-gray-200 bg-gray-100 text-gray-400 hover:bg-white'}`}>
                                        <span className="text-xl">🇧🇷</span> <span>Real (R$)</span>
                                    </button>
                                    <button type="button" onClick={() => setCurrency('AO')} className={`flex-1 p-4 rounded-xl border-2 font-bold transition flex flex-col items-center gap-1 ${currency === 'AO' ? 'border-blue-600 bg-white text-blue-700 shadow-sm' : 'border-gray-200 bg-gray-100 text-gray-400 hover:bg-white'}`}>
                                        <span className="text-xl">🇦🇴</span> <span>Kwanza (Kz)</span>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Link da Logo (URL)</label>
                                <div className="relative"><ImageIcon className="absolute left-3 top-3 text-gray-400" size={20}/><input type="text" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className="w-full pl-10 p-3 border rounded-xl text-sm bg-white outline-none focus:ring-2 ring-blue-100" placeholder="https://..." /></div>
                            </div>
                        </div>
                    </div>

                    {/* DOCUMENTOS */}
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><FileText size={14}/> Textos Padrão (Cartas)</h3>
                        <div className="space-y-4">
                            <div><label className="text-xs font-bold text-gray-500 uppercase">Texto Recomendação</label><textarea rows={3} value={textRecommendation} onChange={e => setTextRecommendation(e.target.value)} className="w-full p-3 border rounded-xl text-sm bg-white outline-none focus:ring-2 ring-blue-100" /></div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase">Texto Transferência</label><textarea rows={3} value={textTransfer} onChange={e => setTextTransfer(e.target.value)} className="w-full p-3 border rounded-xl text-sm bg-white outline-none focus:ring-2 ring-blue-100" /></div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={saving} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center gap-2 disabled:opacity-70">
                            {saving ? <Loader2 className="animate-spin"/> : <Save size={20}/>} {saving ? "Salvando..." : "Salvar Alterações"}
                        </button>
                    </div>
                </form>
              )}

              {activeTab === 'security' && (
                  <form onSubmit={handleChangePassword} className="max-w-xl mx-auto animate-in fade-in py-4">
                      <div className="text-center mb-8">
                          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-blue-100">
                              <Lock size={32}/>
                          </div>
                          <h2 className="text-xl font-bold text-gray-800">Alterar Senha</h2>
                          <p className="text-sm text-gray-500">Defina uma nova senha para acessar o painel.</p>
                      </div>

                      <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 mb-6">
                          <AlertTriangle className="text-amber-500 shrink-0" size={20}/>
                          <p className="text-xs text-amber-700 font-bold">Por segurança, você precisará confirmar sua senha atual antes de criar uma nova.</p>
                      </div>

                      <div className="space-y-4">
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase">Senha Atual</label>
                              <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:ring-2 ring-blue-100" placeholder="••••••••" />
                          </div>
                          <hr className="border-gray-100 my-2"/>
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase">Nova Senha</label>
                              <input type="password" required minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:ring-2 ring-blue-100" placeholder="Mínimo 6 caracteres" />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase">Confirmar Nova Senha</label>
                              <input type="password" required minLength={6} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:ring-2 ring-blue-100" placeholder="Repita a nova senha" />
                          </div>
                      </div>

                      <button type="submit" disabled={saving} className="w-full mt-8 bg-gray-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-black transition flex justify-center items-center gap-2 disabled:opacity-70 shadow-lg shadow-gray-200">
                          {saving ? <Loader2 className="animate-spin"/> : <ShieldCheck size={20}/>} {saving ? "Atualizando..." : "Atualizar Senha"}
                      </button>
                  </form>
              )}
          </div>
      </div>
    </div>
  );
}