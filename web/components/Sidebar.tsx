"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Users, Music, Settings, DollarSign, LogOut, Menu, X 
} from "lucide-react";
import { auth } from "../lib/firebase";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false); // Controle do menu mobile

  if (pathname === "/login" || pathname === "/register") return null;

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Users, label: "Membros", href: "/members" },
    { icon: Music, label: "Ministérios", href: "/ministries" },
    { icon: DollarSign, label: "Financeiro", href: "/financial" },
    { icon: Settings, label: "Configurações", href: "/settings" },
  ];

  const handleLogout = () => {
    auth.signOut();
    localStorage.removeItem("churchId");
    router.push("/login");
  };

  return (
    <>
      {/* Botão Mobile (Hambúrguer) - Só aparece em telas pequenas */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 right-4 z-50 bg-slate-900 text-white p-2 rounded-lg shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full bg-slate-900 text-white w-64 z-40 transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-500">ReinoCloud</h1>
          <p className="text-xs text-slate-400">Gestão para Igrejas</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)} // Fecha menu ao clicar no mobile
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-slate-300 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Fundo escuro quando menu mobile está aberto */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
        />
      )}
    </>
  );
}