"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChurch } from "../../contexts/ChurchContext";
import { db } from "../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Settings, Save, Building2, Globe, FileText, Image as ImageIcon, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { churchId } = useChurch(); // Pega o ID dinâmico (Seja Admin ou Igreja)
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Campos
  const [name, setName] = useState("");
  const [pastor, setPastor] = useState("");
  const [city, setCity] = useState("");
  const [currency, setCurrency] = useState("AO");
  const [logoUrl, setLogoUrl] = useState("");
  const [textRecommendation, setTextRecommendation] = useState("");
  const [textTransfer, setTextTransfer] = useState("");

  // Carrega dados assim que abre a tela
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
        
        // Garante que pegamos a moeda salva, senão usa AO
        setCurrency(data.currency || "AO"); 
        
        setLogoUrl(data.logoUrl || "");
        setTextRecommendation(data.textRecommendation || "");
        setTextTransfer(data.textTransfer || "");
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Salva no documento da igreja ATUAL (Seja Admin ou Cliente)
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

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Settings className="text-gray-600"/> Configurações</h1>
        <p className="text-sm text-gray-500">ID da Conta: {churchId === 'master_admin' ? 'Super Admin' : churchId}</p>
      </div>

      <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-6">
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

        {/* REGIONALIZAÇÃO (MOEDA) */}
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
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><FileText size={16}/> Cartas & Documentos</h3>
            <div className="space-y-4">
                <div><label className="text-xs font-bold text-gray-500 uppercase">Texto Carta Recomendação</label><textarea rows={3} value={textRecommendation} onChange={e => setTextRecommendation(e.target.value)} className="w-full p-3 border rounded-xl text-sm" /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase">Texto Carta Transferência</label><textarea rows={3} value={textTransfer} onChange={e => setTextTransfer(e.target.value)} className="w-full p-3 border rounded-xl text-sm" /></div>
            </div>
        </div>

        <div className="flex justify-end pt-4">
            <button type="submit" disabled={saving} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center gap-2 disabled:opacity-70">
                {saving ? <Loader2 className="animate-spin"/> : <Save size={20}/>} {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
        </div>
      </form>
    </div>
  );
}