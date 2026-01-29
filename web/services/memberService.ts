import { db } from "../lib/firebase";
import { 
  collection, query, where, getDocs, 
  doc, getDoc, addDoc, updateDoc, deleteDoc, 
  orderBy, limit, startAt, endAt 
} from "firebase/firestore";

export interface Member {
  id?: string;
  fullName: string;
  churchId: string;
  role?: string;
  status?: string;
  // adicione outros campos se precisar
}

export const memberService = {
  
  // Lista todos os membros da igreja
  listByChurch: async (churchId: string) => {
    const q = query(collection(db, "members"), where("churchId", "==", churchId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
  },

  // --- NOVA FUNÇÃO DE BUSCA (A que estava faltando) ---
  search: async (churchId: string, term: string) => {
    // Busca simples por prefixo (Case sensitive no Firebase padrão)
    // Para funcionar melhor, o ideal é salvar um campo "searchName" tudo minúsculo no cadastro.
    // Mas aqui vamos tentar uma busca direta:
    
    try {
        const membersRef = collection(db, "members");
        
        // Opção 1: Busca exata de prefixo (Requer índice em alguns casos)
        // const q = query(
        //   membersRef, 
        //   where("churchId", "==", churchId), 
        //   where("fullName", ">=", term),
        //   where("fullName", "<=", term + '\uf8ff')
        // );

        // Opção 2 (Mais Garantida para poucos registros): Baixa tudo e filtra na memória
        // Se sua igreja tiver menos de 2000 membros, isso é instantâneo e não dá erro de índice.
        const q = query(membersRef, where("churchId", "==", churchId));
        const snapshot = await getDocs(q);
        
        const allMembers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
        
        // Filtra aqui no Javascript (Ignora maiúsculas/minúsculas)
        const filtered = allMembers.filter(m => 
            m.fullName.toLowerCase().includes(term.toLowerCase())
        );

        return filtered.slice(0, 5); // Retorna só os 5 primeiros
        
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