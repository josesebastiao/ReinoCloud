import { db } from "../lib/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { Church } from "../types/church";

const COLLECTION = "churches";

export const churchService = {
  // 1. Criar uma nova igreja (Onboarding de cliente)
  create: async (data: Omit<Church, 'id' | 'createdAt'>) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...data,
        createdAt: serverTimestamp(),
        active: true, // Nasce ativa
      });
      return docRef.id;
    } catch (error) {
      console.error("Erro ao criar igreja:", error);
      throw error;
    }
  },

  // 2. Listar todas as igrejas (Para seu dashboard)
  listAll: async () => {
    try {
      const q = query(collection(db, COLLECTION), orderBy("name"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Church[];
    } catch (error) {
      console.error("Erro ao listar igrejas:", error);
      throw error;
    }
  },

  // 3. Bloquear/Desbloquear Igreja (Ex: Falta de pagamento)
  toggleStatus: async (churchId: string, currentStatus: boolean) => {
    try {
      const ref = doc(db, COLLECTION, churchId);
      await updateDoc(ref, { active: !currentStatus });
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      throw error;
    }
  }
};