import { db } from "../lib/firebase";
import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, 
  serverTimestamp, query, orderBy 
} from "firebase/firestore";
import { Church } from "../types/church";

const COLLECTION = "churches";

export const churchService = {
  // 1. Criar nova igreja JÁ COM O PASTOR
  create: async (
    churchData: { name: string, plan: string }, 
    adminData: { name: string, email: string }
  ) => {
    try {
      // A. Cria a Igreja
      const churchRef = await addDoc(collection(db, COLLECTION), {
        name: churchData.name,
        plan: churchData.plan,
        ownerId: "system_created", // Referência interna
        active: true,
        createdAt: serverTimestamp(),
        settings: { currency: 'BRL' } // Padrão inicial
      });

      // B. Cria IMEDIATAMENTE o Membro Admin (O Pastor)
      await addDoc(collection(db, "members"), {
        churchId: churchRef.id,
        fullName: adminData.name,
        email: adminData.email,
        role: "admin", // JÁ NASCE COMO PASTOR/ADMIN
        status: "active",
        createdAt: serverTimestamp(),
        // Campos padrão vazios para não quebrar o cadastro
        phone: "", document: "", birthDate: "", baptismDate: "",
        address: { street:"", number:"", neighborhood:"", city:"", state:"", zipCode:"" },
        ministries: []
      });

      return churchRef.id;
    } catch (error) {
      console.error("Erro ao criar igreja e pastor:", error);
      throw error;
    }
  },

  // 2. Listar todas
  listAll: async () => {
    try {
      const q = query(collection(db, COLLECTION), orderBy("name"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Church[];
    } catch (error) {
      console.error("Erro lista:", error);
      throw error;
    }
  },

  // 3. Bloquear/Desbloquear
  toggleStatus: async (churchId: string, currentStatus: boolean) => {
    try {
      const ref = doc(db, COLLECTION, churchId);
      await updateDoc(ref, { active: !currentStatus });
    } catch (error) {
      console.error("Erro status:", error);
      throw error;
    }
  },

  // 4. Deletar
  delete: async (churchId: string) => {
    try {
      await deleteDoc(doc(db, COLLECTION, churchId));
    } catch (error) {
      console.error("Erro delete:", error);
      throw error;
    }
  },

  // 5. Configurações
  getSettings: async (churchId: string) => {
    try {
      const docRef = doc(db, COLLECTION, churchId);
      const snap = await getDoc(docRef);
      if (snap.exists()) return snap.data().settings || { currency: 'BRL' };
      return null;
    } catch (error) { return null; }
  },

  // 6. Atualizar Config
  updateSettings: async (churchId: string, settings: any) => {
    const ref = doc(db, COLLECTION, churchId);
    await updateDoc(ref, { settings });
  }
};