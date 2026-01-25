"use client";
import { useChurch } from "../../contexts/ChurchContext";
import { Save, Globe, Type } from "lucide-react";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { settings, updateSettings } = useChurch();
  
  // Estados locais para o formulário
  const [currency, setCurrency] = useState(settings.currency);
  const [label, setLabel] = useState(settings.ministryLabel);

  useEffect(() => {
    setCurrency(settings.currency);
    setLabel(settings.ministryLabel);
  }, [settings]);

  const handleSave = () => {
    updateSettings({ currency, ministryLabel: label });
    alert("✅ Configurações salvas! O sistema já foi atualizado.");
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Configurações do Sistema</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Globe size={20} className="text-blue-600"/> Localização e Termos
        </h2>
        
        <div className="space-y-6">
          {/* Seletor de Moeda */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Moeda Principal</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setCurrency('BRL')}
                className={`p-4 border rounded-xl text-left transition ${currency === 'BRL' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'hover:bg-gray-50'}`}
              >
                <span className="block font-bold text-gray-800">Real Brasileiro (R$)</span>
                <span className="text-xs text-gray-500">Formato: R$ 1.000,00</span>
              </button>
              
              <button 
                onClick={() => setCurrency('AOA')}
                className={`p-4 border rounded-xl text-left transition ${currency === 'AOA' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'hover:bg-gray-50'}`}
              >
                <span className="block font-bold text-gray-800">Kwanza Angolano (Kz)</span>
                <span className="text-xs text-gray-500">Formato: Kz 1.000,00</span>
              </button>
            </div>
          </div>

          {/* Seletor de Termo */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Como chamar as equipes?</label>
            <div className="flex gap-4">
               <label className="flex items-center gap-2 cursor-pointer">
                 <input type="radio" name="term" checked={label === 'Ministérios'} onChange={() => setLabel('Ministérios')} />
                 <span>Ministérios (Padrão BR)</span>
               </label>
               <label className="flex items-center gap-2 cursor-pointer">
                 <input type="radio" name="term" checked={label === 'Departamentos'} onChange={() => setLabel('Departamentos')} />
                 <span>Departamentos (Comum em AO)</span>
               </label>
            </div>
          </div>

          <button 
            onClick={handleSave}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
          >
            <Save size={20} /> Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}