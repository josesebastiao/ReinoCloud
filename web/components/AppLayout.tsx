"use client";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Verifica se é login
  const isAuth = pathname === "/login" || pathname === "/register";

  return (
    <div className={`flex min-h-screen ${isAuth ? "bg-slate-900" : "bg-gray-50"}`}>
      {/* O Sidebar já tem a lógica interna para se esconder no login */}
      <Sidebar />
      
      {/* AQUI ESTÁ A CORREÇÃO:
         Se for login (isAuth), usamos w-full e centralizamos.
         Se NÃO for login, usamos md:pl-64 para dar espaço ao menu.
      */}
      <main className={`
        flex-1 transition-all duration-300 
        ${isAuth ? "w-full flex items-center justify-center p-4" : "w-full md:pl-64"}
      `}>
        {children}
      </main>
    </div>
  );
}