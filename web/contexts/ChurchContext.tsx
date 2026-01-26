"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type ChurchSettings = {
  currency: 'BRL' | 'AOA';
};

interface ChurchContextType {
  settings: ChurchSettings;
  updateSettings: (newSettings: Partial<ChurchSettings>) => void;
  formatMoney: (value: number) => string;
}

// Configuração Padrão
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Tenta carregar do Cache (LocalStorage) ao iniciar
    const saved = localStorage.getItem("churchSettings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao ler cache", e);
      }
    }
  }, []);

  const updateSettings = (newSettings: Partial<ChurchSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      // Grava no Cache imediatamente
      localStorage.setItem("churchSettings", JSON.stringify(updated));
      return updated;
    });
  };

  const formatMoney = (value: number) => {
    if (!mounted) return "...";

    // --- CORREÇÃO AQUI: Formatação Manual Garantida ---
    
    if (settings.currency === 'AOA') {
      // Angola: Kz 5.000,00 (Forçamos o 'Kz' manualmente)
      return `Kz ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Brasil: R$ 5.000,00 (Padrão nativo)
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  return (
    <ChurchContext.Provider value={{ settings, updateSettings, formatMoney }}>
      {children}
    </ChurchContext.Provider>
  );
}

export const useChurch = () => useContext(ChurchContext);