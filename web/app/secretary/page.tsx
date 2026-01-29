"use client";
import Link from "next/link";
import { useChurch } from "../../contexts/ChurchContext"; // <--- 1. IMPORTAR CONTEXTO
import { 
  Users, Calendar, Book, BarChart3, 
  FileText, ArrowRight, ShieldCheck, Lock 
} from "lucide-react";

export default function SecretaryPage() {
  const { userRole } = useChurch(); // <--- 2. PEGAR O CARGO DO USUÁRIO
  
  // Lista de Módulos com Permissões
  const modules = [
    {
      title: "Membros",
      desc: "Cadastro de ovelhas e liderança",
      icon: <Users size={28}/>,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "hover:border-blue-300",
      link: "/members",
      allowedRoles: ['admin', 'secretary'] // <--- Só Admin e Secretária veem
    },
    {
      title: "Agenda Pastoral",
      desc: "Cultos, reuniões e eventos",
      icon: <Calendar size={28}/>,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "hover:border-purple-300",
      link: "/agenda",
      allowedRoles: ['admin', 'secretary', 'treasurer'] // Tesoureiro pode ver agenda
    },
    {
      title: "Livro de Atas",
      desc: "Registro oficial de reuniões",
      icon: <Book size={28}/>,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "hover:border-indigo-300",
      link: "/secretary/minutes",
      allowedRoles: ['admin', 'secretary']
    },
    {
      title: "Estatísticas",
      desc: "Relatórios de crescimento",
      icon: <BarChart3 size={28}/>,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "hover:border-green-300",
      link: "/reports",
      allowedRoles: ['admin', 'secretary']
    },
    {
      title: "Serviços & Doc.",
      desc: "Cartas, certificados e ofícios",
      icon: <FileText size={28}/>,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "hover:border-orange-300",
      link: "/services",
      allowedRoles: ['admin', 'secretary']
    }
  ];

  // <--- 3. FILTRAGEM DOS MÓDULOS ---
  // Só mostra o módulo se o cargo do usuário estiver na lista 'allowedRoles'
  const visibleModules = modules.filter(mod => mod.allowedRoles.includes(userRole));

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* --- CABEÇALHO AZUL (Padrão ADP) --- */}
      <div className="bg-[#1D4ED8] pt-10 pb-24 px-8 shadow-sm">
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <ShieldCheck className="text-blue-300"/> Secretaria Digital
            </h1>
            <p className="text-blue-100 text-lg opacity-90 max-w-2xl">
              Central de gestão administrativa e eclesiástica. Selecione um módulo abaixo para começar.
            </p>
        </div>
      </div>

      {/* --- GRID DE MÓDULOS (FLUTUANTE) --- */}
      <div className="max-w-6xl mx-auto px-4 md:px-0 -mt-16">
        
        {visibleModules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleModules.map((mod, index) => (
                    <Link key={index} href={mod.link} className={`bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex items-start gap-4 transition duration-300 group ${mod.border} hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden`}>
                        
                        {/* Ícone com Fundo Colorido */}
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${mod.bg} ${mod.color} shadow-inner`}>
                            {mod.icon}
                        </div>

                        {/* Textos */}
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-700 transition">
                                {mod.title}
                            </h3>
                            <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                                {mod.desc}
                            </p>
                        </div>

                        {/* Seta Hover */}
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                            <ArrowRight className="text-gray-300" size={24}/>
                        </div>

                    </Link>
                ))}
            </div>
        ) : (
            // Mensagem caso o usuário não tenha permissão para NADA nessa tela (ex: Tesoureiro muito restrito)
            <div className="bg-white p-10 rounded-3xl shadow-sm text-center border border-gray-100">
                <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock size={32}/>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Acesso Restrito</h3>
                <p className="text-gray-500 mt-2">Seu perfil de acesso ({userRole === 'treasurer' ? 'Tesouraria' : userRole}) não tem permissão para visualizar os módulos da Secretaria.</p>
                <Link href="/" className="inline-block mt-4 text-blue-600 font-bold hover:underline">Voltar ao Início</Link>
            </div>
        )}

        {/* --- RODAPÉ DA SEÇÃO --- */}
        <div className="mt-12 text-center">
            <p className="text-sm text-gray-400">
                Precisa de ajuda? Consulte o <span className="font-bold text-blue-600 cursor-pointer hover:underline">Manual do Secretário</span>.
            </p>
        </div>

      </div>
    </div>
  );
}