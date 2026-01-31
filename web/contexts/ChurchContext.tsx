"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface ChurchContextData {
  user: User | null;
  churchId: string;
  churchName: string;
  userRole: string;
  userName: string;
  logoUrl: string;
  currency: string;
  loading: boolean;
  formatMoney: (value: number) => string;
  setChurchData: (id: string, name: string, role: string, userName: string, logo?: string, currency?: string) => void;
  signOutUser: () => void;
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

  // --- FUNÇÃO DE AUTO-RESGATE (Se o localStorage falhar) ---
  const fetchMemberData = async (currentUser: User) => {
    try {
        // Se for o Super Admin (Bypass)
        if (currentUser.email === "alfaministro1@gmail.com" || currentUser.email === "alfaministro1@hotmail.com") {
             setChurchData("master_admin", "ReinoCloud HQ", "admin", "Super Admin", "", "AO");
             return true;
        }

        const q = query(collection(db, "members"), where("email", "==", currentUser.email));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const memberData = snapshot.docs[0].data();
            const foundChurchId = memberData.churchId;
            
            if (foundChurchId) {
                const churchSnap = await getDoc(doc(db, "churches", foundChurchId));
                if (churchSnap.exists()) {
                    const churchData = churchSnap.data();
                    
                    // Salva tudo e recupera o dia
                    setChurchData(
                        foundChurchId,
                        churchData.name || "Igreja",
                        memberData.role || "member",
                        memberData.fullName || "Usuário",
                        churchData.logoUrl || "",
                        churchData.currency || "AO"
                    );
                    return true;
                }
            }
        }
        return false;
    } catch (error) {
        console.error("Erro Auto-Discovery:", error);
        return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Tenta recuperar do localStorage (Cache)
        if (typeof window !== 'undefined') {
            const storedId = localStorage.getItem("churchId");
            const storedLogo = localStorage.getItem("churchLogo"); // <--- AQUI ESTÁ A CORREÇÃO DA LOGO
            const storedCurrency = localStorage.getItem("churchCurrency");

            if (storedId) {
                setChurchId(storedId);
                setChurchName(localStorage.getItem("churchName") || "");
                setUserRole(localStorage.getItem("userRole") || "");
                setUserName(localStorage.getItem("userName") || "");
                
                if (storedLogo) setLogoUrl(storedLogo); // <--- RECUPERA LOGO
                if (storedCurrency) setCurrency(storedCurrency);
                
                setLoading(false);
            } else {
                // Se cache vazio, busca no banco
                await fetchMemberData(currentUser);
                setLoading(false);
            }
        }
      } else {
        // Deslogado: Limpa Estados
        setChurchId("");
        setChurchName("");
        setUserRole("");
        setLogoUrl("");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const setChurchData = (id: string, name: string, role: string, uName: string, logo: string = "", curr: string = "AO") => {
    setChurchId(id);
    setChurchName(name);
    setUserRole(role);
    setUserName(uName);
    setLogoUrl(logo);
    setCurrency(curr);

    // Salva no LocalStorage (Persistência)
    if (typeof window !== 'undefined') {
        localStorage.setItem("churchId", id);
        localStorage.setItem("churchName", name);
        localStorage.setItem("userRole", role);
        localStorage.setItem("userName", uName);
        
        // --- GRAVA A LOGO PARA NÃO PERDER NO F5 ---
        if(logo) localStorage.setItem("churchLogo", logo);
        else localStorage.removeItem("churchLogo");

        if(curr) localStorage.setItem("churchCurrency", curr);
    }
  };

  const signOutUser = async () => {
      try {
          await auth.signOut();
          
          // Limpa Estados React
          setUser(null);
          setChurchId("");
          setChurchName("");
          setUserRole("");
          setLogoUrl("");
          
          // --- LIMPEZA PROFUNDA DA MEMÓRIA ---
          // Isso garante que o Sidebar não ache que você é Super Admin
          if (typeof window !== 'undefined') {
            localStorage.clear(); 
          }
          
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