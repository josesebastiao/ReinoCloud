"use client";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import InstallPWA from "./InstallPWA";
import OfflineIndicator from "./OfflineIndicator";
import { Menu, ArrowLeft, Home, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useChurch } from "../contexts/ChurchContext";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userRole } = useChurch();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (pathname === "/login" || pathname === "/register") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
        
        {/* ================================================= */}
        {/* 1. TOPO ESCURO (NÍVEL 3 - MÁXIMO)                 */}
        {/* ================================================= */}
        {/* Barra de Status */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-12 bg-[#0F172A] z-[60]" />
        
        <aside className="hidden md:flex fixed top-0 left-0 h-screen w-64 z-50 shadow-xl">
            <Sidebar />
        </aside>

        {isMobileMenuOpen && (
             <div className="fixed inset-0 z-[70] md:hidden flex animate-in fade-in duration-200">
                 <div className="relative w-72 h-full bg-[#0F172A] shadow-2xl animate-in slide-in-from-left duration-300 pt-12">
                     <Sidebar onNavigate={() => setIsMobileMenuOpen(false)} /> 
                     <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-16 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-lg">
                        <X size={20} />
                     </button>
                 </div>
                 <div onClick={() => setIsMobileMenuOpen(false)} className="flex-1 bg-black/60 backdrop-blur-sm" />
             </div>
        )}

        <main className="flex-1 flex flex-col min-w-0 min-h-screen bg-gray-50 md:pl-64 transition-all">
        
        {/* Cabeçalho do Menu (Fixo) */}
        <header className="md:hidden fixed top-12 left-0 right-0 h-16 bg-[#0F172A] px-4 flex items-center justify-between z-[50] text-white shadow-sm">
            <div className="flex items-center gap-3">
                {pathname !== '/' ? (
                <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-300 hover:bg-slate-800 rounded-full transition"><ArrowLeft size={24} /></button>
                ) : (
                <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-slate-300 hover:bg-slate-800 rounded-lg"><Menu size={24} /></button>
                )}
                <div className="flex items-center gap-2">
                    {pathname === '/' && <img src="/icon.svg" className="w-8 h-8 rounded-lg bg-slate-800 p-1"/>}
                    <span className="font-bold text-white text-lg tracking-tight">{pathname === '/' ? 'ReinoCloud' : 'Voltar'}</span>
                </div>
            </div>
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm border border-blue-500 shadow-sm">
                {userRole ? userRole.slice(0,2).toUpperCase() : 'ME'}
            </div>
        </header>

        {/* ÁREA DE CONTEÚDO */}
        {/* pt-28: Empurra tudo 112px para baixo (Barra + Menu) */}
        <div className="flex-1 pb-24 md:pb-0 pt-28 px-0 md:p-0 md:pt-0">
            <div className="md:hidden mb-4 px-4 hidden"><InstallPWA /></div>
            {children}
        </div>

        {/* Footer */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-8 py-3 flex justify-between items-center z-[60] safe-area-bottom shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
            <Link href="/" className={`flex flex-col items-center gap-1 transition ${pathname === '/' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                <Home size={24} strokeWidth={pathname === '/' ? 2.5 : 2} /> <span className="text-[10px] font-medium">Início</span>
            </Link>
            <div className="w-12 h-12 -mt-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 text-white border-4 border-gray-50"><img src="/icon.svg" className="w-6 h-6 invert brightness-0"/></div>
             <button onClick={() => setIsMobileMenuOpen(true)} className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition"><Menu size={24} /> <span className="text-[10px] font-medium">Menu</span></button>
        </div>

        </main>
        <OfflineIndicator />
    </div>
  );
}