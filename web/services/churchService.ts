import { db } from "../lib/firebase";
import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, 
  serverTimestamp, query, orderBy 
} from "firebase/firestore";
import { Church } from "../types/church";

const COLLECTION = "churches";

export const churchService = {
  // 1. Criar nova igreja
  // CORREÇÃO AQUI: Adicionei " | 'active' " para ele não exigir isso na chamada
  create: async (data: Omit<Church, 'id' | 'createdAt' | 'active'>) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...data,
        createdAt: serverTimestamp(),
        active: true, // Nós definimos isso aqui automaticamente
      });
      return docRef.id;
    } catch (error) {
      console.error("Erro ao criar igreja:", error);
      throw error;
    }
  },

  // 2. Listar todas (Super Admin)
  listAll: async () => {
    try {
      const q = query(collection(db, COLLECTION), orderBy("name"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Church[];
    } catch (error) {
      console.error("Erro ao listar:", error);
      throw error;
    }
  },

  // 3. Bloquear/Desbloquear
  toggleStatus: async (churchId: string, currentStatus: boolean) => {
    try {
      const ref = doc(db, COLLECTION, churchId);
      await updateDoc(ref, { active: !currentStatus });
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      throw error;
    }
  },

  // 4. Deletar Igreja
  delete: async (churchId: string) => {
    try {
      await deleteDoc(doc(db, COLLECTION, churchId));
    } catch (error) {
      console.error("Erro ao excluir igreja:", error);
      throw error;
    }
  },

  // 5. Buscar Configurações
  getSettings: async (churchId: string) => {
    try {
      const docRef = doc(db, COLLECTION, churchId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data().settings || { currency: 'BRL' }; 
      }
      return null;
    } catch (error) {
      console.error("Erro config:", error);
      return null;
    }
  },

  // 6. Salvar Configurações
  updateSettings: async (churchId: string, settings: any) => {
    try {
      const ref = doc(db, COLLECTION, churchId);
      await updateDoc(ref, {
        settings: settings
      });
    } catch (error) {
      console.error("Erro update config:", error);
      throw error;
    }
  }
};