import { initializeApp, getApp, getApps, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { firebaseConfig } from "../lib/firebase";

export const createSystemUser = async (email: string, password: string) => {
  let secondaryApp;
  const appName = "SecondaryApp";

  try {
    // 1. Verifica se já existe ou cria uma nova instância
    if (getApps().length > 0 && getApps().find(app => app.name === appName)) {
        secondaryApp = getApp(appName);
    } else {
        secondaryApp = initializeApp(firebaseConfig, appName);
    }

    const secondaryAuth = getAuth(secondaryApp);

    // 2. Cria o usuário sem deslogar o Admin principal
    await createUserWithEmailAndPassword(secondaryAuth, email, password);

    // 3. Desloga da instância secundária para limpar a sessão dela
    await signOut(secondaryAuth);

    return true;

  } catch (error: any) {
    console.error("Erro ao criar usuário:", error);
    
    // TRADUÇÃO DE ERROS PARA O USUÁRIO
    if (error.code === 'auth/email-already-in-use') {
        throw new Error("Este e-mail já possui acesso ao sistema.");
    }
    if (error.code === 'auth/weak-password') {
        throw new Error("A senha deve ter pelo menos 6 caracteres.");
    }
    if (error.code === 'auth/invalid-email') {
        throw new Error("O formato do e-mail é inválido.");
    }
    
    throw new Error("Erro técnico: " + error.code);
  }
};