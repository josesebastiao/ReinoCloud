"use client";
import { useChurch } from "../../contexts/ChurchContext";
import { Save, Globe } from "lucide-react";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { settings, updateSettings } = useChurch();
  const [currency, setCurrency] = useState<'BRL' | 'AOA'>('BRL');

  useEffect(() => {
    if (settings) {
      setCurrency(settings.currency);
    }
  }, [settings]);

  const handleSave = () => {
    // Atualiza o contexto globalmente
    updateSettings({ currency });
    
    // Alerta simples
    alert(`✅ Configuração salva!\nMoeda definida para: ${currency === 'BRL' ? 'Real (R$)' : 'Kwanza (Kz)'}`);
    
    // REMOVIDO O RELOAD PARA A MUDANÇA SER IMEDIATA E NÃO PERDER O STATE
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Configurações do Sistema</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Globe size={20} className="text-blue-600"/> Localização
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Moeda Principal</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setCurrency('BRL')}
                className={`p-4 border rounded-xl text-left transition ${currency === 'BRL' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-gray-50'}`}
              >
                <span className="block font-bold text-gray-800">Real Brasileiro (R$)</span>
                <span className="text-xs text-gray-500">Formato: R$ 1.000,00</span>
              </button>
              
              <button 
                onClick={() => setCurrency('AOA')}
                className={`p-4 border rounded-xl text-left transition ${currency === 'AOA' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-gray-50'}`}
              >
                <span className="block font-bold text-gray-800">Kwanza Angolano (Kz)</span>
                <span className="text-xs text-gray-500">Formato: Kz 1.000,00</span>
              </button>
            </div>
          </div>

          <button 
            onClick={handleSave}
            className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition font-bold shadow-lg shadow-blue-200"
          >
            <Save size={20} /> Salvar Configuração
          </button>
        </div>
      </div>
    </div>
  );
}