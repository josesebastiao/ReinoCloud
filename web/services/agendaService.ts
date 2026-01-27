// CORREÇÃO: Adicionamos mais um "../" pois a pasta está dentro de 'app'
import { db } from "../lib/firebase"; 
import { 
  collection, addDoc, getDocs, query, where, deleteDoc, doc 
} from "firebase/firestore";

const COLLECTION = "events";

export const agendaService = {
  // Listar eventos da igreja
  listByChurch: async (churchId: string) => {
    try {
      // 1. Cria a consulta (Busca eventos dessa igreja)
      const q = query(collection(db, COLLECTION), where("churchId", "==", churchId));
      
      // 2. Busca os dados no banco
      const snapshot = await getDocs(q);
      
      // 3. Formata e retorna
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    } catch (error) {
      console.error("Erro ao buscar agenda:", error);
      return []; // Retorna lista vazia se der erro
    }
  },

  // Criar evento
  create: async (data: any) => {
    try {
      await addDoc(collection(db, COLLECTION), data);
    } catch (error) {
      console.error("Erro ao criar evento:", error);
      throw error;
    }
  },

  // Deletar evento
  delete: async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTION, id));
    } catch (error) {
      console.error("Erro ao deletar evento:", error);
      throw error;
    }
  }
};