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

// Valores padrão (Brasil) para evitar erro de Build
const defaultSettings: ChurchSettings = {
  currency: 'BRL',
  ministryLabel: 'Ministérios'
};

const ChurchContext = createContext<ChurchContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  formatMoney: (val) => String(val)
});

export function ChurchProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ChurchSettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false); // Para evitar salvar BRL em cima do AOA no inicio

  useEffect(() => {
    // 1. Ao abrir o site, tenta ler do LocalStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("churchSettings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log("📂 Configuração Carregada:", parsed);
          setSettings(parsed);
        } catch (e) {
          console.error("Erro ao ler configuração", e);
        }
      }
      setLoaded(true);
    }
  }, []);

  const updateSettings = (newSettings: Partial<ChurchSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    // Salva no navegador
    if (typeof window !== "undefined") {
      localStorage.setItem("churchSettings", JSON.stringify(updated));
      console.log("💾 Configuração Salva:", updated);
    }
  };

  const formatMoney = (value: number) => {
    // Se ainda não carregou a config, usa o padrão do estado atual
    const locale = settings.currency === 'AOA' ? 'pt-AO' : 'pt-BR';
    const currency = settings.currency;
    
    try {
      return new Intl.NumberFormat(locale, { 
        style: 'currency', 
        currency: currency,
        minimumFractionDigits: 2 
      }).format(value);
    } catch (error) {
      return `${currency} ${value}`; // Fallback se der erro no Intl
    }
  };

  return (
    <ChurchContext.Provider value={{ settings, updateSettings, formatMoney }}>
      {children}
    </ChurchContext.Provider>
  );
}

export const useChurch = () => useContext(ChurchContext);