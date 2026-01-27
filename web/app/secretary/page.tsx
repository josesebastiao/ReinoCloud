"use client";
import Link from "next/link";
import { Users, Calendar, PieChart, FileText, ArrowRight, BookOpen } from "lucide-react";

export default function SecretaryPage() {
  const cards = [
    {
      title: "Membros",
      desc: "Cadastro e gestão de ovelhas",
      icon: Users,
      color: "bg-blue-600",
      href: "/members"
    },
    {
      title: "Agenda Pastoral",
      desc: "Cultos e compromissos",
      icon: Calendar,
      color: "bg-purple-600",
      href: "/agenda"
    },
    // --- NOVO CARD ---
    {
      title: "Livro de Atas",
      desc: "Registro de reuniões e assembleias",
      icon: BookOpen,
      color: "bg-indigo-600",
      href: "/secretary/minutes"
    },
    // ----------------
    {
      title: "Estatísticas",
      desc: "Relatórios de crescimento",
      icon: PieChart,
      color: "bg-green-600",
      href: "/reports"
    },
    {
      title: "Serviços",
      desc: "Cartas e Documentos",
      icon: FileText,
      color: "bg-orange-600",
      href: "/services"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Secretaria Digital</h1>
        <p className="text-gray-500 mb-8">Central de gestão administrativa da igreja.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Link key={card.title} href={card.href} className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition flex items-center gap-4">
               <div className={`${card.color} text-white p-4 rounded-xl shadow-lg group-hover:scale-110 transition`}>
                  <card.icon size={28} />
               </div>
               <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800">{card.title}</h3>
                  <p className="text-xs text-gray-500">{card.desc}</p>
               </div>
               <div className="bg-gray-50 p-2 rounded-full text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                  <ArrowRight size={18}/>
               </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}