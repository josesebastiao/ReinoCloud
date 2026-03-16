"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

// --- NOVAS INTERFACES PARA A REDE ---
export interface BranchInfo {
  id: string;
  name: string;
}

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
  setChurchData: (id: string | null, name: string | null, role: string | null, userName: string | null, logoUrl: string | null, signatureUrl: string | null, currency: string, modules?: string) => void;
  hasPermission: (permission: string) => boolean;
  churchModules: string | null;
  
  // --- NOVOS DADOS PARA O MÓDULO VISÃO GLOBAL ---
  isHeadquarters: boolean;
  headquartersId: string | null; // Guarda o ID da sede quando o pastor estiver "visitando" uma filial
  branches: BranchInfo[];
  switchChurch: (targetChurchId: string, targetChurchName: string) => Promise<void>;
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
  const [churchModules, setChurchModules] = useState<string | null>("full");
  const [loading, setLoading] = useState(true);

  // --- NOVOS ESTADOS ---
  const [isHeadquarters, setIsHeadquarters] = useState(false);
  const [headquartersId, setHeadquartersId] = useState<string | null>(null);
  const [branches, setBranches] = useState<BranchInfo[]>([]);

  const hasPermission = useCallback((permission: string) => {
    if (userRole === 'admin') return true;
    return userPermissions.includes(permission);
  }, [userRole, userPermissions]);

  const setChurchData = useCallback((id: string | null, name: string | null, role: string | null, uName: string | null, logo: string | null, signature: string | null, curr: string, modules: string = "full") => {
    setChurchId(id);
    setChurchName(name);
    setUserRole(role);
    setUserName(uName);
    setLogoUrl(logo);
    setSignatureUrl(signature);
    setCurrency(curr);
    setChurchModules(modules);

    if (id) localStorage.setItem("churchId", id);
    if (name) localStorage.setItem("churchName", name);
    if (role) localStorage.setItem("userRole", role);
    if (uName) localStorage.setItem("userName", uName);
    if (logo) localStorage.setItem("churchLogo", logo);
    if (signature) localStorage.setItem("churchSignature", signature);
    if (curr) localStorage.setItem("churchCurrency", curr);
    if (modules) localStorage.setItem("churchModules", modules);
  }, []);

  // --- FUNÇÃO PARA ALTERNAR ENTRE SEDE E FILIAL ---
  const switchChurch = async (targetChurchId: string, targetChurchName: string) => {
    setLoading(true);
    
    // Se estiver indo para uma filial, salva o ID da Sede para poder voltar
    if (isHeadquarters && targetChurchId !== churchId) {
      localStorage.setItem("headquartersId", churchId || "");
      setHeadquartersId(churchId);
    } 
    // Se estiver voltando para a Sede, limpa o headquartersId
    else if (headquartersId && targetChurchId === headquartersId) {
      localStorage.removeItem("headquartersId");
      setHeadquartersId(null);
    }

    // Atualiza o contexto e o localStorage com a nova igreja
    setChurchId(targetChurchId);
    setChurchName(targetChurchName);
    localStorage.setItem("churchId", targetChurchId);
    localStorage.setItem("churchName", targetChurchName);
    
    // Puxa as configurações da nova igreja (Logo, Moeda, etc)
    try {
        const churchDocRef = doc(db, "churches", targetChurchId);
        const churchDocSnap = await getDoc(churchDocRef);
        if (churchDocSnap.exists()) {
            const data = churchDocSnap.data();
            setLogoUrl(data.logoUrl || null);
            setCurrency(data.currency || "AO");
            localStorage.setItem("churchLogo", data.logoUrl || "");
            localStorage.setItem("churchCurrency", data.currency || "AO");
        }
    } catch(e) { console.error("Erro ao buscar dados da nova igreja", e); }
    
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const storedId = localStorage.getItem("churchId");
        const storedHQId = localStorage.getItem("headquartersId");
        
        if (storedId) {
          setChurchId(storedId);
          setChurchName(localStorage.getItem("churchName"));
          setUserRole(localStorage.getItem("userRole"));
          setUserName(localStorage.getItem("userName"));
          setLogoUrl(localStorage.getItem("churchLogo"));
          setSignatureUrl(localStorage.getItem("churchSignature"));
          setCurrency(localStorage.getItem("churchCurrency") || "AO");
          setChurchModules(localStorage.getItem("churchModules") || "full");
        }
        
        if (storedHQId) setHeadquartersId(storedHQId);

        try {
          const q = query(collection(db, "members"), where("email", "==", currentUser.email));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            setUserPermissions(data.permissions || []);
            if (data.role) setUserRole(data.role);
          } else {
            const churchDocRef = doc(db, "churches", currentUser.uid);
            const churchDocSnap = await getDoc(churchDocRef);
            if (churchDocSnap.exists()) {
              const data = churchDocSnap.data();
              setSignatureUrl(data.signatureUrl);
              setUserRole('admin'); 
            }
          }

          // --- VERIFICAÇÃO DE SEDE E CONGREGAÇÕES ---
          // Verifica a igreja que ele está logado originalmente (ou a sede, se ele estiver visitando)
          const actualChurchIdToCheck = storedHQId || storedId; 
          
          if (actualChurchIdToCheck) {
            const churchDocRef = doc(db, "churches", actualChurchIdToCheck);
            const churchDocSnap = await getDoc(churchDocRef);
            
            if (churchDocSnap.exists()) {
              const data = churchDocSnap.data();
              setChurchModules(data.planModules || "full");
              
              // Verifica se é uma Sede (Headquarters)
              if (data.isHeadquarters === true) {
                  setIsHeadquarters(true);
                  
                  // Se é Sede, busca todas as congregações ligadas a ela
                  const branchesQuery = query(collection(db, "churches"), where("parentId", "==", actualChurchIdToCheck));
                  const branchesSnap = await getDocs(branchesQuery);
                  
                  const branchesList: BranchInfo[] = [];
                  branchesSnap.forEach(doc => {
                      branchesList.push({ id: doc.id, name: doc.data().name });
                  });
                  setBranches(branchesList);
              } else {
                  setIsHeadquarters(false);
                  setBranches([]);
              }
            }
          }
        } catch (error) {
          console.error("Erro ao carregar dados:", error);
        }

      } else {
        setChurchId(null);
        setChurchName(null);
        setUserRole(null);
        setUserPermissions([]);
        setUserName(null);
        setLogoUrl(null);
        setSignatureUrl(null);
        setChurchModules("full");
        setIsHeadquarters(false);
        setHeadquartersId(null);
        setBranches([]);
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
      currency, formatMoney, setChurchData, userPermissions, hasPermission, churchModules,
      isHeadquarters, headquartersId, branches, switchChurch
    }}>
      {children}
    </ChurchContext.Provider>
  );
}

export const useChurch = () => useContext(ChurchContext);