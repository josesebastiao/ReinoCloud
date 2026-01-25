"use client";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Verifica se é login ou registro
  const isAuth = pathname === "/login" || pathname === "/register";

  return (
    <div className={`flex min-h-screen ${isAuth ? "bg-slate-900" : "bg-gray-50"}`}>
      {/* O Sidebar já tem a lógica interna para se esconder, mas aqui garantimos a estrutura */}
      <Sidebar />
      
      {/* AQUI ESTÁ A MÁGICA DO ESPAÇO EM BRANCO: */}
      <main className={`
        flex-1 transition-all duration-300 w-full
        ${isAuth ? "p-0" : "md:pl-64 p-4 md:p-8"} 
      `}>
        {/* Se for login, centraliza tudo. Se não, mostra normal */}
        {isAuth ? (
          <div className="flex items-center justify-center min-h-screen w-full">
            {children}
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}