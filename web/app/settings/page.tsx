"use client";
import { useChurch } from "../../contexts/ChurchContext";
import { Save, Globe, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { settings, updateSettings } = useChurch();
  const [currency, setCurrency] = useState<'BRL' | 'AOA'>('BRL');
  
  // Estado para simulação de acesso
  const [currentRole, setCurrentRole] = useState("admin");

  useEffect(() => {
    if (settings) {
      setCurrency(settings.currency);
    }
    // Carrega o cargo atual
    setCurrentRole(localStorage.getItem("userRole") || "admin");
  }, [settings]);

  const handleSave = () => {
    updateSettings({ currency });
    alert(`✅ Moeda salva: ${currency === 'BRL' ? 'Real' : 'Kwanza'}`);
    // Não precisa reload, o context resolve a moeda
  };

  const handleChangeRole = (newRole: string) => {
    // SALVA O CARGO NO NAVEGADOR E RECARREGA PARA O MENU ATUALIZAR
    localStorage.setItem("userRole", newRole);
    setCurrentRole(newRole);
    alert(`🔄 Alternando visão para: ${newRole.toUpperCase()}\nO menu será atualizado.`);
    window.location.reload(); 
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Configurações do Sistema</h1>
      
      {/* BLOCO DE MOEDA */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Globe size={20} className="text-blue-600"/> Localização
        </h2>
        <div className="space-y-6">
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
          <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700 font-bold">
            <Save size={20} /> Salvar Configuração
          </button>
        </div>
      </div>

      {/* BLOCO DE SIMULAÇÃO DE ACESSO (PERIGOSO, SÓ PARA ADMIN) */}
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg border border-slate-700">
        <h2 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
          <ShieldCheck size={20}/> Simulador de Acesso (Modo Admin)
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Use esta ferramenta para ver como o sistema aparece para outros cargos da igreja.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button onClick={() => handleChangeRole('admin')} className={`p-3 rounded-lg text-sm font-bold border ${currentRole === 'admin' ? 'bg-blue-600 border-blue-400' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
            PASTOR (Total)
          </button>
          <button onClick={() => handleChangeRole('treasurer')} className={`p-3 rounded-lg text-sm font-bold border ${currentRole === 'treasurer' ? 'bg-green-600 border-green-400' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
            TESOUREIRO
          </button>
          <button onClick={() => handleChangeRole('leader')} className={`p-3 rounded-lg text-sm font-bold border ${currentRole === 'leader' ? 'bg-purple-600 border-purple-400' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
            LÍDER
          </button>
          <button onClick={() => handleChangeRole('member')} className={`p-3 rounded-lg text-sm font-bold border ${currentRole === 'member' ? 'bg-gray-600 border-gray-400' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
            MEMBRO COMUM
          </button>
        </div>
      </div>

    </div>
  );
}