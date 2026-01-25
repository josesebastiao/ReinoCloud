"use client";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Verificação blindada: Se for nulo, ou login, ou register -> TELA CHEIA
  // O "|| pathname === '/'" é só um exemplo, mas para o login use startsWith
  const isAuthPage = 
    !pathname || 
    pathname.startsWith("/login") || 
    pathname.startsWith("/register");

  if (isAuthPage) {
    // Retorna APENAS o conteúdo centralizado, fundo escuro
    return (
      <main className="min-h-screen w-full bg-slate-900 flex items-center justify-center">
        {children}
      </main>
    );
  }

  // Layout do Sistema (Com Menu)
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Fixa na Esquerda */}
      <Sidebar />
      
      {/* Conteúdo Principal:
         md:pl-64 -> Empurra o conteúdo 256px para a direita em telas de PC 
         w-full -> Garante que ocupe a largura restante
      */}
      <main className="flex-1 w-full md:pl-64 transition-all duration-300">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}