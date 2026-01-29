"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChurch } from "../../contexts/ChurchContext";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { 
  Settings, Save, Building2, Globe, FileText, 
  Image as ImageIcon, Loader2, Lock, ShieldCheck, AlertTriangle 
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { churchId, user } = useChurch(); 
  
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

  // --- DADOS DE SEGURANÇA (Troca de Senha) ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (churchId) loadSettings();
  }, [churchId]);

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
      alert("✅ Configurações salvas com sucesso!");
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
          // 1. Reautenticar (Segurança do Firebase exige isso para trocar senha)
          const credential = EmailAuthProvider.credential(user.email, currentPassword);
          await reauthenticateWithCredential(user, credential);

          // 2. Atualizar Senha
          await updatePassword(user, newPassword);

          alert("✅ Senha alterada com sucesso! Use a nova senha no próximo login.");
          
          // Limpa campos
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

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Settings className="text-gray-600"/> Configurações</h1>
        <p className="text-sm text-gray-500">Gerencie os dados da igreja e sua segurança.</p>
      </div>

      {/* ABAS DE NAVEGAÇÃO */}
      <div className="max-w-4xl mx-auto mb-6 flex gap-4 border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('general')}
            className={`pb-3 px-4 text-sm font-bold transition ${activeTab === 'general' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
              Dados da Igreja
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`pb-3 px-4 text-sm font-bold transition flex items-center gap-2 ${activeTab === 'security' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
              <ShieldCheck size={16}/> Segurança & Senha
          </button>
      </div>

      {/* --- CONTEÚDO: GERAL --- */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveGeneral} className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-left-4">
            {/* IDENTIDADE */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Building2 size={16}/> Identidade</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Nome da Igreja (Cabeçalho)</label>
                        <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border rounded-xl font-medium" />
                    </div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase">Pastor Responsável</label><input type="text" value={pastor} onChange={e => setPastor(e.target.value)} className="w-full p-3 border rounded-xl" /></div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase">Cidade / Sede</label><input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full p-3 border rounded-xl" /></div>
                </div>
            </div>

            {/* FINANCEIRO */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Globe size={16}/> Financeiro & Local</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Moeda do Sistema</label>
                        <div className="flex gap-4">
                            <button type="button" onClick={() => setCurrency('BR')} className={`flex-1 p-4 rounded-xl border-2 font-bold transition flex flex-col items-center gap-1 ${currency === 'BR' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 hover:border-gray-200'}`}>
                                <span className="text-xl">🇧🇷</span> <span>Real (R$)</span>
                            </button>
                            <button type="button" onClick={() => setCurrency('AO')} className={`flex-1 p-4 rounded-xl border-2 font-bold transition flex flex-col items-center gap-1 ${currency === 'AO' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 hover:border-gray-200'}`}>
                                <span className="text-xl">🇦🇴</span> <span>Kwanza (Kz)</span>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Link da Logo (URL)</label>
                        <div className="relative"><ImageIcon className="absolute left-3 top-3 text-gray-400" size={20}/><input type="text" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className="w-full pl-10 p-3 border rounded-xl text-sm" placeholder="https://..." /></div>
                    </div>
                </div>
            </div>

            {/* DOCUMENTOS */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><FileText size={16}/> Textos Padrão (Cartas)</h3>
                <div className="space-y-4">
                    <div><label className="text-xs font-bold text-gray-500 uppercase">Texto Recomendação</label><textarea rows={3} value={textRecommendation} onChange={e => setTextRecommendation(e.target.value)} className="w-full p-3 border rounded-xl text-sm" /></div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase">Texto Transferência</label><textarea rows={3} value={textTransfer} onChange={e => setTextTransfer(e.target.value)} className="w-full p-3 border rounded-xl text-sm" /></div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button type="submit" disabled={saving} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center gap-2 disabled:opacity-70">
                    {saving ? <Loader2 className="animate-spin"/> : <Save size={20}/>} {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
            </div>
        </form>
      )}

      {/* --- CONTEÚDO: SEGURANÇA --- */}
      {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="max-w-xl mx-auto animate-in fade-in slide-in-from-right-4">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
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
                          <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="••••••••" />
                      </div>
                      <hr className="border-gray-100 my-2"/>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Nova Senha</label>
                          <input type="password" required minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Mínimo 6 caracteres" />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Confirmar Nova Senha</label>
                          <input type="password" required minLength={6} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Repita a nova senha" />
                      </div>
                  </div>

                  <button type="submit" disabled={saving} className="w-full mt-8 bg-gray-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-black transition flex justify-center items-center gap-2 disabled:opacity-70">
                      {saving ? <Loader2 className="animate-spin"/> : <ShieldCheck size={20}/>} {saving ? "Atualizando..." : "Atualizar Senha"}
                  </button>
              </div>
          </form>
      )}

    </div>
  );
}