import { db } from "../lib/firebase"; // Ajustei o caminho para ../lib
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { Member } from "../types/member"; // Ajustei o caminho para ../types

const COLLECTION_NAME = "members";

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
  }
};