"use client";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Fixa */}
      <Sidebar />
      
      {/* Conteúdo Principal 
         padding-left-64 (pl-64) garante o espaço do menu (256px) 
         w-full garante que ocupe a tela toda
      */}
      <main className="flex-1 w-full md:pl-64 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}