import { db } from "../lib/firebase";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, orderBy } from "firebase/firestore";

const COLLECTION = "general_scales";

export const generalScaleService = {
  // Salvar nova escala
  create: async (data: any) => {
    await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: new Date().toISOString()
    });
  },

  // Listar escalas da igreja
  listByChurch: async (churchId: string) => {
    const q = query(
        collection(db, COLLECTION), 
        where("churchId", "==", churchId),
        orderBy("createdAt", "desc") // As mais recentes primeiro
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Excluir escala
  delete: async (id: string) => {
    await deleteDoc(doc(db, COLLECTION, id));
  }
};