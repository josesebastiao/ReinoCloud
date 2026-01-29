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
  
  // Estados Globais
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
        let currentIdToListen = "";

        // --- 1. IDENTIFICAR USUÁRIO ---
        if (currentUser.email === "alfaministro1@gmail.com") {
             // É O CHEFE (ADMIN)
             console.log("👑 Super Admin Detectado");
             setChurchId("master_admin");
             currentIdToListen = "master_admin"; 
             setUserRole("admin");
             setUserName("Super Admin");

             // Garante que o documento 'master_admin' existe para não dar erro
             const masterRef = doc(db, "churches", "master_admin");
             getDoc(masterRef).then((snap) => {
                 if(!snap.exists()) {
                     setDoc(masterRef, { name: "ReinoCloud HQ", currency: "BR" });
                 }
             });

        } else {
             // É UM CLIENTE (IGREJA)
             try {
                const userSnap = await getDoc(doc(db, "members", currentUser.uid));
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    setChurchId(userData.churchId);
                    currentIdToListen = userData.churchId; // Define qual ID vamos escutar
                    setUserRole(userData.role || "member");
                    setUserName(userData.fullName || "Usuário");
                }
             } catch (e) { console.error(e); }
        }

        // --- 2. ESCUTAR MUDANÇAS EM TEMPO REAL (Seja Admin ou Igreja) ---
        if (currentIdToListen) {
            unsubscribeChurch = onSnapshot(doc(db, "churches", currentIdToListen), (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    
                    // Atualiza estados imediatamente quando salva no Settings
                    setChurchName(data.name || "Minha Igreja");
                    setLogoUrl(data.logoUrl || "");
                    setCurrency(data.currency || "AO"); 
                    
                    console.log("🔄 Dados atualizados via Contexto:", data.name);
                }
            });
        }

      } else {
        // Logout
        setChurchId("");
        setChurchName("");
        setUserRole("member");
        setCurrency("AO");
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

  // --- FORMATAÇÃO INTELIGENTE (Aceita BR/BRL/R$) ---
  const formatMoney = (value: number) => {
    // Se for Brasil
    if (currency === 'BR' || currency === 'BRL') {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    } 
    // Se for Angola (Padrão)
    else {
        return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' })
               .format(value)
               .replace('AOA', 'Kz');
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