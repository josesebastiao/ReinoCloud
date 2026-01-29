"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";

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
  updateSettings: (data: { currency?: string; name?: string; logoUrl?: string }) => Promise<void>;
}

const ChurchContext = createContext<ChurchContextType>({} as ChurchContextType);

export function ChurchProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
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
        let currentChurchId = "";

        // 1. IDENTIFICAR SE É SUPER ADMIN OU MEMBRO COMUM
        if (currentUser.email === "alfaministro1@gmail.com") {
             console.log("👑 Super Admin Logado");
             currentChurchId = "master_admin";
             setChurchId("master_admin");
             setUserRole("admin");
             setUserName("Super Admin");
             
             // Garante que o documento da igreja master existe no banco
             const masterRef = doc(db, "churches", "master_admin");
             getDoc(masterRef).then((snap) => {
                if(!snap.exists()) {
                    setDoc(masterRef, { name: "ReinoCloud HQ", currency: "BR" });
                }
             });

        } else {
             // Membro normal: Busca ID no cadastro de membros
             try {
                const userSnap = await getDoc(doc(db, "members", currentUser.uid));
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    currentChurchId = userData.churchId;
                    setChurchId(userData.churchId);
                    setUserRole(userData.role || "member");
                    setUserName(userData.fullName || "Usuário");
                }
             } catch (e) { console.error(e); }
        }

        // 2. ESCUTAR MUDANÇAS DA IGREJA EM TEMPO REAL (Para todos)
        if (currentChurchId) {
            unsubscribeChurch = onSnapshot(doc(db, "churches", currentChurchId), (docSnap) => {
                if (docSnap.exists()) {
                    const churchData = docSnap.data();
                    // AQUI ESTÁ A CORREÇÃO: Atualiza o nome sempre que o banco mudar
                    setChurchName(churchData.name || "Minha Igreja");
                    setLogoUrl(churchData.logoUrl || "");
                    setCurrency(churchData.currency || "AO");
                }
            });
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

  const updateSettings = async (data: any) => {
      if (!churchId) return;
      await updateDoc(doc(db, "churches", churchId), data);
  };

  const formatMoney = (value: number) => {
    if (currency === 'BR' || currency === 'BRL') {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    } else {
        return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value).replace('AOA', 'Kz');
    }
  };

  return (
    <ChurchContext.Provider value={{ 
        user, loading, churchId, churchName, userRole, userName,
        currency, logoUrl, formatMoney, updateSettings
    }}>
      {children}
    </ChurchContext.Provider>
  );
}

export const useChurch = () => useContext(ChurchContext);