import { db } from "../lib/firebase";
import { collection, addDoc, getDocs, updateDoc, doc, query, where, orderBy, writeBatch } from "firebase/firestore";

const COLLECTION = "notifications";

export interface AppNotification {
  id?: string;
  memberId: string;
  churchId: string;
  title: string;
  message: string;
  type: 'scale' | 'system' | 'message';
  read: boolean;
  createdAt: string;
}

export const notificationService = {
  create: async (data: Omit<AppNotification, 'id'>) => {
    const docRef = await addDoc(collection(db, COLLECTION), data);
    return docRef.id;
  },

  listByMember: async (memberId: string) => {
    const q = query(
      collection(db, COLLECTION),
      where("memberId", "==", memberId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
  },

  markAsRead: async (id: string) => {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, { read: true });
  },

  markAllAsRead: async (memberId: string) => {
    const q = query(
      collection(db, COLLECTION),
      where("memberId", "==", memberId),
      where("read", "==", false)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  }
};
