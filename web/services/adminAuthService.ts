import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { firebaseConfig } from "../lib/firebase";

// Esse serviço cria uma "Segunda Instância" do Firebase
// Só para criar o usuário novo sem deslogar o Admin atual
export const createSystemUser = async (email: string, password: string) => {
  try {
    const secondaryAppName = "secondaryApp";
    let secondaryApp;

    if (!getApps().length) {
        secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    } else {
        secondaryApp = getApps().find(app => app.name === secondaryAppName) || initializeApp(firebaseConfig, secondaryAppName);
    }

    const secondaryAuth = getAuth(secondaryApp);
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    
    // Importante: Deslogar dessa instância secundária para não dar conflito
    await signOut(secondaryAuth);

    return userCredential.user.uid;
  } catch (error) {
    throw error;
  }
};