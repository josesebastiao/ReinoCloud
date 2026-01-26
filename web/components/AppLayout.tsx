"use client";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { useEffect, useState } from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // Detecta se é login ou registro
    if (pathname && (pathname.includes("/login") || pathname.includes("/register"))) {
      setIsAuth(true);
    } else {
      setIsAuth(false);
    }
  }, [pathname]);

  // --- MODO LOGIN (TELA CHEIA FORÇADA) ---
  if (isAuth) {
    return (
      // 'fixed inset-0 z-50' garante que cubra TUDO, sem margens brancas
      <main className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
    );
  }

  // --- MODO SISTEMA ---
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full md:pl-64 transition-all duration-300 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}