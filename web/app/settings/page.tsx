"use client";
import { useChurch } from "../../contexts/ChurchContext";
import { churchService } from "../../services/churchService";
import { Save, Globe, FileText, MapPin, User, Image as ImageIcon, Edit3 } from "lucide-react";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { updateSettings } = useChurch();
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState<'BRL' | 'AOA'>('BRL');
  
  // Dados turbinados
  const [docData, setDocData] = useState({
    churchName: "",
    seniorPastor: "",
    address: "",
    cityAndState: "",
    logoUrl: "", // NOVO: Link da Logo
    customTextRecomendacao: "", // NOVO: Texto personalizado
    customTextTransferencia: "" // NOVO: Texto personalizado
  });

  useEffect(() => {
    const churchId = localStorage.getItem("churchId");
    if (churchId) {
        churchService.getSettings(churchId).then(data => {
            if (data) {
                setCurrency(data.currency || 'BRL');
                if (data.docs) setDocData(prev => ({...prev, ...data.docs}));
            }
        });
        const savedName = localStorage.getItem("churchName");
        if (savedName && !docData.churchName) {
            setDocData(prev => ({ ...prev, churchName: savedName }));
        }
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const churchId = localStorage.getItem("churchId");
    if (churchId) {
        const newSettings = { currency, docs: docData };
        updateSettings(newSettings);
        await churchService.updateSettings(churchId, newSettings);
        if (docData.churchName) localStorage.setItem("churchName", docData.churchName);
        alert("✅ Configurações salvas com sucesso!");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Configurações da Igreja</h1>
      
      {/* LOCALIZAÇÃO E MOEDA */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><Globe size={20} className="text-blue-600"/> Localização e Moeda</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => setCurrency('BRL')} className={`p-4 border rounded-xl text-left ${currency === 'BRL' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'hover:bg-gray-50'}`}><span className="font-bold">Real (R$)</span></button>
            <button onClick={() => setCurrency('AOA')} className={`p-4 border rounded-xl text-left ${currency === 'AOA' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'hover:bg-gray-50'}`}><span className="font-bold">Kwanza (Kz)</span></button>
        </div>
      </div>

      {/* DADOS BÁSICOS */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><FileText size={20} className="text-orange-600"/> Cabeçalho dos Documentos</h2>
        <div className="space-y-4">
            <div><label className="text-xs font-bold text-gray-500 uppercase">Nome da Igreja</label><input type="text" value={docData.churchName} onChange={e => setDocData({...docData, churchName: e.target.value})} className="w-full p-3 border rounded-lg" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-gray-500 uppercase">Pastor Responsável</label><input type="text" value={docData.seniorPastor} onChange={e => setDocData({...docData, seniorPastor: e.target.value})} className="w-full p-3 border rounded-lg" /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase">Cidade / Data</label><input type="text" value={docData.cityAndState} onChange={e => setDocData({...docData, cityAndState: e.target.value})} className="w-full p-3 border rounded-lg" /></div>
            </div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Link da Logo (URL)</label><div className="flex gap-2"><div className="p-3 bg-gray-100 border rounded-l-lg"><ImageIcon size={20} className="text-gray-400"/></div><input type="text" value={docData.logoUrl} onChange={e => setDocData({...docData, logoUrl: e.target.value})} className="w-full p-3 border rounded-r-lg" placeholder="https://..." /></div><p className="text-[10px] text-gray-400 mt-1">Cole o link direto da imagem da sua logo.</p></div>
        </div>
      </div>

      {/* TEXTOS PERSONALIZADOS */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><Edit3 size={20} className="text-purple-600"/> Personalizar Textos</h2>
        <div className="space-y-4">
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Texto da Carta de Recomendação</label>
                <textarea rows={4} value={docData.customTextRecomendacao} onChange={e => setDocData({...docData, customTextRecomendacao: e.target.value})} className="w-full p-3 border rounded-lg text-sm" placeholder="Deixe em branco para usar o texto padrão..." />
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Texto da Carta de Transferência</label>
                <textarea rows={4} value={docData.customTextTransferencia} onChange={e => setDocData({...docData, customTextTransferencia: e.target.value})} className="w-full p-3 border rounded-lg text-sm" placeholder="Deixe em branco para usar o texto padrão..." />
            </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={loading} className="w-full md:w-auto bg-blue-600 text-white px-8 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 font-bold shadow-lg mb-8">
        <Save size={20} /> {loading ? "Salvando..." : "Salvar Configurações"}
      </button>
    </div>
  );
}