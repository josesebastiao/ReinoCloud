"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Users, Music, Settings, DollarSign, LogOut, Menu, X, Shield, Calendar, ShieldAlert, 
  PieChart
} from "lucide-react";
import { auth } from "../lib/firebase";

// SEU EMAIL NOVAMENTE
const SUPER_ADMIN_EMAIL = "alfaministro1@gmail.com";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState("admin");
  const [userEmail, setUserEmail] = useState(""); // Novo estado

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserRole(localStorage.getItem("userRole") || "admin");
      // Agora pegamos o email também para saber se é você
      // DICA: Precisamos garantir que o Login salve 'userEmail'. Vamos ver isso no passo 3.
      setUserEmail(localStorage.getItem("userEmail") || "");
    }
  }, []);

  if (pathname && (pathname.includes("/login") || pathname.includes("/register"))) {
    return null;
  }

  const accessRules = {
    dashboard: ['admin', 'pastor', 'treasurer', 'leader', 'secretary'],
    agenda:    ['admin', 'pastor', 'leader', 'secretary'], 
    members:   ['admin', 'pastor', 'secretary'], 
    ministry:  ['admin', 'pastor', 'leader'], 
    financial: ['admin', 'pastor', 'treasurer'], 
    settings:  ['admin', 'pastor', 'treasurer'] 
  };

  const canAccess = (module: keyof typeof accessRules) => accessRules[module].includes(userRole);

  // Verifica se é VOCÊ (O dono)
  const isSuperAdmin = userEmail === SUPER_ADMIN_EMAIL;

  const menuItems = [
    ...(canAccess('dashboard') ? [{ icon: LayoutDashboard, label: "Dashboard", href: "/" }] : []),
    ...(canAccess('agenda')    ? [{ icon: Calendar, label: "Agenda Pastoral", href: "/agenda" }] : []),
    ...(canAccess('dashboard') ? [{ icon: PieChart, label: "Estatísticas", href: "/reports" }] : []),

    ...(canAccess('members')   ? [{ icon: Users, label: "Membros", href: "/members" }] : []),
    ...(canAccess('ministry')  ? [{ icon: Music, label: "Ministérios / Deptos", href: "/ministries" }] : []),
    ...(canAccess('financial') ? [{ icon: DollarSign, label: "Financeiro", href: "/financial" }] : []),
    ...(canAccess('settings')  ? [{ icon: Settings, label: "Configurações", href: "/settings" }] : []),
    
    // BOTÃO SECRETO DO CHEFE (Só aparece pra você)
    ...(isSuperAdmin ? [{ icon: ShieldAlert, label: "Painel SaaS (Admin)", href: "/admin", special: true }] : []),
  ];

  const handleLogout = () => {
    auth.signOut();
    localStorage.clear();
    router.push("/login");
  };

  return (
    <>
      {/* Botão Mobile - Corrigido z-index e cor */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 right-4 z-[60] bg-slate-900 text-white p-2 rounded-lg shadow-lg border border-slate-700"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Principal - Corrigido z-index para 50 */}
      <aside className={`
        fixed left-0 top-0 h-full bg-slate-900 text-white w-64 z-50 transition-transform duration-300 ease-in-out flex flex-col shadow-2xl
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-500">ReinoCloud</h1>
          <p className="text-xs text-slate-400">Gestão para Igrejas</p>
          
          <div className="mt-4 flex items-center gap-2 text-xs bg-slate-800 p-2 rounded text-yellow-500 border border-slate-700">
            <Shield size={12} />
            <span className="capitalize truncate max-w-[150px]">
              {isSuperAdmin ? 'Super Admin' : (userRole === 'admin' ? 'Pastor Titular' : userRole)}
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
                // Destaque especial para o botão Admin
                (item as any).special 
                  ? "bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/50"
                  : pathname === item.href 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" 
                    : "text-slate-300 hover:bg-slate-800"
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

      {/* Fundo escuro para mobile (Backdrop) */}
      {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm" />}
    </>
  );
}