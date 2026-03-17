"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, FolderOpen, Music, Settings, DollarSign, LogOut, Shield, ShieldAlert, Megaphone, Heart, BookOpen, Globe, ChevronDown, Check, Search
} from "lucide-react";
import { useChurch } from "../contexts/ChurchContext";
import { auth } from "../lib/firebase";

const SUPER_ADMINS = ["alfaministro1@gmail.com", "alfaministro1@hotmail.com"];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const { user, churchId, churchName, userRole, hasPermission, churchModules, isHeadquarters, headquartersId, branches, switchChurch } = useChurch();
  
  const [showSwitcher, setShowSwitcher] = useState(false);
  // ESTADO DA BARRA DE PESQUISA
  const [searchTerm, setSearchTerm] = useState("");

  if (pathname && (pathname.includes("/login") || pathname.includes("/register"))) return null;

  const handleLogout = async () => {
    try { await auth.signOut(); if (onNavigate) onNavigate(); router.push("/login"); } catch (error) { console.error(error); }
  };

  const canAccess = (module: string) => {
    if (churchModules === 'admin' && ['ministry', 'posts', 'prayers'].includes(module)) return false;
    if (userRole === 'admin') return true;
    if (module === 'secretary') return hasPermission('secretary') || userRole === 'secretary';
    if (module === 'financial') return hasPermission('financial') || userRole === 'treasurer';
    if (module === 'ministry') return userRole === 'leader' || userRole === 'pastor';
    if (module === 'posts') return userRole === 'leader' || userRole === 'secretary' || hasPermission('secretary');
    if (module === 'prayers') return userRole === 'pastor' || hasPermission('pastor');
    if (module === 'settings') return userRole === 'treasurer' || userRole === 'admin';
    if (module === 'dashboard') return true;
    if (module === 'activities') return userRole === 'admin' || userRole === 'pastor' || userRole === 'leader';
    return false;
  };

  const isSuperAdmin = SUPER_ADMINS.includes(user?.email ? user.email.toLowerCase() : "");
  const getRoleLabel = () => {
    if (isSuperAdmin) return "SUPER ADMIN";
    switch (userRole) {
      case 'admin': return 'PASTOR TITULAR'; case 'secretary': return 'SECRETARIA'; case 'treasurer': return 'TESOURARIA';
      case 'leader': return 'LÍDER'; case 'deacon': return 'DIÁCONO(A)'; case 'member': return 'MEMBRO'; default: return 'MEMBRO / VISITANTE';
    }
  };

  const menuItems = [
    ...(canAccess('dashboard') ? [{ icon: LayoutDashboard, label: "Início", href: "/" }] : []),
    ...(canAccess('secretary') ? [{ icon: FolderOpen, label: "Secretaria", href: "/secretary" }] : []),
    ...(canAccess('financial') ? [{ icon: DollarSign, label: "Tesouraria", href: "/financial" }] : []),
    ...(canAccess('ministry') ? [{ icon: Music, label: "Departamentos", href: "/ministries" }] : []),
    ...(canAccess('activities') ? [{ icon: BookOpen, label: userRole === 'admin' ? "Relatório Pastoral" : "Rel. de Atividades", href: "/activities" }] : []),
    ...(isHeadquarters ? [{ icon: Globe, label: "Visão Global", href: "/rede" }] : []),
    ...(canAccess('posts') || canAccess('prayers') ? [{ icon: Megaphone, label: "Mural & Orações", href: "/posts" }] : []),
    ...(canAccess('settings') ? [{ icon: Settings, label: "Configurações", href: "/settings" }] : []),
    ...(isSuperAdmin ? [{ icon: ShieldAlert, label: "Painel SaaS", href: "/admin", special: true }] : []),
  ];

  const canSwitchChurch = isHeadquarters || headquartersId !== null;

  // FILTRO INTELIGENTE DE FILIAIS
  const filteredBranches = branches.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="w-full h-full bg-[#0F172A] text-white flex flex-col border-r border-slate-800 relative z-40">

      <div className="p-6 relative">
        <div onClick={() => canSwitchChurch && setShowSwitcher(!showSwitcher)} className={`flex items-center justify-between ${canSwitchChurch ? 'cursor-pointer hover:bg-slate-800 p-2 -mx-2 rounded-xl transition' : ''}`}>
            <div className="flex items-center gap-3 w-full">
                <img src="/icon.svg" alt="ReinoCloud" className="w-8 h-8 object-contain shrink-0" />
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg font-bold text-white tracking-tight leading-none truncate flex items-center gap-2">
                        <span className="truncate">{churchName || "Carregando..."}</span>
                        {canSwitchChurch && <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${showSwitcher ? 'rotate-180' : ''}`} />}
                    </h1>
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest truncate mt-1">
                        {headquartersId ? 'Visão: Filial' : isHeadquarters ? 'Visão: Sede' : 'Gestão para Igrejas'}
                    </p>
                </div>
            </div>
        </div>

        {/* MENU SUSPENSO COM BARRA DE PESQUISA */}
        {showSwitcher && canSwitchChurch && (
            <div className="absolute top-[75px] left-4 right-4 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in flex flex-col max-h-[400px]">
                
                <div className="p-3 border-b border-slate-700 bg-slate-800/50 flex flex-col gap-3 shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alternar Conta</span>
                    
                    {/* BARRA DE PESQUISA */}
                    {branches.length > 3 && (
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Buscar filial..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()} // Impede o clique de fechar o menu
                                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
                            />
                        </div>
                    )}
                </div>
                
                <div className="overflow-y-auto custom-scrollbar flex-1 pb-2">
                    {/* Botão da Sede */}
                    <button onClick={async () => { setShowSwitcher(false); if (headquartersId) { await switchChurch(headquartersId); window.location.href = "/"; } }} className="w-full text-left px-4 py-3 text-sm hover:bg-slate-700 transition flex items-center justify-between group">
                        <span className={!headquartersId ? 'font-bold text-white' : 'text-slate-300 group-hover:text-white transition'}>🏛️ Sede Principal</span>
                        {!headquartersId && <Check size={16} className="text-indigo-500" />}
                    </button>
                    
                    {/* Lista de Filiais Filtrada */}
                    {filteredBranches.map(branch => (
                        <button key={branch.id} onClick={async () => { setShowSwitcher(false); if (churchId !== branch.id) { await switchChurch(branch.id); window.location.href = "/"; } }} className="w-full text-left px-4 py-3 text-sm hover:bg-slate-700 transition flex items-center justify-between border-t border-slate-700/50 group">
                            <span className={`truncate pr-2 ${churchId === branch.id ? 'font-bold text-white' : 'text-slate-300 group-hover:text-white transition'}`}>📍 {branch.name}</span>
                            {churchId === branch.id && <Check size={16} className="text-indigo-500 shrink-0" />}
                        </button>
                    ))}
                    
                    {filteredBranches.length === 0 && (
                        <div className="px-4 py-6 text-center text-xs text-slate-500">
                            Nenhuma filial encontrada.
                        </div>
                    )}
                </div>
            </div>
        )}

        <div className={`mt-4 flex items-center gap-2 text-[10px] font-bold px-3 py-2 rounded-lg border uppercase tracking-wider ${isSuperAdmin ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
          <Shield size={10} /> <span className="truncate max-w-[150px]">{getRoleLabel()}</span>
        </div>

        {headquartersId && (
            <button onClick={async () => { await switchChurch(headquartersId); window.location.href = "/"; }} className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl text-xs font-bold transition shadow-lg border border-indigo-500">
                <Globe size={16} /> Voltar para Sede
            </button>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-slate-700">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href} onClick={onNavigate} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${(item as any).special ? "bg-red-500/10 text-red-400 border border-red-500/20 mt-6" : pathname === item.href ? "bg-blue-600 text-white shadow-lg font-bold translate-x-1" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}>
            <item.icon size={20} className={pathname === item.href ? "text-white" : (item as any).special ? "text-red-400" : "text-slate-500 group-hover:text-white"} />
            <span className="text-sm">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 group">
          <LogOut size={20} className="group-hover:-translate-x-1" /> <span className="text-sm font-medium">Sair do Sistema</span>
        </button>
      </div>
    </div>
  );
}