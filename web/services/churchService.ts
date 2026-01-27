import { db } from "../lib/firebase";
import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc 
} from "firebase/firestore";
import { Church } from "../types/church";

const COLLECTION = "churches";

export const churchService = {
  create: async (churchData: Partial<Church>, pastorData: any) => {
    // Cria a igreja
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...churchData,
      active: true,
      createdAt: new Date()
    });
    
    // Cria o pastor vinculado
    await addDoc(collection(db, "members"), {
      churchId: docRef.id,
      fullName: pastorData.name,
      email: pastorData.email,
      role: "admin",
      status: "active",
      createdAt: new Date()
    });

    return docRef.id;
  },

  listAll: async () => {
    const snapshot = await getDocs(collection(db, COLLECTION));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Church));
  },

  toggleStatus: async (id: string, currentStatus: boolean) => {
    await updateDoc(doc(db, COLLECTION, id), { active: !currentStatus });
  },

  delete: async (id: string) => {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  // --- MÉTODOS DE CONFIGURAÇÃO (IMPORTANTES!) ---
  getSettings: async (churchId: string) => {
    try {
        const docRef = doc(db, COLLECTION, churchId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data();
            return data.settings || {}; // Retorna as configurações ou vazio
        }
        return null;
    } catch (error) {
        console.error("Erro ao buscar settings:", error);
        return null;
    }
  },

  updateSettings: async (churchId: string, settings: any) => {
    const docRef = doc(db, COLLECTION, churchId);
    await updateDoc(docRef, { settings });
  }
};