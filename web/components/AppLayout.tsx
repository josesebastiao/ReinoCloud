"use client";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { useEffect, useState } from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // Detecta se é login
    if (pathname && (pathname.includes("/login") || pathname.includes("/register"))) {
      setIsAuth(true);
    } else {
      setIsAuth(false);
    }
  }, [pathname]);

  // SE FOR LOGIN: Retorna layout limpo, centralizado, fundo escuro. ZERO margem.
  if (isAuth) {
    return (
      <main className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-4">
        {children}
      </main>
    );
  }

  // SE FOR SISTEMA: Retorna layout com menu e margem (md:pl-64)
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full md:pl-64 transition-all duration-300 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}