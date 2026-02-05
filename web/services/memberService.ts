import { db } from "../lib/firebase";
import { 
  collection, query, where, getDocs, 
  doc, getDoc, addDoc, updateDoc, deleteDoc 
} from "firebase/firestore";

// Importamos a interface centralizada. NÃO a redefinimos aqui para evitar erro de duplicidade.
import { Member } from "../types/member";

const COLLECTION = "members";

export const memberService = {
  
  // Listar todos por Igreja
  listByChurch: async (churchId: string): Promise<Member[]> => {
    const q = query(collection(db, COLLECTION), where("churchId", "==", churchId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
  },

  // Busca (Mantendo sua lógica original)
  search: async (churchId: string, term: string): Promise<Member[]> => {
    try {
        const q = query(collection(db, COLLECTION), where("churchId", "==", churchId));
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

  // Buscar um por ID
  getById: async (id: string): Promise<Member | null> => {
    const docRef = doc(db, COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) return { id: snapshot.id, ...snapshot.data() } as Member;
    return null;
  },

  // Criar (Adiciona data automática)
  create: async (data: Member) => {
    return await addDoc(collection(db, COLLECTION), {
        ...data,
        createdAt: new Date().toISOString()
    });
  },

  // Atualizar (Adiciona data automática)
  update: async (id: string, data: Partial<Member>) => {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
    });
  },

  // Deletar
  delete: async (id: string) => {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  }
};