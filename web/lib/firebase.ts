import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  initializeFirestore, 
  CACHE_SIZE_UNLIMITED 
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// SUAS CHAVES (Mantidas intactas)
const firebaseConfig = {
  apiKey: "AIzaSyBl7etILVkrqYc0FU3MJv-HpXS1KYZeXYo",
  authDomain: "reino-cloud-app.firebaseapp.com",
  projectId: "reino-cloud-app",
  storageBucket: "reino-cloud-app.firebasestorage.app",
  messagingSenderId: "498900193832",
  appId: "1:498900193832:web:36e93db13c2d6f6b5d9b1d"
};

// 1. Inicializa o App (Singleton: garante que só inicia uma vez)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. Inicializa o Banco de Dados com CACHE INFINITO (O Segredo do Offline)
const db = initializeFirestore(app, {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

// 3. Autenticação e Storage (Para fotos futuras)
const auth = getAuth(app);
const storage = getStorage(app);

// 4. ATIVAR MODO OFFLINE (PERSISTÊNCIA)
// Isso faz o navegador gravar os dados no "HD" do celular
if (typeof window !== "undefined") {
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code == 'failed-precondition') {
            // Acontece se tiver muitas abas abertas ao mesmo tempo
            console.warn("Persistência offline falhou: Multiplas abas abertas.");
        } else if (err.code == 'unimplemented') {
            // O navegador não suporta (raro hoje em dia)
            console.warn("Navegador não suporta persistência offline.");
        }
    });
}

export { app, db, auth, storage };