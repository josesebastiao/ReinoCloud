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
        {/* COR DA BARRA DE STATUS: Agora é Branca para combinar */}
        <meta name="theme-color" content="#ffffff" />
        {/* VIEWPORT: Garante que não dê zoom e use a tela toda */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
      </head>
      <body className="bg-gray-50 text-gray-900 font-sans antialiased">
        <ChurchProvider>
          {isAuthPage ? (
            children
          ) : (
            <div className="flex min-h-screen">
              
              {/* OVERLAY ESCURO (Mobile) */}
              {isSidebarOpen && (
                <div 
                  className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm transition-opacity"
                  onClick={() => setIsSidebarOpen(false)}
                />
              )}

              {/* SIDEBAR (AGORA BRANCA E CLEAN) */}
              <aside 
                className={`
                  fixed md:static inset-y-0 left-0 z-50 w-72 bg-white flex flex-col h-full shadow-2xl transition-transform duration-300 ease-in-out border-r border-gray-100
                  ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                `}
              >
                {/* Cabeçalho da Sidebar */}
                <div className="p-6 flex justify-between items-center border-b border-gray-100">
                  <div>
                    <h1 className="text-2xl font-bold text-blue-600 tracking-tight">ReinoCloud</h1>
                    <p className="text-xs text-gray-400 font-medium">Gestão para Igrejas</p>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600 bg-gray-50 p-1 rounded-full">
                    <X size={20} />
                  </button>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                  
                  <div className="md:hidden mb-4">
                    <InstallPWA />
                  </div>

                  {userRole === 'admin' && (
                     <div className="mb-4 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                        <Shield size={14} className="text-yellow-600"/>
                        <span className="text-[10px] text-yellow-700 font-bold uppercase tracking-wider">Super Admin</span>
                     </div>
                  )}

                  {menuItems.map((item) => (
                    canView(item.roles) && (
                      <Link 
                        key={item.path} 
                        href={item.path}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                          pathname === item.path 
                            ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100" // Estilo Ativo (Clean)
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900" // Estilo Inativo
                        }`}
                      >
                        <item.icon size={20} className={pathname === item.path ? "text-blue-600" : "text-gray-400"} />
                        <span>{item.name}</span>
                      </Link>
                    )
                  ))}

                  {/* Botão Admin Especial */}
                  {userRole === 'admin' && (
                    <Link 
                        href="/admin" 
                        className="mt-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition-all group"
                    >
                        <Shield size={20} className="group-hover:animate-pulse"/>
                        <span className="font-bold">Painel SaaS</span>
                    </Link>
                  )}

                </nav>

                {/* Footer Sidebar */}
                <div className="p-4 border-t border-gray-100">
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition font-medium"
                  >
                    <LogOut size={20} />
                    <span>Sair</span>
                  </button>
                </div>
              </aside>

              {/* MAIN CONTENT */}
              <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-gray-50">
                {/* Header Mobile Branco e Minimalista */}
                <header className="md:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm z-30 sticky top-0 safe-area-top">
                   <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                      <Menu size={24} />
                   </button>
                   <span className="font-bold text-gray-800 text-lg">ReinoCloud</span>
                   <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm border border-blue-200">
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