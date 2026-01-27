"use client";
import { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showSyncing, setShowSyncing] = useState(false);

  useEffect(() => {
    // Define estado inicial
    setIsOnline(navigator.onLine);

    // Ouve quando a internet cai
    const handleOffline = () => setIsOnline(false);
    
    // Ouve quando a internet volta
    const handleOnline = () => {
      setIsOnline(true);
      // Mostra um "Sincronizando..." por 3 segundos para dar feedback visual
      setShowSyncing(true);
      setTimeout(() => setShowSyncing(false), 3000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Se estiver Online e não estiver sincronizando, não mostra nada (fica limpo)
  if (isOnline && !showSyncing) return null;

  return (
    <div className={`
      fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold transition-all duration-500
      ${!isOnline ? 'bg-red-600 text-white animate-pulse' : 'bg-green-600 text-white'}
    `}>
      {!isOnline ? (
        <>
          <WifiOff size={16} />
          <span>Você está Offline. Salvando no celular...</span>
        </>
      ) : (
        <>
          <RefreshCw size={16} className="animate-spin" />
          <span>Conexão restaurada! Sincronizando...</span>
        </>
      )}
    </div>
  );
}