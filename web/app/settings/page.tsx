"use client";
import { useChurch } from "../../contexts/ChurchContext";
import { churchService } from "../../services/churchService";
import { Save, Globe, FileText, MapPin, User } from "lucide-react";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { settings, updateSettings } = useChurch();
  const [loading, setLoading] = useState(false);
  
  // Estados locais para o formulário
  const [currency, setCurrency] = useState<'BRL' | 'AOA'>('BRL');
  
  // Dados para Documentos
  const [docData, setDocData] = useState({
    churchName: "",
    seniorPastor: "",
    address: "",
    cityAndState: ""
  });

  useEffect(() => {
    // Carrega configurações existentes
    const churchId = localStorage.getItem("churchId");
    if (churchId) {
        churchService.getSettings(churchId).then(data => {
            if (data) {
                setCurrency(data.currency || 'BRL');
                // Carrega dados de documentos se existirem
                if (data.docs) {
                    setDocData(data.docs);
                }
            }
        });
        
        // Puxa o nome da igreja salvo no login como fallback
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
        // Salva tudo num objeto só
        const newSettings = {
            currency,
            docs: docData
        };
        
        // Atualiza no Contexto e no Banco
        updateSettings(newSettings);
        await churchService.updateSettings(churchId, newSettings);
        
        // Atualiza o nome da igreja no navegador também
        if (docData.churchName) {
            localStorage.setItem("churchName", docData.churchName);
        }
        
        alert("✅ Configurações salvas com sucesso!");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Configurações da Igreja</h1>
      
      {/* BLOCO 1: MOEDA */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Globe size={20} className="text-blue-600"/> Localização e Moeda
        </h2>
        <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Moeda Principal</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => setCurrency('BRL')} className={`p-4 border rounded-xl text-left transition ${currency === 'BRL' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-gray-50'}`}>
                <span className="block font-bold text-gray-800">Real Brasileiro (R$)</span>
              </button>
              <button onClick={() => setCurrency('AOA')} className={`p-4 border rounded-xl text-left transition ${currency === 'AOA' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-gray-50'}`}>
                <span className="block font-bold text-gray-800">Kwanza Angolano (Kz)</span>
              </button>
            </div>
        </div>
      </div>

      {/* BLOCO 2: DADOS PARA DOCUMENTOS (NOVO) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
          <FileText size={20} className="text-orange-600"/> Personalização de Documentos
        </h2>
        <p className="text-sm text-gray-500 mb-6">Estes dados aparecerão automaticamente nas Cartas de Recomendação e Transferência.</p>
        
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nome Oficial da Igreja</label>
                <input type="text" value={docData.churchName} onChange={e => setDocData({...docData, churchName: e.target.value})} className="w-full p-3 border rounded-lg" placeholder="Ex: Igreja Batista Renovada" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase flex items-center gap-1"><User size={14}/> Pastor Responsável (Assinatura)</label>
                    <input type="text" value={docData.seniorPastor} onChange={e => setDocData({...docData, seniorPastor: e.target.value})} className="w-full p-3 border rounded-lg" placeholder="Ex: Pr. José Sebastião" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase flex items-center gap-1"><MapPin size={14}/> Cidade / Província (Data)</label>
                    <input type="text" value={docData.cityAndState} onChange={e => setDocData({...docData, cityAndState: e.target.value})} className="w-full p-3 border rounded-lg" placeholder="Ex: Lubango, Huíla" />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Endereço Completo (Rodapé)</label>
                <input type="text" value={docData.address} onChange={e => setDocData({...docData, address: e.target.value})} className="w-full p-3 border rounded-lg" placeholder="Ex: Rua das Flores, 123 - Bairro Centro" />
            </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={loading} className="w-full md:w-auto bg-blue-600 text-white px-8 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 font-bold transition shadow-lg">
        <Save size={20} /> {loading ? "Salvando..." : "Salvar Todas as Configurações"}
      </button>
    </div>
  );
}