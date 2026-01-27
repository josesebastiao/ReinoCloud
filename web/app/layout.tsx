"use client";
import "./globals.css";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, Users, FileText, Settings, LogOut, Menu, X, 
  Music, DollarSign, BookOpen, PieChart, Shield 
} from "lucide-react";
import { ChurchProvider } from "../contexts/ChurchContext";
import InstallPWA from "../components/InstallPWA";

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
    { name: "Dashboard", icon: LayoutDashboard, path: "/", roles: ["admin", "pastor", "treasurer", "secretary", "member"] },
    { name: "Secretaria", icon: FileText, path: "/secretary", roles: ["admin", "pastor", "secretary"] },
    { name: "Membros", icon: Users, path: "/members", roles: ["admin", "pastor", "secretary"] },
    { name: "Ministérios / Deptos", icon: Music, path: "/ministries", roles: ["admin", "pastor", "leader"] },
    { name: "Financeiro", icon: DollarSign, path: "/financial", roles: ["admin", "pastor", "treasurer"] },
    { name: "Relatórios", icon: PieChart, path: "/reports", roles: ["admin", "pastor"] },
    { name: "Configurações", icon: Settings, path: "/settings", roles: ["admin", "pastor"] },
  ];

  const canView = (roles: string[]) => roles.includes(userRole) || userRole === 'admin';

  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className="bg-gray-50 text-gray-900 font-sans antialiased">
        <ChurchProvider>
          {isAuthPage ? (
            children
          ) : (
            <div className="flex min-h-screen">
              
              {/* OVERLAY MOBILE */}
              {isSidebarOpen && (
                <div 
                  className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
                  onClick={() => setIsSidebarOpen(false)}
                />
              )}

              {/* SIDEBAR */}
              <aside 
                className={`
                  fixed md:static inset-y-0 left-0 z-50 w-72 bg-[#0f172a] text-white flex flex-col h-full shadow-2xl transition-transform duration-300 ease-in-out
                  ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                `}
              >
                <div className="p-6 flex justify-between items-center border-b border-gray-800">
                  <div>
                    <h1 className="text-2xl font-bold text-blue-500 tracking-tight">ReinoCloud</h1>
                    <p className="text-xs text-gray-400">Gestão para Igrejas</p>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">
                    <X size={24} />
                  </button>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                  
                  {/* Instalar App (Mobile) */}
                  <div className="md:hidden">
                    <InstallPWA />
                  </div>

                  {/* Badge de Super Admin (Visual) */}
                  {userRole === 'admin' && (
                     <div className="mb-4 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2">
                        <Shield size={14} className="text-yellow-500"/>
                        <span className="text-xs text-yellow-500 font-bold uppercase tracking-wider">Super Admin</span>
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

                  {/* BOTÃO PAINEL SAAS (VOLTOU! 🔴) */}
                  {userRole === 'admin' && (
                    <Link 
                        href="/admin" 
                        className="mt-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-red-900/30 bg-red-900/10 text-red-500 hover:bg-red-600 hover:text-white transition-all group"
                    >
                        <Shield size={20} className="group-hover:animate-pulse"/>
                        <span className="font-bold">Painel SaaS (Admin)</span>
                    </Link>
                  )}

                </nav>

                <div className="p-4 border-t border-gray-800">
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition"
                  >
                    <LogOut size={20} />
                    <span>Sair do Sistema</span>
                  </button>
                </div>
              </aside>

              {/* MAIN CONTENT */}
              <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <header className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm z-30 sticky top-0">
                   <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                      <Menu size={24} />
                   </button>
                   <span className="font-bold text-gray-800">ReinoCloud</span>
                   <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                      {userRole.slice(0,2).toUpperCase()}
                   </div>
                </header>

                <div className="flex-1 overflow-auto p-4 md:p-8 pb-24 md:pb-8">
                   {children}
                </div>
              </main>
            </div>
          )}
        </ChurchProvider>
      </body>
    </html>
  );
}