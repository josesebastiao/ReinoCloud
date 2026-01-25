"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type ChurchSettings = {
  currency: 'BRL' | 'AOA';
  ministryLabel: 'Ministérios' | 'Departamentos';
};

interface ChurchContextType {
  settings: ChurchSettings;
  updateSettings: (newSettings: Partial<ChurchSettings>) => void;
  formatMoney: (value: number) => string;
}

const ChurchContext = createContext<ChurchContextType>({} as ChurchContextType);

export function ChurchProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ChurchSettings>({
    currency: 'BRL',
    ministryLabel: 'Ministérios'
  });

  useEffect(() => {
    // Carrega configuração salva no navegador
    const saved = localStorage.getItem("churchSettings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const updateSettings = (newSettings: Partial<ChurchSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem("churchSettings", JSON.stringify(updated));
  };

  const formatMoney = (value: number) => {
    // Se for Kz (Angola), geralmente não usa centavos ou usa vírgula diferente
    // Aqui usamos o padrão pt-AO para Angola e pt-BR para Brasil
    const locale = settings.currency === 'AOA' ? 'pt-AO' : 'pt-BR';
    const currency = settings.currency;
    
    return new Intl.NumberFormat(locale, { 
      style: 'currency', 
      currency: currency,
      minimumFractionDigits: 2 
    }).format(value);
  };

  return (
    <ChurchContext.Provider value={{ settings, updateSettings, formatMoney }}>
      {children}
    </ChurchContext.Provider>
  );
}

export const useChurch = () => useContext(ChurchContext);