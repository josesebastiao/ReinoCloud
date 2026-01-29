"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore"; 

interface ChurchContextType {
  user: User | null;
  loading: boolean;
  churchId: string;
  churchName: string;
  userRole: string;
  userName: string;
  currency: string;
  logoUrl: string;
  formatMoney: (value: number) => string;
}

const ChurchContext = createContext<ChurchContextType>({} as ChurchContextType);

export function ChurchProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Dados
  const [churchId, setChurchId] = useState("");
  const [churchName, setChurchName] = useState("");
  const [userRole, setUserRole] = useState("member");
  const [userName, setUserName] = useState("");
  const [currency, setCurrency] = useState("AO"); 
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    let unsubscribeChurch: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // --- AQUI ESTÁ A MÁGICA: MODO DEUS ---
        if(currentUser.email === "alfaministro1@gmail.com") {
             console.log("👑 Contexto: Super Admin Detectado");
             setChurchId("master_admin");
             setChurchName("ReinoCloud HQ (Super Admin)");
             setUserRole("admin"); // Papel máximo
             setUserName("Sebastião (CEO)");
             setCurrency("BR"); // Ou AO, como preferir
             setLoading(false);
             return; // Sai da função, não busca no banco
        }
        // -------------------------------------

        try {
          const userDocRef = doc(db, "members", currentUser.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            setChurchId(userData.churchId);
            setUserRole(userData.role || "member");
            setUserName(userData.fullName || "Usuário");

            if (userData.churchId) {
                // Escuta mudanças na igreja em tempo real
                unsubscribeChurch = onSnapshot(doc(db, "churches", userData.churchId), (docSnap) => {
                    if (docSnap.exists()) {
                        const churchData = docSnap.data();
                        setChurchName(churchData.name || "Minha Igreja");
                        setCurrency(churchData.currency || "AO");
                        setLogoUrl(churchData.logoUrl || "");
                    }
                });
            }
          }
        } catch (error) {
          console.error("Erro ao carregar contexto:", error);
        }
      } else {
        // Logout
        setChurchId("");
        setChurchName("");
        setUserRole("member");
      }
      setLoading(false);
    });

    return () => {
        unsubscribeAuth();
        if (unsubscribeChurch) unsubscribeChurch();
    };
  }, []);

  const formatMoney = (value: number) => {
    if (currency === 'BR') {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    } else {
        return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value).replace('AOA', 'Kz');
    }
  };

  return (
    <ChurchContext.Provider value={{ 
        user, loading, churchId, churchName, userRole, userName,
        currency, logoUrl, formatMoney
    }}>
      {children}
    </ChurchContext.Provider>
  );
}

export const useChurch = () => useContext(ChurchContext);