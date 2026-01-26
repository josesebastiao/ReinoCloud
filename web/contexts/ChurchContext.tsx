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

// Valor padrão inicial
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
  // Inicializa com o padrão
  const [settings, setSettings] = useState<ChurchSettings>(defaultSettings);
  const [mounted, setMounted] = useState(false);

  // 1. Carrega do LocalStorage assim que a tela abre
  useEffect(() => {
    setMounted(true); // Indica que o componente montou
    const saved = localStorage.getItem("churchSettings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar config", e);
      }
    }
  }, []);

  // 2. Função Poderosa para Atualizar e Salvar
  const updateSettings = (newSettings: Partial<ChurchSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem("churchSettings", JSON.stringify(updated));
      return updated; // Isso força o React a atualizar a tela NA HORA
    });
  };

  const formatMoney = (value: number) => {
    // Se ainda não montou (SSR), usa um fallback simples
    if (!mounted) return `... ${value}`;

    const locale = settings.currency === 'AOA' ? 'pt-AO' : 'pt-BR';
    const currency = settings.currency;
    
    try {
      return new Intl.NumberFormat(locale, { 
        style: 'currency', 
        currency: currency,
        minimumFractionDigits: 2 
      }).format(value);
    } catch (error) {
      return `${currency} ${value}`;
    }
  };

  return (
    <ChurchContext.Provider value={{ settings, updateSettings, formatMoney }}>
      {children}
    </ChurchContext.Provider>
  );
}

export const useChurch = () => useContext(ChurchContext);