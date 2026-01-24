import { db } from "../lib/firebase";
import { 
  collection, addDoc, getDocs, deleteDoc, doc, 
  query, where, orderBy 
} from "firebase/firestore";
import { Scale } from "../types/scale";

const COLLECTION = "scales";

export const scaleService = {
  create: async (data: Omit<Scale, 'id'>) => {
    const docRef = await addDoc(collection(db, COLLECTION), data);
    return docRef.id;
  },

  listByMinistry: async (ministryId: string) => {
    // Busca escalas daquele ministério ordenadas por data
    const q = query(
      collection(db, COLLECTION), 
      where("ministryId", "==", ministryId),
      orderBy("date", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Scale));
  },

  delete: async (id: string) => {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  }
};