import { db } from "../lib/firebase";
import { 
  collection, addDoc, getDocs, query, where, deleteDoc, doc, orderBy, updateDoc, arrayUnion, arrayRemove 
} from "firebase/firestore";

const COLLECTION = "posts";

// Interface para Comentários
export interface Comment {
  id?: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  createdAt: any;
}

// Interface Atualizada para Post
export interface Post {
  id?: string;
  churchId: string;
  title: string;
  content: string;
  type: 'notice' | 'devotional' | 'event';
  date: string;
  imageUrl?: string; // Link da imagem do post
  likes?: string[]; // Array de IDs de usuários que curtiram
  createdAt?: any;
}

export const postService = {
  // Criar novo post
  create: async (data: Post) => {
    await addDoc(collection(db, COLLECTION), {
      ...data,
      likes: [], // Inicializa likes vazio
      createdAt: new Date()
    });
  },

  // Listar posts da igreja
  listByChurch: async (churchId: string) => {
    const q = query(
        collection(db, COLLECTION), 
        where("churchId", "==", churchId),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
  },

  // Excluir post
  delete: async (id: string) => {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  // --- NOVAS FUNÇÕES: LIKES E COMENTÁRIOS ---

  // Alternar Like (Curtir/Descurtir)
  toggleLike: async (postId: string, userId: string, isLiked: boolean) => {
    const postRef = doc(db, COLLECTION, postId);
    if (isLiked) {
      await updateDoc(postRef, { likes: arrayRemove(userId) });
    } else {
      await updateDoc(postRef, { likes: arrayUnion(userId) });
    }
  },

  // Adicionar Comentário (Sub-coleção)
  addComment: async (postId: string, comment: Comment) => {
    await addDoc(collection(db, COLLECTION, postId, "comments"), {
      ...comment,
      createdAt: new Date()
    });
  },

  // Buscar Comentários de um Post
  getComments: async (postId: string) => {
    const q = query(collection(db, COLLECTION, postId, "comments"), orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
  }
};