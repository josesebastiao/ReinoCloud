import { db } from "../lib/firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  doc,         // <--- Adicionado
  updateDoc,   // <--- Adicionado
  deleteDoc    // <--- Adicionado
} from "firebase/firestore";
import { Member } from "../types/member";

const COLLECTION_NAME = "members";

// Mantive sua função de palavras-chave, ela é excelente para a busca futura!
const generateKeywords = (name: string): string[] => {
  const arr: string[] = [];
  let cur = '';
  name.toLowerCase().split(' ').forEach(word => {
    word.split('').forEach(char => {
      cur += char;
      arr.push(cur);
    });
    cur = '';
  });
  return [...new Set(arr)];
};

export const memberService = {
  // --- CREATE (Seu código original) ---
  create: async (data: Omit<Member, 'id' | 'createdAt' | 'searchKeywords'>) => {
    try {
      const keywords = generateKeywords(data.fullName);
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...data,
        searchKeywords: keywords,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Erro ao criar: ", error);
      throw error;
    }
  },

  // --- LIST (Seu código original) ---
  listByChurch: async (churchId: string) => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME), 
        where("churchId", "==", churchId),
        orderBy("fullName")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Member[];
    } catch (error) {
      console.error("Erro ao listar: ", error);
      throw error;
    }
  },

  // --- UPDATE (NOVO: Com inteligência para atualizar keywords) ---
  update: async (id: string, data: Partial<Member>) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);

      // Se o usuário estiver corrigindo o nome, regeramos as keywords
      if (data.fullName) {
        const newKeywords = generateKeywords(data.fullName);
        await updateDoc(docRef, {
          ...data,
          searchKeywords: newKeywords
        });
      } else {
        // Se mudou só o email ou outro dado, atualiza normal
        await updateDoc(docRef, data);
      }
    } catch (error) {
      console.error("Erro ao atualizar membro:", error);
      throw error;
    }
  },

  // --- DELETE (NOVO) ---
  delete: async (id: string) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Erro ao deletar membro:", error);
      throw error;
    }
  }
};