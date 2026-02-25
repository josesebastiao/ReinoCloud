"use client";
import { useState, useEffect } from "react";
import { useChurch } from "../../contexts/ChurchContext"; 
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { 
    Building2, Globe, FileText, Save, Loader2, Lock, ShieldCheck, 
    ImageIcon, AlertTriangle, Settings, PenTool 
} from "lucide-react";
import { compressImageFile, uploadToImgbb, cacheImage, getCachedImage, validateImageFile } from "../../utils/imageHelper";

export default function SettingsPage() {
  const { churchId, setChurchData, userRole, userName } = useChurch(); 
  
  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados do Formulário
  const [name, setName] = useState("");
  const [pastor, setPastor] = useState("");
  const [city, setCity] = useState("");
  const [currency, setCurrency] = useState("AO");
  const [logoUrl, setLogoUrl] = useState("");
  const [signatureUrl, setSignatureUrl] = useState(""); // <--- NOVO CAMPO
    const [logoUploading, setLogoUploading] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [signatureUploading, setSignatureUploading] = useState(false);
    const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [textRecommendation, setTextRecommendation] = useState("");
  const [textTransfer, setTextTransfer] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (churchId) loadData();
  }, [churchId]);

  const loadData = async () => {
    if (!churchId) return; 
    try {
        const ref = doc(db, "churches", churchId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const d = snap.data();
            setName(d.name || "");
            setPastor(d.ownerName || "");
            setCity(d.city || "");
            setCurrency(d.currency || "AO");
            setLogoUrl(d.logoUrl || "");
            setSignatureUrl(d.signatureUrl || ""); // <--- Carrega assinatura
            setTextRecommendation(d.textRecommendation || "");
            setTextTransfer(d.textTransfer || "");
        }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const isValidUrl = (url: string) => {
    if (!url) return true; // Permitir vazio
    if (url.startsWith('data:image')) return true; // Permitir Base64
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch { return false; }
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId) {
        alert("Erro: ID da igreja não encontrado.");
        return;
    }
    if (userRole !== 'admin') {
        alert("Apenas o Pastor (Admin) pode alterar os dados da igreja.");
        return;
    }

    if (!isValidUrl(logoUrl) || !isValidUrl(signatureUrl)) {
        alert("As URLs da Logo ou Assinatura são inválidas. Use links começando com http:// ou https://");
        setSaving(false);
        return;
    }

    setSaving(true);
    try {
        const ref = doc(db, "churches", churchId);
        await updateDoc(ref, {
            name: name.trim(),
            ownerName: pastor.trim(),
            city: city.trim(),
            currency,
            logoUrl,
            signatureUrl, // <--- Salva assinatura
            textRecommendation,
            textTransfer
        });

        // Atualiza contexto
        setChurchData(
            churchId,
            name,
            userRole || "", 
            userName || "",
            logoUrl, 
            signatureUrl, // <--- NOVO
            currency
        );

        alert("✅ Configurações salvas com sucesso!");
    } catch (error) {
        console.error(error);
        alert("Erro ao salvar.");
    } finally {
        setSaving(false);
    }
  };

    const handleFileUpload = async (file: File | undefined, target: 'logo' | 'signature') => {
        if (!file) return;
        if (userRole !== 'admin') {
            alert("Apenas o Pastor (Admin) pode alterar imagens da igreja.");
            return;
        }
        try {
            // Validate file
            const validationError = validateImageFile(file);
            if (validationError) throw new Error(validationError);
            
            if (target === 'logo') setLogoUploading(true);
            else setSignatureUploading(true);

            // Compress with optimized defaults (800px max, 60% quality)
            const compressed = await compressImageFile(file);
            const uploadedUrl = await uploadToImgbb(compressed);
            if (target === 'logo') {
                setLogoUrl(uploadedUrl);
                setLogoPreview(compressed);
                cacheImage(uploadedUrl, compressed);
            } else {
                setSignatureUrl(uploadedUrl);
                setSignaturePreview(compressed);
                cacheImage(uploadedUrl, compressed);
            }
        } catch (err: any) {
            console.error(err);
            alert((err?.message || 'Erro ao enviar imagem.'));
        } finally {
            if (target === 'logo') setLogoUploading(false);
            else setSignatureUploading(false);
        }
    };

    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'logo'); };
    const handleSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'signature'); };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push("Ter no mínimo 8 caracteres");
    if (!/[a-z]/.test(password)) errors.push("Conter uma letra minúscula (a-z)");
    if (!/[A-Z]/.test(password)) errors.push("Conter uma letra maiúscula (A-Z)");
    if (!/[0-9]/.test(password)) errors.push("Conter um número (0-9)");
    return errors;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
        alert("A nova senha e a confirmação não batem.");
        return;
    }

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
        alert(`A nova senha não é forte o suficiente. Ela precisa:\n\n- ${passwordErrors.join('\n- ')}`);
        return;
    }

    setSaving(true);
    try {
        const user = auth.currentUser;
        if (!user || !user.email) throw new Error("Usuário não autenticado");

        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        await updatePassword(user, newPassword);
        
        alert("✅ Senha alterada com sucesso!");
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (error: any) {
        console.error(error);
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
            alert("A senha atual está incorreta.");
        } else {
            alert("Erro ao alterar senha: " + error.code);
        }
    } finally {
        setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600"/></div>;

  const passwordPolicy = [
      { rule: "Ter no mínimo 8 caracteres", valid: newPassword.length >= 8 },
      { rule: "Conter letras maiúsculas e minúsculas", valid: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) },
      { rule: "Conter um número", valid: /[0-9]/.test(newPassword) },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-blue-800 pt-10 pb-24 px-8 shadow-sm">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Settings className="text-blue-300"/> Configurações
            </h1>
            <p className="text-blue-100 text-lg opacity-90">Dados da igreja e segurança.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-0 -mt-16">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="flex border-b border-gray-100">
                  <button onClick={() => setActiveTab('general')} className={`flex-1 py-4 font-bold text-sm flex justify-center items-center gap-2 transition ${activeTab === 'general' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}>
                      <Building2 size={18}/> Dados da Igreja
                  </button>
                  <button onClick={() => setActiveTab('security')} className={`flex-1 py-4 font-bold text-sm flex justify-center items-center gap-2 transition ${activeTab === 'security' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}>
                      <ShieldCheck size={18}/> Segurança
                  </button>
              </div>

              <div className="p-6 md:p-8">
                  {activeTab === 'general' && (
                    <form onSubmit={handleSaveGeneral} className="space-y-6 animate-in fade-in">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Building2 size={14}/> Identidade</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-gray-600 uppercase">Nome da Igreja (Cabeçalho)</label>
                                    <input type="text" required value={name} onChange={e => setName(e.target.value)} disabled={userRole !== 'admin'} className="w-full p-3 border rounded-lg font-medium bg-white outline-none focus:ring-2 ring-blue-100 disabled:bg-gray-100 disabled:text-gray-500" />
                                </div>
                                <div><label className="text-xs font-bold text-gray-600 uppercase">Pastor Responsável</label><input type="text" value={pastor} onChange={e => setPastor(e.target.value)} disabled={userRole !== 'admin'} className="w-full p-3 border rounded-lg bg-white outline-none focus:ring-2 ring-blue-100 disabled:bg-gray-100 disabled:text-gray-500" /></div>
                                <div><label className="text-xs font-bold text-gray-600 uppercase">Cidade / Sede</label><input type="text" value={city} onChange={e => setCity(e.target.value)} disabled={userRole !== 'admin'} className="w-full p-3 border rounded-lg bg-white outline-none focus:ring-2 ring-blue-100 disabled:bg-gray-100 disabled:text-gray-500" /></div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Globe size={14}/> Financeiro & Visual</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-600 uppercase mb-2 block">Moeda do Sistema</label>
                                    <div className="flex gap-4">
                                        <button type="button" disabled={userRole !== 'admin'} onClick={() => setCurrency('BR')} className={`flex-1 p-4 rounded-lg border-2 font-bold transition flex flex-col items-center gap-1 ${currency === 'BR' ? 'border-blue-600 bg-white text-blue-700 shadow-sm' : 'border-gray-200 bg-gray-100 text-gray-400 hover:bg-white'} disabled:opacity-60 disabled:cursor-not-allowed`}>
                                            <span className="text-xl">🇧🇷</span> <span>Real (R$)</span>
                                        </button>
                                        <button type="button" disabled={userRole !== 'admin'} onClick={() => setCurrency('AO')} className={`flex-1 p-4 rounded-lg border-2 font-bold transition flex flex-col items-center gap-1 ${currency === 'AO' ? 'border-blue-600 bg-white text-blue-700 shadow-sm' : 'border-gray-200 bg-gray-100 text-gray-400 hover:bg-white'} disabled:opacity-60 disabled:cursor-not-allowed`}>
                                            <span className="text-xl">🇦🇴</span> <span>Kwanza (Kz)</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 uppercase">Logo da Igreja</label>
                                        {userRole === 'admin' && (
                                            <div className="flex items-center gap-2">
                                                <input accept="image/*" onChange={handleLogoFileChange} id="logo-file" type="file" className="hidden" />
                                                <label htmlFor="logo-file" className="px-3 py-2 bg-white border rounded-lg cursor-pointer text-sm hover:bg-gray-50">Enviar Arquivo</label>
                                                <span className="text-xs text-gray-500">ou cole um link abaixo</span>
                                                {logoUploading && <Loader2 className="animate-spin text-blue-600" size={18}/>} 
                                            </div>
                                        )}
                                        <div className="relative mt-3"><ImageIcon className="absolute left-3 top-3 text-gray-400" size={20}/><input type="text" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} disabled={userRole !== 'admin'} className="w-full pl-10 p-3 border rounded-lg text-sm bg-white outline-none focus:ring-2 ring-blue-100 disabled:bg-gray-100" placeholder="https://..." /></div>
                                        <div className="mt-2 text-center">
                                            {logoPreview ? <img src={logoPreview} className="h-10 mx-auto object-contain bg-white border p-1 rounded"/> : (getCachedImage(logoUrl) ? <img src={getCachedImage(logoUrl)!} className="h-10 mx-auto object-contain bg-white border p-1 rounded"/> : (logoUrl && <img src={logoUrl} className="h-10 mx-auto object-contain bg-white border p-1 rounded"/>))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 uppercase">Assinatura Digital (URL)</label>
                                        {userRole === 'admin' && (
                                            <div className="flex items-center gap-2">
                                                <input accept="image/*" onChange={handleSignatureFileChange} id="signature-file" type="file" className="hidden" />
                                                <label htmlFor="signature-file" className="px-3 py-2 bg-white border rounded-lg cursor-pointer text-sm hover:bg-gray-50">Enviar Arquivo</label>
                                                <span className="text-xs text-gray-500">ou cole um link abaixo</span>
                                                {signatureUploading && <Loader2 className="animate-spin text-blue-600" size={18}/>} 
                                            </div>
                                        )}
                                        <div className="relative mt-3"><PenTool className="absolute left-3 top-3 text-gray-400" size={20}/><input type="text" value={signatureUrl} onChange={e => setSignatureUrl(e.target.value)} disabled={userRole !== 'admin'} className="w-full pl-10 p-3 border rounded-lg text-sm bg-white outline-none focus:ring-2 ring-blue-100 disabled:bg-gray-100" placeholder="Link da imagem PNG..." /></div>
                                        <div className="mt-2 text-center">
                                            {signaturePreview ? <img src={signaturePreview} className="h-10 mx-auto object-contain bg-white border p-1 rounded"/> : (getCachedImage(signatureUrl) ? <img src={getCachedImage(signatureUrl)!} className="h-10 mx-auto object-contain bg-white border p-1 rounded"/> : (signatureUrl && <img src={signatureUrl} className="h-10 mx-auto object-contain bg-white border p-1 rounded"/>))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"><FileText size={14}/> Textos Padrão (Cartas)</h3>
                            <div className="space-y-4">
                                <div><label className="text-xs font-bold text-gray-600 uppercase">Texto Recomendação</label><textarea rows={3} value={textRecommendation} onChange={e => setTextRecommendation(e.target.value)} disabled={userRole !== 'admin'} className="w-full p-3 border rounded-lg text-sm bg-white outline-none focus:ring-2 ring-blue-100 disabled:bg-gray-100" /></div>
                                <div><label className="text-xs font-bold text-gray-600 uppercase">Texto Transferência</label><textarea rows={3} value={textTransfer} onChange={e => setTextTransfer(e.target.value)} disabled={userRole !== 'admin'} className="w-full p-3 border rounded-lg text-sm bg-white outline-none focus:ring-2 ring-blue-100 disabled:bg-gray-100" /></div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            {userRole === 'admin' && (
                                <button type="submit" disabled={saving} className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center gap-2 disabled:opacity-70">
                                    {saving ? <Loader2 className="animate-spin"/> : <Save size={20}/>} {saving ? "Salvando..." : "Salvar Alterações"}
                                </button>
                            )}
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
                                  <label className="text-xs font-bold text-gray-600 uppercase">Senha Atual</label>
                                  <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full p-3 border rounded-lg outline-none focus:ring-2 ring-blue-100" placeholder="••••••••" />
                              </div>
                              <hr className="border-gray-100 my-2"/>
                              <div>
                                  <label className="text-xs font-bold text-gray-600 uppercase">Nova Senha</label>
                                  <input type="password" required minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3 border rounded-lg outline-none focus:ring-2 ring-blue-100" placeholder="Mínimo 6 caracteres" />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-gray-600 uppercase">Confirmar Nova Senha</label>
                                  <input type="password" required minLength={6} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-3 border rounded-lg outline-none focus:ring-2 ring-blue-100" placeholder="Repita a nova senha" />
                              </div>
                          </div>

                          <button type="submit" disabled={saving} className="w-full mt-8 bg-gray-900 text-white px-8 py-4 rounded-lg font-bold hover:bg-black transition flex justify-center items-center gap-2 disabled:opacity-70 shadow-lg shadow-gray-200">
                              {saving ? <Loader2 className="animate-spin"/> : <ShieldCheck size={20}/>} {saving ? "Atualizando..." : "Atualizar Senha"}
                          </button>
                      </form>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
}