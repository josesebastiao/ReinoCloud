import { db } from "../lib/firebase";
import { 
  collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc // <--- Importamos o updateDoc
} from "firebase/firestore";
import { Transaction } from "../types/finance";

const COLLECTION = "financial";

export const financeService = {
  // Listar
  listByChurch: async (churchId: string) => {
    try {
      const q = query(collection(db, COLLECTION), where("churchId", "==", churchId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    } catch (error) {
      console.error("Erro ao listar financeiro:", error);
      return [];
    }
  },

  // Criar
  create: async (data: Transaction) => {
    await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: new Date().toISOString() // Garante formato padrão de data
    });
  },

  // Deletar
  delete: async (id: string) => {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  // --- ATUALIZAR (A FUNÇÃO QUE FALTAVA) ---
  update: async (id: string, data: any) => {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, data);
  }
};