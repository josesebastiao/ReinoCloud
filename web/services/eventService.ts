import { db } from "../lib/firebase";
import { 
  collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc 
} from "firebase/firestore";
import { Event } from "../types/event";

const COLLECTION = "events";

export const eventService = {
  // Listar
  listByChurch: async (churchId: string) => {
    try {
      const q = query(collection(db, COLLECTION), where("churchId", "==", churchId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
    } catch (error) {
      console.error("Erro ao listar eventos:", error);
      throw error;
    }
  },

  // Criar
  create: async (data: any) => {
    await addDoc(collection(db, COLLECTION), data);
  },

  // --- NOVO: ATUALIZAR (EDITAR) ---
  update: async (id: string, data: any) => {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, data);
  },
  // -------------------------------

  // Deletar
  delete: async (id: string) => {
    await deleteDoc(doc(db, COLLECTION, id));
  }
};