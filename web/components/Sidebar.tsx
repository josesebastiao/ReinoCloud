"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Music, 
  Settings, 
  DollarSign, // <--- VERIFIQUE SE ISTO ESTÁ AQUI
  LogOut 
} from "lucide-react";
import { auth } from "../lib/firebase";
import { useRouter } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Esconde sidebar no login e registro
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Users, label: "Membros", href: "/members" },
    { icon: Music, label: "Ministérios", href: "/ministries" },
    { icon: DollarSign, label: "Financeiro", href: "/financial" }, // <--- O LINK ESTÁ AQUI
    { icon: Settings, label: "Configurações", href: "/settings" },
  ];

  const handleLogout = () => {
    auth.signOut();
    localStorage.removeItem("churchId");
    router.push("/login");
  };

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-500">ReinoCloud</h1>
        <p className="text-xs text-slate-400">Gestão para Igrejas</p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? "bg-blue-600 text-white" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
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
  );
}