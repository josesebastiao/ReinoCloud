import { db } from "../lib/firebase";
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, 
  query, where, getDocs, orderBy 
} from "firebase/firestore";
import { Event } from "../types/event";

const COLLECTION = "events";

export const eventService = {
  create: async (data: Event) => {
    await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: new Date()
    });
  },

  listByChurch: async (churchId: string) => {
    // Busca eventos ordenados por data
    const q = query(
      collection(db, COLLECTION), 
      where("churchId", "==", churchId),
      orderBy("date", "asc") // Do mais antigo para o futuro (vamos filtrar no front)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
  },

  delete: async (id: string) => {
    await deleteDoc(doc(db, COLLECTION, id));
  }
};