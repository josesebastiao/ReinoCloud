"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useRouter } from "next/navigation"; // Adicionei para o Logout funcionar bem

interface ChurchContextData {
  user: User | null; // Mudei de 'any' para 'User | null' para o TypeScript ajudar
  churchId: string;
  churchName: string;
  userRole: string;
  userName: string;
  logoUrl: string;
  currency: string;
  loading: boolean; // <--- Novo: Ajuda as páginas a saberem se ainda está carregando
  formatMoney: (value: number) => string;
  setChurchData: (id: string, name: string, role: string, userName: string, logo?: string, currency?: string) => void;
  signOutUser: () => void; // <--- Novo: Função para deslogar e limpar memória
}

const ChurchContext = createContext({} as ChurchContextData);

export function ChurchProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  
  // Estados
  const [user, setUser] = useState<User | null>(null);
  const [churchId, setChurchId] = useState("");
  const [churchName, setChurchName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [currency, setCurrency] = useState("AO");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Monitora o Login do Firebase
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // 2. Se tem usuário, tenta recuperar dados salvos no navegador (Cache)
        if (typeof window !== 'undefined') {
            const storedId = localStorage.getItem("churchId");
            const storedName = localStorage.getItem("churchName");
            const storedRole = localStorage.getItem("userRole");
            const storedUser = localStorage.getItem("userName");
            
            // --- AQUI ESTÁ A CORREÇÃO DA LOGO SUMINDO ---
            const storedLogo = localStorage.getItem("churchLogo"); 
            const storedCurrency = localStorage.getItem("churchCurrency");

            if (storedId) setChurchId(storedId);
            if (storedName) setChurchName(storedName);
            if (storedRole) setUserRole(storedRole);
            if (storedUser) setUserName(storedUser);
            if (storedLogo) setLogoUrl(storedLogo); // Recupera a logo!
            if (storedCurrency) setCurrency(storedCurrency);
        }
      } else {
        // Se deslogou, zera tudo no estado (Visual)
        setChurchId("");
        setChurchName("");
        setUserRole("");
        setLogoUrl("");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Função chamada no Login e no Settings
  const setChurchData = (id: string, name: string, role: string, uName: string, logo: string = "", curr: string = "AO") => {
    // Atualiza o Estado (React)
    setChurchId(id);
    setChurchName(name);
    setUserRole(role);
    setUserName(uName);
    setLogoUrl(logo);
    setCurrency(curr);

    // Salva no Navegador (Persistência)
    if (typeof window !== 'undefined') {
        localStorage.setItem("churchId", id);
        localStorage.setItem("churchName", name);
        localStorage.setItem("userRole", role);
        localStorage.setItem("userName", uName);
        
        // --- GRAVA A LOGO E MOEDA PARA NÃO PERDER NO F5 ---
        if(logo) localStorage.setItem("churchLogo", logo);
        else localStorage.removeItem("churchLogo");
        
        if(curr) localStorage.setItem("churchCurrency", curr);
    }
  };

  // Função Nova: Logout limpo
  const signOutUser = async () => {
      try {
          await auth.signOut();
          // Limpa Estados
          setChurchId("");
          setChurchName("");
          setUserRole("");
          setLogoUrl("");
          
          // Limpa Memória do Navegador
          localStorage.removeItem("churchId");
          localStorage.removeItem("churchName");
          localStorage.removeItem("userRole");
          localStorage.removeItem("userName");
          localStorage.removeItem("churchLogo");
          localStorage.removeItem("churchCurrency");
          
          router.push("/login");
      } catch (error) {
          console.error("Erro ao sair", error);
      }
  };

  const formatMoney = (value: number) => {
      if (value === undefined || value === null) return "0,00";
      return new Intl.NumberFormat(currency === 'BR' ? 'pt-BR' : 'pt-AO', {
          style: 'currency',
          currency: currency === 'BR' ? 'BRL' : 'AOA',
      }).format(value);
  };

  return (
    <ChurchContext.Provider value={{ 
        user, churchId, churchName, userRole, userName, logoUrl, currency, 
        loading, formatMoney, setChurchData, signOutUser 
    }}>
      {children}
    </ChurchContext.Provider>
  );
}

export const useChurch = () => useContext(ChurchContext);