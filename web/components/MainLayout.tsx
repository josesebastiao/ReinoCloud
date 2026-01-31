"use client";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar"; // <--- AGORA VAI USAR A SIDEBAR CERTA
import InstallPWA from "./InstallPWA";
import OfflineIndicator from "./OfflineIndicator";
import { Menu, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useChurch } from "../contexts/ChurchContext";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userRole, userName } = useChurch(); // Usa o contexto global
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Se for Login ou Registro, mostra sem layout
  if (pathname === "/login" || pathname === "/register") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
        
        {/* USANDO O COMPONENTE SIDEBAR EXTERNO (O QUE TEM A LÓGICA CERTA) */}
        <div className="hidden md:block">
            <Sidebar />
        </div>

        {/* --- MENU MOBILE (TELA PEQUENA) --- */}
        {/* Mantivemos a lógica mobile aqui para não quebrar o layout responsivo */}
        {isMobileMenuOpen && (
             <div className="fixed inset-0 z-50 md:hidden flex">
                 <div className="relative z-50 w-72 h-full bg-slate-900 shadow-xl">
                     <Sidebar /> {/* Reusa a Sidebar no mobile também */}
                     <button 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="absolute top-4 right-4 text-white/50 hover:text-white"
                     >
                        ✕
                     </button>
                 </div>
                 <div onClick={() => setIsMobileMenuOpen(false)} className="flex-1 bg-black/60 backdrop-blur-sm" />
             </div>
        )}

        {/* CONTEÚDO PRINCIPAL */}
        <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-gray-50 md:pl-64">
        
        {/* HEADER MOBILE */}
        <header className="md:hidden bg-blue-900 border-b border-blue-800 px-4 py-3 flex items-center justify-between shadow-sm z-30 sticky top-0 safe-area-top print:hidden text-white">
            <div className="flex items-center gap-3">
                {pathname !== '/' ? (
                <button onClick={() => router.back()} className="p-2 -ml-2 text-blue-100 hover:bg-blue-800 rounded-full transition">
                    <ArrowLeft size={24} />
                </button>
                ) : (
                <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-blue-100 hover:bg-blue-800 rounded-lg">
                    <Menu size={24} />
                </button>
                )}
                
                <div className="flex items-center gap-2">
                    {pathname === '/' && <img src="/icon.svg" className="w-8 h-8 rounded-lg bg-blue-800/50 p-1"/>}
                    <span className="font-bold text-white text-lg tracking-tight">
                        {pathname === '/' ? 'ReinoCloud' : 'Voltar'}
                    </span>
                </div>
            </div>

            <div className="w-9 h-9 bg-blue-700 rounded-full flex items-center justify-center text-blue-100 font-bold text-sm border border-blue-600">
                {userRole ? userRole.slice(0,2).toUpperCase() : 'ME'}
            </div>
        </header>

        <div className="flex-1 overflow-auto p-0 md:p-0 pb-32 md:pb-8 relative">
            <div className="md:hidden px-4 pt-2">
                <InstallPWA />
            </div>
            {children}
        </div>

        {/* BOTTOM TAB BAR */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-40 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] print:hidden">
            <Link href="/" className={`flex flex-col items-center gap-1 ${pathname === '/' ? 'text-blue-600' : 'text-gray-400'}`}>
                <Home size={24} strokeWidth={pathname === '/' ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Início</span>
            </Link>
             <button onClick={() => setIsMobileMenuOpen(true)} className="flex flex-col items-center gap-1 text-gray-400">
                <Menu size={24} />
                <span className="text-[10px] font-medium">Menu</span>
            </button>
        </div>

        </main>
        <OfflineIndicator />
    </div>
  );
}