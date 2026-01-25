"use client";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Verificação mais segura (se começa com /login ou /register)
  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/register");

  if (isAuthPage) {
    // Retorna APENAS o conteúdo (Login limpo), sem Sidebar
    return <main className="w-full h-screen bg-slate-900 flex items-center justify-center">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full md:pl-64 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}