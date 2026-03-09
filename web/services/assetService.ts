import { db } from "../lib/firebase";
import {
    collection, addDoc, getDocs, updateDoc,
    deleteDoc, doc, query, where, serverTimestamp
} from "firebase/firestore";

export interface Asset {
    id?: string;
    churchId: string;
    name: string;
    description?: string;
    quantity: number;
    condition: 'novo' | 'bom' | 'regular' | 'ruim';
    location?: string;
    acquisitionDate?: string;
    createdAt?: any;
    updatedAt?: any;
}

export const assetService = {
    async create(data: Omit<Asset, 'id'>) {
        const docRef = await addDoc(collection(db, "assets"), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    },

    async listByChurch(churchId: string): Promise<Asset[]> {
        const q = query(
            collection(db, "assets"),
            where("churchId", "==", churchId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Asset));
    },

    async update(id: string, data: Partial<Asset>) {
        const docRef = doc(db, "assets", id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async delete(id: string) {
        const docRef = doc(db, "assets", id);
        await deleteDoc(docRef);
    }
};
