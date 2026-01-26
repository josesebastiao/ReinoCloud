"use client";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Verificação robusta: Se a URL começar com /login ou /register...
  // O "|| !pathname" protege contra erro inicial de carregamento
  const isAuth = !pathname || pathname.startsWith("/login") || pathname.startsWith("/register");

  return (
    <div className={`flex min-h-screen ${isAuth ? "bg-slate-900" : "bg-gray-50"}`}>
      {/* Sidebar: Ela já tem lógica para não aparecer no login, mas aqui garantimos a estrutura */}
      <Sidebar />
      
      {/* CORREÇÃO DO ESPAÇO BRANCO:
          Se for login (isAuth), usamos padding 0 (p-0) e removemos a margem esquerda.
          Se NÃO for login, aplicamos md:pl-64.
      */}
      <main className={`
        flex-1 transition-all duration-300 w-full
        ${isAuth ? "p-0 flex items-center justify-center" : "md:pl-64 p-4 md:p-8"} 
      `}>
        {children}
      </main>
    </div>
  );
}