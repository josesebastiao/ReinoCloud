"use client";
import { useEffect, useState } from "react";
import { Download, Share, PlusSquare, X } from "lucide-react";

export default function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(true);

  useEffect(() => {
    // 1. Detecta se já está instalado (Modo App)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isInStandaloneMode);

    // 2. Detecta se é Android/Chrome (Evento automático)
    const handler = (e: any) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // 3. Detecta se é iOS (iPhone/iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Função para instalar no Android
  const onClickAndroid = (evt: any) => {
    evt.preventDefault();
    if (!promptInstall) return;
    promptInstall.prompt();
  };

  // Se já estiver instalado, não mostra nada
  if (isStandalone) return null;

  // --- CENÁRIO 1: ANDROID (Botão Automático) ---
  if (supportsPWA) {
    return (
      <button 
        onClick={onClickAndroid}
        className="w-full mb-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg animate-pulse"
      >
        <Download size={20} /> Instalar App
      </button>
    );
  }

  // --- CENÁRIO 2: IPHONE (Instruções Manuais) ---
  if (isIOS && showIOSHint) {
    return (
      <div className="mb-4 bg-gray-100 p-4 rounded-xl border border-gray-200 relative">
        <button 
          onClick={() => setShowIOSHint(false)} 
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
        
        <p className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
            📲 Instalar no iPhone:
        </p>
        <ol className="text-xs text-gray-600 space-y-2">
            <li className="flex items-center gap-2">
                1. Toque em Compartilhar <Share size={14} className="text-blue-600"/>
            </li>
            <li className="flex items-center gap-2">
                2. Escolha <span className="font-bold">"Adicionar à Tela de Início"</span> <PlusSquare size={14} />
            </li>
        </ol>
      </div>
    );
  }

  return null;
}