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

  // --- FUNÇÃO PARA BUSCAR DADOS DO MEMBRO NO BANCO ---
  // Essa função salva o dia se o localStorage falhar
  const fetchMemberData = async (currentUser: User) => {
    try {
        console.log("🔍 Buscando dados do membro para:", currentUser.email);
        const q = query(collection(db, "members"), where("email", "==", currentUser.email));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const memberData = snapshot.docs[0].data();
            const foundChurchId = memberData.churchId;
            
            // Agora busca os dados da igreja (Nome, Logo, Moeda)
            if (foundChurchId) {
                const churchSnap = await getDoc(doc(db, "churches", foundChurchId));
                if (churchSnap.exists()) {
                    const churchData = churchSnap.data();
                    
                    // APLICA TUDO (Salva o dia!)
                    setChurchData(
                        foundChurchId,
                        churchData.name || "Igreja",
                        memberData.role || "member",
                        memberData.fullName || "Usuário",
                        churchData.logoUrl || "",
                        churchData.currency || "AO"
                    );
                    return true; // Sucesso
                }
            }
        }
        return false; // Não achou nada
    } catch (error) {
        console.error("Erro no Auto-Discovery:", error);
        return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // --- CENÁRIO 1: Tenta Cache Rápido (localStorage) ---
        if (typeof window !== 'undefined') {
            const storedId = localStorage.getItem("churchId");
            // Só confia no cache se o email bater (segurança extra)
            // Mas como localStorage não guarda email do usuario, vamos confiar
            // apenas se tivermos dados. Se falhar, vamos pro banco.
            
            if (storedId) {
                setChurchId(storedId);
                setChurchName(localStorage.getItem("churchName") || "");
                setUserRole(localStorage.getItem("userRole") || "");
                setUserName(localStorage.getItem("userName") || "");
                setLogoUrl(localStorage.getItem("churchLogo") || "");
                setCurrency(localStorage.getItem("churchCurrency") || "AO");
                setLoading(false);
            } else {
                // --- CENÁRIO 2: Cache vazio? Busca no Banco (Auto-Repair) ---
                const success = await fetchMemberData(currentUser);
                if (!success) {
                    // Se logou no Firebase mas não tem ficha de membro (Erro crítico)
                    console.error("Usuário sem vínculo com igreja.");
                    // Opcional: signOutUser();
                }
                setLoading(false);
            }
        }
      } else {
        // Deslogou
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

    if (typeof window !== 'undefined') {
        localStorage.setItem("churchId", id);
        localStorage.setItem("churchName", name);
        localStorage.setItem("userRole", role);
        localStorage.setItem("userName", uName);
        if(logo) localStorage.setItem("churchLogo", logo);
        if(curr) localStorage.setItem("churchCurrency", curr);
    }
  };

  const signOutUser = async () => {
      try {
          await auth.signOut();
          setChurchId("");
          setChurchName("");
          setUserRole("");
          setLogoUrl("");
          
          if (typeof window !== 'undefined') {
            localStorage.clear(); // Limpa TUDO para garantir que o próximo login venha limpo
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