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
    updateSettings({ currency });
    alert(`✅ Configuração salva na nuvem!\nAgora todos os usuários verão em: ${currency === 'BRL' ? 'Real' : 'Kwanza'}`);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Configurações do Sistema</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Globe size={20} className="text-blue-600"/> Localização e Moeda
        </h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Moeda Principal da Igreja</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => setCurrency('BRL')} className={`p-4 border rounded-xl text-left transition ${currency === 'BRL' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-gray-50'}`}>
                <span className="block font-bold text-gray-800">Real Brasileiro (R$)</span>
              </button>
              <button onClick={() => setCurrency('AOA')} className={`p-4 border rounded-xl text-left transition ${currency === 'AOA' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-gray-50'}`}>
                <span className="block font-bold text-gray-800">Kwanza Angolano (Kz)</span>
              </button>
            </div>
          </div>
          <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700 font-bold">
            <Save size={20} /> Salvar Configuração Global
          </button>
        </div>
      </div>
      
      {/* Simulador removido conforme pedido */}
    </div>
  );
}