"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
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
  signatureUrl: string | null;
  currency: string;
  formatMoney: (value: number) => string;
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
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [currency, setCurrency] = useState("AO");
  const [loading, setLoading] = useState(true);

  // BLINDAGEM DE PERFORMANCE: useCallback impede que a função entre em loop de re-renderização
  const hasPermission = useCallback((permission: string) => {
    if (userRole === 'admin') return true; 
    return userPermissions.includes(permission);
  }, [userRole, userPermissions]);

  const setChurchData = useCallback((id: string | null, name: string | null, role: string | null, uName: string | null, logo: string | null, signature: string | null, curr: string) => {
    setChurchId(id);
    setChurchName(name);
    setUserRole(role);
    setUserName(uName);
    setLogoUrl(logo);
    setSignatureUrl(signature);
    setCurrency(curr);
    
    if (id) localStorage.setItem("churchId", id);
    if (name) localStorage.setItem("churchName", name);
    if (role) localStorage.setItem("userRole", role);
    if (uName) localStorage.setItem("userName", uName);
    if (logo) localStorage.setItem("churchLogo", logo);
    if (signature) localStorage.setItem("churchSignature", signature);
    if (curr) localStorage.setItem("churchCurrency", curr);
  }, []);

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
            setSignatureUrl(localStorage.getItem("churchSignature")); 
            setCurrency(localStorage.getItem("churchCurrency") || "AO");
        }

        try {
            // Tenta buscar como membro primeiro
            const q = query(collection(db, "members"), where("email", "==", currentUser.email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const data = querySnapshot.docs[0].data();
                setUserPermissions(data.permissions || []);
                if (data.role) setUserRole(data.role);
            } else {
                // FALLBACK DE SEGURANÇA: Garante que o Dono da Igreja sempre seja Admin
                const churchDocRef = doc(db, "churches", currentUser.uid);
                const churchDocSnap = await getDoc(churchDocRef);
                if (churchDocSnap.exists()) {
                    const data = churchDocSnap.data();
                    setSignatureUrl(data.signatureUrl); 
                    setUserRole('admin'); // Força o nível máximo de acesso
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
        setSignatureUrl(null); 
        localStorage.clear();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatMoney = useCallback((value: number) => {
    return new Intl.NumberFormat(currency === 'BR' ? "pt-BR" : "pt-AO", {
      style: "currency",
      currency: currency === 'BR' ? "BRL" : "AOA",
    }).format(value);
  }, [currency]);

  return (
    <ChurchContext.Provider value={{ 
        user, churchId, churchName, userRole, userName, loading, logoUrl, signatureUrl,
        currency, formatMoney, setChurchData, userPermissions, hasPermission 
    }}>
      {children}
    </ChurchContext.Provider>
  );
}

export const useChurch = () => useContext(ChurchContext);