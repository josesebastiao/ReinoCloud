import { db } from "../lib/firebase";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, orderBy } from "firebase/firestore";

const COLLECTION = "posts";

export interface Post {
  id?: string;
  churchId: string;
  title: string;
  content: string;
  type: 'notice' | 'devotional' | 'event'; // Aviso, Devocional ou Evento
  date: string;
  createdAt?: any;
}

export const postService = {
  // Criar novo aviso
  create: async (data: Post) => {
    await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: new Date()
    });
  },

  // Listar avisos da igreja (do mais recente para o antigo)
  listByChurch: async (churchId: string) => {
    const q = query(
        collection(db, COLLECTION), 
        where("churchId", "==", churchId),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
  },

  // Excluir aviso
  delete: async (id: string) => {
    await deleteDoc(doc(db, COLLECTION, id));
  }
};