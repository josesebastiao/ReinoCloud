import { db } from "../lib/firebase";
import { 
  collection, addDoc, getDocs, deleteDoc, doc, 
  query, where, orderBy 
} from "firebase/firestore";
import { Transaction } from "../types/finance";

const COLLECTION = "transactions";

export const financeService = {
  // Criar lançamento
  create: async (data: Omit<Transaction, 'id'>) => {
    const docRef = await addDoc(collection(db, COLLECTION), data);
    return docRef.id;
  },

  // Listar todos da igreja (ordenados por data)
  listByChurch: async (churchId: string) => {
    const q = query(
      collection(db, COLLECTION), 
      where("churchId", "==", churchId),
      orderBy("date", "desc") // Mais recentes primeiro
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
  },

  // Deletar
  delete: async (id: string) => {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  }
};