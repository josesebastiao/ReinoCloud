import { db } from "../lib/firebase";
import { 
  collection, query, where, getDocs, 
  doc, getDoc, addDoc, updateDoc, deleteDoc, 
  orderBy, limit, startAt, endAt 
} from "firebase/firestore";

// --- ATUALIZAÇÃO DA INTERFACE ---
// Adicionamos os campos opcionais (?) que o resto do sistema espera (Aniversários, Detalhes, etc)
export interface Member {
  id?: string;
  fullName: string;
  churchId: string;
  role?: string;
  status?: string;
  email?: string;       // Adicionado
  phone?: string;       // Adicionado
  birthDate?: string;   // Adicionado (Essencial para a página de aniversários)
  document?: string;    // Adicionado
  address?: string;     // Adicionado
  city?: string;        // Adicionado
  photoUrl?: string;    // Adicionado
  entryDate?: string;   // Adicionado
  baptismDate?: string; // Adicionado
}

export const memberService = {
  
  // Lista todos os membros da igreja
  listByChurch: async (churchId: string) => {
    const q = query(collection(db, "members"), where("churchId", "==", churchId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
  },

  // Busca Inteligente (Nome)
  search: async (churchId: string, term: string) => {
    try {
        const membersRef = collection(db, "members");
        
        // Busca todos da igreja (filtragem de texto feita em memória para evitar complexidade de índices agora)
        const q = query(membersRef, where("churchId", "==", churchId));
        const snapshot = await getDocs(q);
        
        const allMembers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
        
        // Filtra ignorando maiúsculas/minúsculas
        const filtered = allMembers.filter(m => 
            m.fullName.toLowerCase().includes(term.toLowerCase())
        );

        return filtered.slice(0, 5); // Retorna top 5
        
    } catch (error) {
        console.error("Erro na busca:", error);
        return [];
    }
  },

  // Buscar um único membro pelo ID
  getById: async (id: string) => {
    const docRef = doc(db, "members", id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) return { id: snapshot.id, ...snapshot.data() } as Member;
    return null;
  },

  // Criar membro
  create: async (data: Member) => {
    return await addDoc(collection(db, "members"), data);
  },

  // Atualizar membro
  update: async (id: string, data: Partial<Member>) => {
    const docRef = doc(db, "members", id);
    await updateDoc(docRef, data);
  },

  // Deletar membro
  delete: async (id: string) => {
    const docRef = doc(db, "members", id);
    await deleteDoc(docRef);
  }
};