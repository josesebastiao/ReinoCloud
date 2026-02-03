import { db } from "../lib/firebase";
import { 
  collection, addDoc, getDocs, query, where, deleteDoc, doc, orderBy 
} from "firebase/firestore";

const COLLECTION = "documents";

export interface ChurchDoc {
  id?: string;
  churchId: string;
  name: string;
  link: string;
  date: string;
}

export const documentService = {
  // Criar novo documento
  create: async (data: ChurchDoc) => {
    await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: new Date().toISOString()
    });
  },

  // Listar por Igreja
  listByChurch: async (churchId: string) => {
    try {
      const q = query(
        collection(db, COLLECTION), 
        where("churchId", "==", churchId)
      );
      const snapshot = await getDocs(q);
      // Ordenação manual (caso o índice falhe no inicio)
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChurchDoc));
      return docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error("Erro ao listar documentos:", error);
      return [];
    }
  },

  // Deletar
  delete: async (id: string) => {
    await deleteDoc(doc(db, COLLECTION, id));
  }
};