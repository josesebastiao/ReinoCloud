"use client";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export default function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const onClick = (evt: any) => {
    evt.preventDefault();
    if (!promptInstall) return;
    promptInstall.prompt();
  };

  if (!supportsPWA) return null;

  return (
    <button 
      onClick={onClick}
      className="w-full mb-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg animate-pulse"
    >
      <Download size={20} /> Instalar App
    </button>
  );
}