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

// 1. CRIAMOS UM VALOR PADRÃO SEGURO (Isso evita o erro no build)
const defaultSettings: ChurchSettings = {
  currency: 'BRL',
  ministryLabel: 'Ministérios'
};

// 2. PASSAMOS ESSE VALOR PARA O CONTEXTO (Em vez de {} vazio)
const ChurchContext = createContext<ChurchContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  formatMoney: (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
});

export function ChurchProvider({ children }: { children: ReactNode }) {
  // Inicializamos o estado com o padrão seguro
  const [settings, setSettings] = useState<ChurchSettings>(defaultSettings);

  useEffect(() => {
    // Tenta carregar do navegador apenas no cliente
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("churchSettings");
      if (saved) {
        try {
          setSettings(JSON.parse(saved));
        } catch (e) {
          console.error("Erro ao ler configurações salvas", e);
        }
      }
    }
  }, []);

  const updateSettings = (newSettings: Partial<ChurchSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem("churchSettings", JSON.stringify(updated));
  };

  const formatMoney = (value: number) => {
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