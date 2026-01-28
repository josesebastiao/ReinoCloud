"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, Users, FileText, Settings, LogOut, Menu, X, 
  Music, DollarSign, PieChart, Shield, Home, ArrowLeft 
} from "lucide-react"; // Removi BookOpen duplicado se tiver
import { BookOpen } from "lucide-react"; 
import InstallPWA from "./InstallPWA";
import OfflineIndicator from "./OfflineIndicator";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState("member");

  const isAuthPage = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role) setUserRole(role);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const menuItems = [
    // MUDANÇA 1: De "Dashboard" para "Início"
    { name: "Início", icon: Home, path: "/", roles: ["admin", "pastor", "treasurer", "secretary", "member"] },
    { name: "Secretaria", icon: FileText, path: "/secretary", roles: ["admin", "pastor", "secretary"] },
    { name: "Membros", icon: Users, path: "/members", roles: ["admin", "pastor", "secretary"] },
    { name: "Ministérios / Deptos", icon: Music, path: "/ministries", roles: ["admin", "pastor", "leader"] },
    { name: "Financeiro", icon: DollarSign, path: "/financial", roles: ["admin", "pastor", "treasurer"] },
    { name: "Relatórios", icon: PieChart, path: "/reports", roles: ["admin", "pastor"] },
    { name: "Configurações", icon: Settings, path: "/settings", roles: ["admin", "pastor"] },
  ];

  const canView = (roles: string[]) => roles.includes(userRole) || userRole === 'admin';

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
        
        {/* OVERLAY MOBILE */}
        {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
        />
        )}

        {/* SIDEBAR (PC) */}
        <aside 
        className={`
            fixed md:sticky md:top-0 md:h-screen inset-y-0 left-0 z-[60] w-72 bg-slate-900 text-white flex flex-col h-full shadow-2xl transition-transform duration-300 ease-in-out print:hidden
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        >
        <div className="p-6 flex justify-between items-center border-b border-gray-800">
            <div className="flex items-center gap-3">
                 {/* Logo na Sidebar do PC também */}
                <img src="/icon.svg" className="w-8 h-8"/>
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">ReinoCloud</h1>
                    <p className="text-[10px] text-gray-400">Gestão para Igrejas</p>
                </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <X size={24} />
            </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="md:hidden mb-4">
            <InstallPWA />
            </div>

            {userRole === 'admin' && (
                <div className="mb-4 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2">
                <Shield size={14} className="text-yellow-500"/>
                <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">Super Admin</span>
                </div>
            )}

            {menuItems.map((item) => (
            canView(item.roles) && (
                <Link 
                key={item.path} 
                href={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    pathname === item.path 
                    ? "bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/50" 
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
                >
                <item.icon size={20} />
                <span>{item.name}</span>
                </Link>
            )
            ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition">
            <LogOut size={20} /> <span>Sair</span>
            </button>
        </div>
        </aside>

        {/* CONTEÚDO PRINCIPAL */}
        <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-gray-50">
        
        {/* HEADER MOBILE (MUDANÇA: FUNDO AZUL ESCURO IGUAL ADP) */}
        <header className="md:hidden bg-blue-900 border-b border-blue-800 px-4 py-3 flex items-center justify-between shadow-sm z-30 sticky top-0 safe-area-top print:hidden text-white">
            <div className="flex items-center gap-3">
                {pathname !== '/' ? (
                <button onClick={() => router.back()} className="p-2 -ml-2 text-blue-100 hover:bg-blue-800 rounded-full transition">
                    <ArrowLeft size={24} />
                </button>
                ) : (
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-blue-100 hover:bg-blue-800 rounded-lg">
                    <Menu size={24} />
                </button>
                )}
                
                {/* LOGO NO MOBILE */}
                <div className="flex items-center gap-2">
                    {pathname === '/' && <img src="/icon.svg" className="w-8 h-8 rounded-lg bg-blue-800/50 p-1"/>}
                    <span className="font-bold text-white text-lg tracking-tight">
                        {pathname === '/' ? 'ReinoCloud' : 'Voltar'}
                    </span>
                </div>
            </div>

            <div className="w-9 h-9 bg-blue-700 rounded-full flex items-center justify-center text-blue-100 font-bold text-sm border border-blue-600">
                {userRole.slice(0,2).toUpperCase()}
            </div>
        </header>

        <div className="flex-1 overflow-auto p-0 md:p-0 pb-32 md:pb-8 relative">
            {children}
        </div>

        {/* BOTTOM TAB BAR */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-40 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] print:hidden">
            <Link href="/" className={`flex flex-col items-center gap-1 ${pathname === '/' ? 'text-blue-600' : 'text-gray-400'}`}>
                <Home size={24} strokeWidth={pathname === '/' ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Início</span>
            </Link>
            {/* ... restante dos icones ... */}
             <button onClick={() => setIsSidebarOpen(true)} className="flex flex-col items-center gap-1 text-gray-400">
                <Menu size={24} />
                <span className="text-[10px] font-medium">Menu</span>
            </button>
        </div>

        </main>
        <OfflineIndicator />
    </div>
  );
}