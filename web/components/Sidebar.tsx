"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, FolderOpen, Music, Settings, DollarSign, LogOut, Menu, X, Shield, ShieldAlert 
} from "lucide-react";
import { useChurch } from "../contexts/ChurchContext";

// SEUS EMAILS DE SUPER ADMIN (IMPORTANTE: Mantenha minúsculo)
const SUPER_ADMINS = ["alfaministro1@gmail.com", "alfaministro1@hotmail.com"];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
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

  // --- LÓGICA DE VERIFICAÇÃO ---
  const userEmail = user?.email ? user.email.toLowerCase() : "";
  const isSuperAdmin = SUPER_ADMINS.includes(userEmail);

  const menuItems = [
    ...(canAccess('dashboard') ? [{ icon: LayoutDashboard, label: "Início", href: "/" }] : []),
    ...(canAccess('secretary') ? [{ icon: FolderOpen, label: "Secretaria", href: "/secretary" }] : []),
    ...(canAccess('ministry')  ? [{ icon: Music, label: "Departamentos", href: "/ministries" }] : []),
    ...(canAccess('financial') ? [{ icon: DollarSign, label: "Tesouraria", href: "/financial" }] : []),
    ...(canAccess('settings')  ? [{ icon: Settings, label: "Configurações", href: "/settings" }] : []),
    
    // O PAINEL SAAS SÓ DEVE APARECER AQUI SE isSuperAdmin FOR TRUE
    ...(isSuperAdmin ? [{ icon: ShieldAlert, label: "Painel SaaS", href: "/admin", special: true }] : []),
  ];

  return (
    <>
      {/* ============================================================ */}
      {/* DEBUGADOR FLUTUANTE - VAI APARECER NO CANTO DA TELA FORA DO MENU */}
      {/* ============================================================ */}
      <div className="fixed bottom-4 right-4 z-[9999] bg-red-600 text-white p-4 rounded-xl shadow-2xl border-4 border-white font-mono text-xs max-w-xs break-all">
          <h3 className="font-bold border-b border-red-400 mb-2 pb-1">🕵️ DETECTOR DE ERRO</h3>
          <p><strong>Email Logado:</strong><br/>{userEmail || "(Nenhum)"}</p>
          <div className="mt-2 p-2 bg-black/20 rounded">
             <strong>Sou Super Admin?</strong>
             <span className={`ml-2 px-2 py-0.5 rounded font-bold ${isSuperAdmin ? 'bg-white text-red-600' : 'bg-green-400 text-black'}`}>
                {isSuperAdmin ? "SIM 😡" : "NÃO ✅"}
             </span>
          </div>
          {isSuperAdmin && (
             <p className="mt-2 text-[10px] leading-tight">
                ⚠️ O sistema acha que seu email está na lista de donos!
             </p>
          )}
      </div>
      {/* ============================================================ */}


      <button onClick={() => setIsOpen(!isOpen)} className="md:hidden fixed top-4 right-4 z-[60] bg-slate-900 text-white p-2 rounded-lg shadow-lg border border-slate-700">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`fixed left-0 top-0 h-full bg-red-600 text-white w-64 z-50 transition-transform duration-300 ease-in-out flex flex-col shadow-2xl border-r border-slate-800 ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        
        <div className="p-6">
          <div className="flex items-center gap-2 mb-1">
              <div className="bg-blue-600 p-1.5 rounded-lg"><Shield size={18} className="text-white"/></div>
              <h1 className="text-xl font-bold text-white tracking-tight">ReinoCloud</h1>
          </div>
          
          <div className={`mt-6 flex items-center gap-2 text-[10px] font-bold px-3 py-2 rounded-lg border uppercase tracking-wider ${isSuperAdmin ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
            <Shield size={10} />
            <span className="truncate max-w-[150px]">
                {isSuperAdmin ? 'SUPER ADMIN' : userRole === 'admin' ? 'PASTOR TITULAR' : userRole || 'Membro'}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-2">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${(item as any).special ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 mt-6" : pathname === item.href ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40 font-bold translate-x-1" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}>
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
      </aside>
      
      {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm animate-in fade-in" />}
    </>
  );
}