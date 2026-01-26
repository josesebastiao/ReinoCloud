"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Users, Music, Settings, DollarSign, LogOut, Menu, X, Shield, Calendar 
} from "lucide-react";
import { auth } from "../lib/firebase";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState("admin");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserRole(localStorage.getItem("userRole") || "admin");
    }
  }, []);

  if (pathname && (pathname.includes("/login") || pathname.includes("/register"))) {
    return null;
  }

  // --- REGRAS DE ACESSO ATUALIZADAS ---
  const accessRules = {
    dashboard: ['admin', 'pastor', 'treasurer', 'leader', 'secretary'],
    agenda:    ['admin', 'pastor', 'leader', 'secretary'], 
    members:   ['admin', 'pastor', 'secretary'], 
    ministry:  ['admin', 'pastor', 'leader'], 
    financial: ['admin', 'pastor', 'treasurer'], 
    
    // AQUI: Adicionei 'treasurer' para o Matias poder mudar a moeda
    settings:  ['admin', 'pastor', 'treasurer'] 
  };

  const canAccess = (module: keyof typeof accessRules) => accessRules[module].includes(userRole);

  const menuItems = [
    ...(canAccess('dashboard') ? [{ icon: LayoutDashboard, label: "Dashboard", href: "/" }] : []),
    ...(canAccess('agenda')    ? [{ icon: Calendar, label: "Agenda Pastoral", href: "/agenda" }] : []),
    ...(canAccess('members')   ? [{ icon: Users, label: "Membros", href: "/members" }] : []),
    ...(canAccess('ministry')  ? [{ icon: Music, label: "Ministérios / Deptos", href: "/ministries" }] : []),
    ...(canAccess('financial') ? [{ icon: DollarSign, label: "Financeiro", href: "/financial" }] : []),
    ...(canAccess('settings')  ? [{ icon: Settings, label: "Configurações", href: "/settings" }] : []),
  ];

  const handleLogout = () => {
    auth.signOut();
    localStorage.clear();
    router.push("/login");
  };

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="md:hidden fixed top-4 right-4 z-50 bg-slate-900 text-white p-2 rounded-lg shadow-lg">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`
        fixed left-0 top-0 h-full bg-slate-900 text-white w-64 z-40 transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-500">ReinoCloud</h1>
          <p className="text-xs text-slate-400">Gestão para Igrejas</p>
          
          <div className="mt-4 flex items-center gap-2 text-xs bg-slate-800 p-2 rounded text-yellow-500 border border-slate-700">
            <Shield size={12} />
            <span className="capitalize">
              {userRole === 'admin' ? 'Pastor Titular' : 
               userRole === 'secretary' ? 'Secretaria' :
               userRole === 'treasurer' ? 'Tesouraria' : userRole}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                pathname === item.href ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-slate-300 hover:text-red-400 hover:bg-slate-800 rounded-lg transition">
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>
      {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/50 z-30 md:hidden" />}
    </>
  );
}