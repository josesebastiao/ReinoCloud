import { db } from "../lib/firebase";
import { 
  collection, addDoc, getDocs, doc, deleteDoc, updateDoc, 
  query, where, orderBy, serverTimestamp 
} from "firebase/firestore";
import { Ministry } from "../types/ministry";

const COLLECTION = "ministries";

export const ministryService = {
  create: async (data: Omit<Ministry, 'id' | 'createdAt'>) => {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  listByChurch: async (churchId: string) => {
    const q = query(
      collection(db, COLLECTION), 
      where("churchId", "==", churchId),
      orderBy("name")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ministry));
  },

  update: async (id: string, data: Partial<Ministry>) => {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, data);
  },

  delete: async (id: string) => {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  }
};