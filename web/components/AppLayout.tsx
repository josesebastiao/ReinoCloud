"use client";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

// REMOVA A PALAVRA 'default' DAQUI
export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Lista de páginas que NÃO devem ter menu lateral
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}