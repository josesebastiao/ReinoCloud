import { db } from "../lib/firebase";
import { 
  collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc 
} from "firebase/firestore";

// Nome da coleção no Banco de Dados
const COLLECTION = "minutes"; 

export const minuteService = {
  // Listar todas as atas da igreja
  listByChurch: async (churchId: string) => {
    try {
      const q = query(collection(db, COLLECTION), where("churchId", "==", churchId));
      const snapshot = await getDocs(q);
      // Retorna os dados + o ID do documento
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Erro ao buscar atas:", error);
      return [];
    }
  },

  // Criar nova ata
  create: async (data: any) => {
    await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: new Date().toISOString()
    });
  },

  // Editar ata existente
  update: async (id: string, data: any) => {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, data);
  },

  // Excluir ata
  delete: async (id: string) => {
    await deleteDoc(doc(db, COLLECTION, id));
  }
};