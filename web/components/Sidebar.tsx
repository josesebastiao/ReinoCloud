"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, FolderOpen, Music, Settings, DollarSign, LogOut, Shield, ShieldAlert 
} from "lucide-react";
import { useChurch } from "../contexts/ChurchContext";

// SEUS EMAILS DE SUPER ADMIN
const SUPER_ADMINS = ["alfaministro1@gmail.com", "alfaministro1@hotmail.com"];

export function Sidebar() {
  const pathname = usePathname();
  const { user, userRole, signOutUser } = useChurch();

  if (pathname && (pathname.includes("/login") || pathname.includes("/register"))) return null;

  // Regras de Acesso
  const accessRules = {
    dashboard: ['admin', 'pastor', 'treasurer', 'leader', 'secretary'],
    secretary: ['admin', 'pastor', 'secretary'],
    ministry:  ['admin', 'pastor', 'leader'], 
    financial: ['admin', 'pastor', 'treasurer'], 
    settings:  ['admin', 'pastor', 'treasurer'] 
  };

  const canAccess = (module: keyof typeof accessRules) => {
      if (!userRole) return false; 
      return accessRules[module].includes(userRole);
  };

  const userEmail = user?.email ? user.email.toLowerCase() : "";
  const isSuperAdmin = SUPER_ADMINS.includes(userEmail);

  const menuItems = [
    ...(canAccess('dashboard') ? [{ icon: LayoutDashboard, label: "Início", href: "/" }] : []),
    ...(canAccess('secretary') ? [{ icon: FolderOpen, label: "Secretaria", href: "/secretary" }] : []),
    ...(canAccess('ministry')  ? [{ icon: Music, label: "Departamentos", href: "/ministries" }] : []),
    ...(canAccess('financial') ? [{ icon: DollarSign, label: "Tesouraria", href: "/financial" }] : []),
    ...(canAccess('settings')  ? [{ icon: Settings, label: "Configurações", href: "/settings" }] : []),
    ...(isSuperAdmin ? [{ icon: ShieldAlert, label: "Painel SaaS", href: "/admin", special: true }] : []),
  ];

  // OBS: Removemos 'fixed', 'translate', botões e estados.
  // Agora ele apenas preenche 100% do espaço que o pai (MainLayout) der para ele.
  return (
    <div className="w-full h-full bg-[#0F172A] text-white flex flex-col border-r border-slate-800">
        
        <div className="p-6">
          <div className="flex items-center gap-3 mb-1">
              <img src="/icon.svg" alt="ReinoCloud" className="w-8 h-8 object-contain" />
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight leading-none">ReinoCloud</h1>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Gestão para Igrejas</p>
              </div>
          </div>
          
          <div className={`mt-6 flex items-center gap-2 text-[10px] font-bold px-3 py-2 rounded-lg border uppercase tracking-wider ${isSuperAdmin ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
            <Shield size={10} />
            <span className="truncate max-w-[150px]">
                {isSuperAdmin ? 'SUPER ADMIN' : userRole === 'admin' ? 'PASTOR TITULAR' : userRole || 'Membro'}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-slate-700">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${(item as any).special ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 mt-6" : pathname === item.href ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40 font-bold translate-x-1" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}>
              <item.icon size={20} className={pathname === item.href ? "text-white" : (item as any).special ? "text-red-400" : "text-slate-500 group-hover:text-white transition-colors"} />
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <button onClick={signOutUser} className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 group">
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform"/>
            <span className="text-sm font-medium">Sair do Sistema</span>
          </button>
        </div>
    </div>
  );
}