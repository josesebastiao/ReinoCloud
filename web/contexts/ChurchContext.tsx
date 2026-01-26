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

// VALOR PADRÃO DE SEGURANÇA (Caso o Provider falhe)
// Agora ele formata como R$ por padrão, em vez de mostrar número cru
const defaultSettings: ChurchSettings = { currency: 'BRL' };

const ChurchContext = createContext<ChurchContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  formatMoney: (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
  }
});

export function ChurchProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ChurchSettings>(defaultSettings);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  const formatMoney = (value: number | string) => {
    // Se o componente ainda não montou, evita erro de hidratação
    if (!mounted) return "...";

    const num = Number(value);
    if (isNaN(num)) return "0,00";

    // --- LÓGICA DO KWANZA (ANGOLA) ---
    if (settings.currency === 'AOA') {
      // Formata manual: 5000.50 -> "5.000,50"
      const parts = num.toFixed(2).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return `Kz ${parts.join(',')}`;
    }

    // --- LÓGICA DO REAL (BRASIL) ---
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