import { db } from "../lib/firebase";
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";

const COLLECTION = "prayers";

export interface PrayerRequest {
  id?: string;
  churchId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  createdAt: any;
  status: 'pending' | 'read' | 'prayed';
}

export const prayerService = {
  // Enviar pedido
  create: async (data: PrayerRequest) => {
    await addDoc(collection(db, COLLECTION), {
      ...data,
      status: 'pending',
      createdAt: new Date()
    });
  },

  // Listar pedidos da igreja
  listByChurch: async (churchId: string) => {
    try {
      const q = query(
          collection(db, COLLECTION), 
          where("churchId", "==", churchId),
          orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PrayerRequest));
    } catch (error) {
      console.error("Erro ao buscar orações:", error);
      return [];
    }
  },

  // Marcar como orado
  updateStatus: async (id: string, status: 'read' | 'prayed') => {
    await updateDoc(doc(db, COLLECTION, id), { status });
  },

  // Excluir
  delete: async (id: string) => {
    await deleteDoc(doc(db, COLLECTION, id));
  }
};