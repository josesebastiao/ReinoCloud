"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; 
import { 
  LayoutDashboard, FolderOpen, Music, Settings, DollarSign, LogOut, Shield, ShieldAlert, Megaphone, Heart 
} from "lucide-react";
import { useChurch } from "../contexts/ChurchContext";
import { auth } from "../lib/firebase"; 

const SUPER_ADMINS = ["alfaministro1@gmail.com", "alfaministro1@hotmail.com"];

interface SidebarProps {
    onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter(); 
  
  const { user, userRole, hasPermission } = useChurch();

  if (pathname && (pathname.includes("/login") || pathname.includes("/register"))) return null;

  const handleLogout = async () => {
      try {
          await auth.signOut();
          if (onNavigate) onNavigate(); 
          router.push("/login");
      } catch (error) {
          console.error("Erro ao sair:", error);
      }
  };

  const canAccess = (module: string) => {
      if (userRole === 'admin') return true;

      if (module === 'secretary') return hasPermission('secretary') || userRole === 'secretary';
      if (module === 'financial') return hasPermission('financial') || userRole === 'treasurer';
      if (module === 'ministry') return userRole === 'leader' || userRole === 'pastor';
      if (module === 'posts') return userRole === 'leader' || userRole === 'secretary' || hasPermission('secretary'); 
      if (module === 'prayers') return userRole === 'pastor' || hasPermission('pastor'); 
      if (module === 'settings') return userRole === 'treasurer' || userRole === 'admin';
      if (module === 'dashboard') return true;

      return false;
  };

  const userEmail = user?.email ? user.email.toLowerCase() : "";
  const isSuperAdmin = SUPER_ADMINS.includes(userEmail);

  // --- NOVA FUNÇÃO PARA TRADUZIR O CARGO CORRETAMENTE ---
  const getRoleLabel = () => {
      if (isSuperAdmin) return "SUPER ADMIN";
      
      switch (userRole) {
          case 'admin': return 'PASTOR TITULAR';
          case 'secretary': return 'SECRETARIA';
          case 'treasurer': return 'TESOURARIA';
          case 'leader': return 'LÍDER';
          case 'deacon': return 'DIÁCONO(A)';
          case 'member': return 'MEMBRO';
          default: return 'MEMBRO / VISITANTE';
      }
  };

  // --- MENU REORGANIZADO CONFORME SOLICITADO ---
  const menuItems = [
    ...(canAccess('dashboard') ? [{ icon: LayoutDashboard, label: "Início", href: "/" }] : []),
    ...(canAccess('secretary') ? [{ icon: FolderOpen, label: "Secretaria", href: "/secretary" }] : []),
    ...(canAccess('financial') ? [{ icon: DollarSign, label: "Tesouraria", href: "/financial" }] : []),
    ...(canAccess('ministry')  ? [{ icon: Music, label: "Departamentos", href: "/ministries" }] : []),
    ...(canAccess('posts')     ? [{ icon: Megaphone, label: "Mural de Avisos", href: "/posts" }] : []),
    ...(canAccess('prayers')   ? [{ icon: Heart, label: "Pedidos de Oração", href: "/prayers" }] : []), 
    ...(canAccess('settings')  ? [{ icon: Settings, label: "Configurações", href: "/settings" }] : []),
    ...(isSuperAdmin ? [{ icon: ShieldAlert, label: "Painel SaaS", href: "/admin", special: true }] : []),
  ];

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
                {getRoleLabel()}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-slate-700">
          {menuItems.map((item) => (
            <Link 
                key={item.href} 
                href={item.href} 
                onClick={onNavigate} 
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${(item as any).special ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 mt-6" : pathname === item.href ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40 font-bold translate-x-1" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}
            >
              <item.icon size={20} className={pathname === item.href ? "text-white" : (item as any).special ? "text-red-400" : "text-slate-500 group-hover:text-white transition-colors"} />
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 group">
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform"/>
            <span className="text-sm font-medium">Sair do Sistema</span>
          </button>
        </div>
    </div>
  );
}