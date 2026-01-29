import { db } from "../lib/firebase";
import { 
  collection, query, where, getDocs, 
  doc, getDoc, addDoc, updateDoc, deleteDoc 
} from "firebase/firestore";

export interface Member {
  id?: string;
  fullName: string;
  churchId: string;
  
  // Campos Opcionais
  role?: string;
  status?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  document?: string;
  
  address?: any; 
  
  city?: string;
  photoUrl?: string;
  entryDate?: string;
  baptismDate?: string;
  ministries?: string[];
  gender?: string;
  
  // --- NOVO CAMPO ---
  isTither?: boolean; // True = Dizimista, False = Não
}

export const memberService = {
  
  listByChurch: async (churchId: string) => {
    const q = query(collection(db, "members"), where("churchId", "==", churchId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
  },

  search: async (churchId: string, term: string) => {
    try {
        const membersRef = collection(db, "members");
        const q = query(membersRef, where("churchId", "==", churchId));
        const snapshot = await getDocs(q);
        
        const allMembers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
        
        const filtered = allMembers.filter(m => 
            m.fullName.toLowerCase().includes(term.toLowerCase())
        );

        return filtered.slice(0, 5); 
    } catch (error) {
        console.error("Erro na busca:", error);
        return [];
    }
  },

  getById: async (id: string) => {
    const docRef = doc(db, "members", id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) return { id: snapshot.id, ...snapshot.data() } as Member;
    return null;
  },

  create: async (data: Member) => {
    return await addDoc(collection(db, "members"), data);
  },

  update: async (id: string, data: Partial<Member>) => {
    const docRef = doc(db, "members", id);
    await updateDoc(docRef, data);
  },

  delete: async (id: string) => {
    const docRef = doc(db, "members", id);
    await deleteDoc(docRef);
  }
};