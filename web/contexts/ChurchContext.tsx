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
  signatureUrl: string | null; // <--- NOVO
  currency: string;
  formatMoney: (value: number) => string;
  // Atualizei para receber signature
  setChurchData: (id: string | null, name: string | null, role: string | null, userName: string | null, logoUrl: string | null, signatureUrl: string | null, currency: string) => void;
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
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null); // <--- NOVO
  const [currency, setCurrency] = useState("AO");
  const [loading, setLoading] = useState(true);

  const hasPermission = (permission: string) => {
    if (userRole === 'admin') return true; 
    return userPermissions.includes(permission);
  };

  const setChurchData = (id: string | null, name: string | null, role: string | null, uName: string | null, logo: string | null, signature: string | null, curr: string) => {
    setChurchId(id);
    setChurchName(name);
    setUserRole(role);
    setUserName(uName);
    setLogoUrl(logo);
    setSignatureUrl(signature); // <--- NOVO
    setCurrency(curr);
    
    if (id) localStorage.setItem("churchId", id);
    if (name) localStorage.setItem("churchName", name);
    if (role) localStorage.setItem("userRole", role);
    if (uName) localStorage.setItem("userName", uName);
    if (logo) localStorage.setItem("churchLogo", logo);
    if (signature) localStorage.setItem("churchSignature", signature); // <--- NOVO
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
            setSignatureUrl(localStorage.getItem("churchSignature")); // <--- NOVO
            setCurrency(localStorage.getItem("churchCurrency") || "AO");
        }

        try {
            // Tenta buscar como membro primeiro (comum)
            const q = query(collection(db, "members"), where("email", "==", currentUser.email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const data = querySnapshot.docs[0].data();
                setUserPermissions(data.permissions || []);
                if (data.role) setUserRole(data.role);
            } else {
                // Se não achou em members, pode ser o Admin (dono da igreja) na coleção churches
                const churchDocRef = doc(db, "churches", currentUser.uid);
                const churchDocSnap = await getDoc(churchDocRef);
                if (churchDocSnap.exists()) {
                    const data = churchDocSnap.data();
                    // Admin tem tudo liberado, mas carregamos dados globais se precisar
                    setSignatureUrl(data.signatureUrl); // <--- Carrega do banco se for admin
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
        setLogoUrl(null);
        setSignatureUrl(null); // <--- NOVO
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
        user, churchId, churchName, userRole, userName, loading, logoUrl, signatureUrl, // <--- NOVO
        currency, formatMoney, setChurchData, userPermissions, hasPermission // userPermissions estava faltando no return value, adicionei
    }}>
      {children}
    </ChurchContext.Provider>
  );
}

export const useChurch = () => useContext(ChurchContext);