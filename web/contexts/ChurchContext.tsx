"use client"; // <--- ISSO É OBRIGATÓRIO NA 1ª LINHA
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

interface ChurchContextData {
  churchId: string;
  churchName: string;
  userRole: string;
  userName: string;
  user: any;
  logoUrl: string;
  currency: string;
  formatMoney: (value: number) => string;
  setChurchData: (id: string, name: string, role: string, userName: string, logo?: string, currency?: string) => void;
}

const ChurchContext = createContext({} as ChurchContextData);

export function ChurchProvider({ children }: { children: ReactNode }) {
  // Inicializa tudo vazio para não quebrar no Servidor (Build)
  const [churchId, setChurchIdState] = useState("");
  const [churchName, setChurchNameState] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [currency, setCurrency] = useState("AO"); // Padrão AO
  const [user, setUser] = useState<any>(null);

  // Efeito único para carregar do localStorage apenas no Cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const storedId = localStorage.getItem("churchId");
        const storedName = localStorage.getItem("churchName");
        const storedRole = localStorage.getItem("userRole");
        const storedUser = localStorage.getItem("userName");
        
        if (storedId) setChurchIdState(storedId);
        if (storedName) setChurchNameState(storedName);
        if (storedRole) setUserRole(storedRole);
        if (storedUser) setUserName(storedUser);
    }

    // Monitora autenticação do Firebase
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        if (!currentUser) {
            // Se deslogou, limpa tudo (opcional)
            // localStorage.clear(); 
        }
    });

    return () => unsubscribe();
  }, []);

  const setChurchData = (id: string, name: string, role: string, uName: string, logo: string = "", curr: string = "AO") => {
    setChurchIdState(id);
    setChurchNameState(name);
    setUserRole(role);
    setUserName(uName);
    setLogoUrl(logo);
    setCurrency(curr);

    if (typeof window !== 'undefined') {
        localStorage.setItem("churchId", id);
        localStorage.setItem("churchName", name);
        localStorage.setItem("userRole", role);
        localStorage.setItem("userName", uName);
    }
  };

  const formatMoney = (value: number) => {
      // Evita erro se o valor for nulo
      if (value === undefined || value === null) return "0,00";
      
      return new Intl.NumberFormat(currency === 'BR' ? 'pt-BR' : 'pt-AO', {
          style: 'currency',
          currency: currency === 'BR' ? 'BRL' : 'AOA',
      }).format(value);
  };

  return (
    <ChurchContext.Provider value={{ 
        churchId, 
        churchName, 
        userRole, 
        userName, 
        user,
        logoUrl,
        currency,
        formatMoney,
        setChurchData 
    }}>
      {children}
    </ChurchContext.Provider>
  );
}

export const useChurch = () => useContext(ChurchContext);