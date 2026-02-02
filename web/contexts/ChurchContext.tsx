"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

interface ChurchContextData {
  user: User | null;
  churchId: string | null;
  churchName: string | null;
  userRole: string | null;
  userPermissions: string[]; 
  userName: string | null;
  loading: boolean;
  logoUrl: string | null;
  currency: string;
  formatMoney: (value: number) => string;
  // AJUSTE: Agora aceitamos "string | null" para parar o erro no Settings
  setChurchData: (id: string | null, name: string | null, role: string | null, userName: string | null, logoUrl: string | null, currency: string) => void;
  hasPermission: (permission: string) => boolean; 
}

const ChurchContext = createContext<ChurchContextData>({} as ChurchContextData);

export function ChurchProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [churchId, setChurchId] = useState<string | null>(null);
  const [churchName, setChurchName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]); 
  const [userName, setUserName] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [currency, setCurrency] = useState("AO");
  const [loading, setLoading] = useState(true);

  const hasPermission = (permission: string) => {
    if (userRole === 'admin') return true; 
    return userPermissions.includes(permission);
  };

  // AJUSTE: Aceitamos nulos e só salvamos no localStorage se tiver valor
  const setChurchData = (id: string | null, name: string | null, role: string | null, uName: string | null, logo: string | null, curr: string) => {
    setChurchId(id);
    setChurchName(name);
    setUserRole(role);
    setUserName(uName);
    setLogoUrl(logo);
    setCurrency(curr);
    
    if (id) localStorage.setItem("churchId", id);
    if (name) localStorage.setItem("churchName", name);
    if (role) localStorage.setItem("userRole", role);
    if (uName) localStorage.setItem("userName", uName);
    if (logo) localStorage.setItem("churchLogo", logo);
    if (curr) localStorage.setItem("churchCurrency", curr);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const storedId = localStorage.getItem("churchId");
        if (storedId) {
            setChurchId(storedId);
            setChurchName(localStorage.getItem("churchName"));
            setUserRole(localStorage.getItem("userRole"));
            setUserName(localStorage.getItem("userName"));
            setLogoUrl(localStorage.getItem("churchLogo"));
            setCurrency(localStorage.getItem("churchCurrency") || "AO");
        }

        try {
            const userDocRef = doc(db, "members", currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
                const data = userDocSnap.data();
                setUserPermissions(data.permissions || []); 
                if (data.role) setUserRole(data.role); 
                if (data.currency) setCurrency(data.currency);
            } else {
                const q = query(collection(db, "members"), where("email", "==", currentUser.email));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const data = querySnapshot.docs[0].data();
                    setUserPermissions(data.permissions || []);
                    if (data.role) setUserRole(data.role);
                }
            }
        } catch (error) {
            console.error("Erro ao carregar permissões:", error);
        }

      } else {
        setChurchId(null);
        setChurchName(null);
        setUserRole(null);
        setUserPermissions([]);
        setUserName(null);
        localStorage.clear();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat(currency === 'BR' ? "pt-BR" : "pt-AO", {
      style: "currency",
      currency: currency === 'BR' ? "BRL" : "AOA",
    }).format(value);
  };

  return (
    <ChurchContext.Provider value={{ 
        user, churchId, churchName, userRole, userName, loading, logoUrl, currency,
        formatMoney, setChurchData, userPermissions, hasPermission
    }}>
      {children}
    </ChurchContext.Provider>
  );
}

export const useChurch = () => useContext(ChurchContext);