"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Definindo o que o contexto vai ter
interface ChurchContextData {
  churchId: string;
  setChurchId: (id: string) => void;
  churchName: string;
  userName: string;
  userRole: string;
  currency: string;
  // AQUI ESTAVA FALTANDO:
  updateSettings: (data: { churchName?: string; currency?: string }) => void;
  formatMoney: (value: number) => string;
}

const ChurchContext = createContext<ChurchContextData>({} as ChurchContextData);

export function ChurchProvider({ children }: { children: ReactNode }) {
  const [churchId, setChurchId] = useState("");
  const [churchName, setChurchName] = useState("Minha Igreja");
  const [userName, setUserName] = useState("Visitante");
  const [userRole, setUserRole] = useState("member");
  const [currency, setCurrency] = useState("BRL"); // Padrão Brasil

  useEffect(() => {
    if (typeof window !== "undefined") {
      const id = localStorage.getItem("churchId");
      const name = localStorage.getItem("churchName");
      const role = localStorage.getItem("userRole");
      const user = localStorage.getItem("userName");
      const curr = localStorage.getItem("currency");

      if (id) setChurchId(id);
      if (name) setChurchName(name);
      if (role) setUserRole(role);
      if (user) setUserName(user);
      if (curr) setCurrency(curr);
    }
  }, []);

  // --- FUNÇÃO QUE FALTAVA (Correção do Erro) ---
  const updateSettings = (data: { churchName?: string; currency?: string }) => {
    if (data.churchName) {
      setChurchName(data.churchName);
      localStorage.setItem("churchName", data.churchName);
    }
    if (data.currency) {
      setCurrency(data.currency);
      localStorage.setItem("currency", data.currency);
    }
  };

  // Formatador Inteligente (Brasil ou Angola)
  const formatMoney = (value: number) => {
    // Se for Kwanza (Angola), a formatação é um pouco diferente
    if (currency === 'AOA') {
      return new Intl.NumberFormat('pt-AO', {
        style: 'currency',
        currency: 'AOA'
      }).format(value);
    }

    // Padrão Brasil
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <ChurchContext.Provider value={{ 
        churchId, 
        setChurchId, 
        churchName, 
        userName, 
        userRole, 
        currency,
        updateSettings, // Agora ela existe!
        formatMoney 
    }}>
      {children}
    </ChurchContext.Provider>
  );
}

export const useChurch = () => useContext(ChurchContext);