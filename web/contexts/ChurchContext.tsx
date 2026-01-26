"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type ChurchSettings = {
  currency: 'BRL' | 'AOA';
};

interface ChurchContextType {
  settings: ChurchSettings;
  updateSettings: (newSettings: Partial<ChurchSettings>) => void;
  formatMoney: (value: number | string) => string;
}

const defaultSettings: ChurchSettings = {
  currency: 'BRL'
};

const ChurchContext = createContext<ChurchContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  formatMoney: (val) => String(val)
});

export function ChurchProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ChurchSettings>(defaultSettings);
  
  // Carrega configuração ao iniciar
  useEffect(() => {
    const saved = localStorage.getItem("churchSettings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Erro config", e);
      }
    }
  }, []);

  const updateSettings = (newSettings: Partial<ChurchSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem("churchSettings", JSON.stringify(updated));
      return updated;
    });
  };

  // --- FORMATAÇÃO BLINDADA ---
  const formatMoney = (value: number | string) => {
    // 1. Garante que é número
    const num = Number(value);
    if (isNaN(num)) return "0,00";

    // 2. Se for Kwanza (Angola)
    if (settings.currency === 'AOA') {
      // Converte para texto com 2 casas decimais (ex: "5000.00")
      // Troca ponto por vírgula (ex: "5000,00")
      // Adiciona ponto de milhar usando Regex
      const parts = num.toFixed(2).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return `Kz ${parts.join(',')}`;
    }

    // 3. Se for Real (Brasil)
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(num);
  };

  return (
    <ChurchContext.Provider value={{ settings, updateSettings, formatMoney }}>
      {children}
    </ChurchContext.Provider>
  );
}

export const useChurch = () => useContext(ChurchContext);