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
  response?: string; // <--- NOVA CAMPO: Resposta do Pastor
  createdAt: any;
  status: 'pending' | 'read' | 'prayed';
}

export const prayerService = {
  // Enviar pedido
  create: async (data: PrayerRequest) => {
    await addDoc(collection(db, COLLECTION), {
      ...data,
      status: 'pending',
      response: "",
      createdAt: new Date()
    });
  },

  // Listar pedidos da igreja (Para o Pastor)
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

  // Listar pedidos do usuário (Para o Membro ver o histórico) - NOVO
  listByUser: async (userId: string) => {
    try {
      const q = query(
          collection(db, COLLECTION), 
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PrayerRequest));
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      return [];
    }
  },

  // Responder ao pedido - NOVO
  respond: async (id: string, response: string) => {
    await updateDoc(doc(db, COLLECTION, id), { 
        response,
        status: 'read' // Marca como lido automaticamente ao responder
    });
  },

  // Marcar como orado
  updateStatus: async (id: string, status: 'read' | 'prayed') => {
    await updateDoc(doc(db, COLLECTION, id), { status });
  },

  // Excluir pedido
  delete: async (id: string) => {
    await deleteDoc(doc(db, COLLECTION, id));
  }
};