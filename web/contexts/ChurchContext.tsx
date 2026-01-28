"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Definindo o que o contexto vai ter
interface ChurchContextData {
  churchId: string;
  setChurchId: (id: string) => void;
  churchName: string;
  userName: string;
  userRole: string;
  formatMoney: (value: number) => string;
}

const ChurchContext = createContext<ChurchContextData>({} as ChurchContextData);

export function ChurchProvider({ children }: { children: ReactNode }) {
  const [churchId, setChurchId] = useState("");
  const [churchName, setChurchName] = useState("Minha Igreja");
  const [userName, setUserName] = useState("Visitante"); // Valor padrão
  const [userRole, setUserRole] = useState("member");

  useEffect(() => {
    // Carrega dados salvos ao abrir o site
    if (typeof window !== "undefined") {
      const id = localStorage.getItem("churchId");
      const name = localStorage.getItem("churchName");
      const role = localStorage.getItem("userRole");
      const user = localStorage.getItem("userName"); // Vamos garantir que o Login salve isso

      if (id) setChurchId(id);
      if (name) setChurchName(name);
      if (role) setUserRole(role);
      if (user) setUserName(user);
    }
  }, []);

  // Função auxiliar para formatar dinheiro (R$)
  const formatMoney = (value: number) => {
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
        formatMoney 
    }}>
      {children}
    </ChurchContext.Provider>
  );
}

export const useChurch = () => useContext(ChurchContext);