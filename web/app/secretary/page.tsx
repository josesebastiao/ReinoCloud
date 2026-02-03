"use client";
import { useState } from "react";
import Link from "next/link";
import { useChurch } from "../../contexts/ChurchContext"; 
import { 
  Users, Calendar, Book, BarChart3, 
  FileText, ArrowRight, ShieldCheck, Lock, FolderOpen 
} from "lucide-react";

// TIPO PARA DOCUMENTOS DO ARQUIVO DIGITAL
interface ChurchDoc {
  id: string;
  name: string;
  link: string;
  type: 'pdf' | 'img' | 'other';
  date: string;
}

export default function SecretaryPage() {
  const { userRole, hasPermission } = useChurch();
  
  // Estado para o Modal de Documentos (Futuro)
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  
  // Dados Mockados para Exemplo (depois virão do Firebase)
  const [documents, setDocuments] = useState<ChurchDoc[]>([
      { id: '1', name: 'Estatuto da Igreja.pdf', link: '#', type: 'pdf', date: new Date().toISOString() },
      { id: '2', name: 'Ata de Fundação.pdf', link: '#', type: 'pdf', date: new Date().toISOString() }
  ]);

  const modules = [
    {
      title: "Membros",
      desc: "Cadastro de ovelhas e liderança",
      icon: <Users size={28}/>,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "hover:border-blue-300",
      link: "/members",
      show: hasPermission('secretary')
    },
    {
      title: "Agenda Pastoral",
      desc: "Cultos, reuniões e eventos",
      icon: <Calendar size={28}/>,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "hover:border-purple-300",
      link: "/agenda",
      show: hasPermission('secretary') || hasPermission('financial') || userRole === 'leader'
    },
    {
      title: "Livro de Atas",
      desc: "Registro oficial de reuniões",
      icon: <Book size={28}/>,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "hover:border-indigo-300",
      link: "/secretary/minutes",
      show: hasPermission('secretary')
    },
    {
      title: "Estatísticas",
      desc: "Relatórios de crescimento",
      icon: <BarChart3 size={28}/>,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "hover:border-green-300",
      link: "/reports",
      show: hasPermission('secretary')
    },
    {
      title: "Serviços & Doc.",
      desc: "Cartas, certificados e ofícios",
      icon: <FileText size={28}/>,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "hover:border-orange-300",
      link: "/services",
      show: hasPermission('secretary')
    },
    // NOVO MÓDULO: ARQUIVO DIGITAL
    {
      title: "Arquivo Digital",
      desc: "Documentos e contratos na nuvem",
      icon: <FolderOpen size={28}/>,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "hover:border-red-300",
      link: "#", // Por enquanto sem link, abre modal depois
      action: () => setIsDocModalOpen(true),
      show: hasPermission('secretary')
    }
  ];

  const visibleModules = modules.filter(mod => {
      if (userRole === 'admin') return true;
      return mod.show;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* CABEÇALHO */}
      <div className="bg-[#1D4ED8] pt-10 pb-24 px-8 shadow-sm">
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <ShieldCheck className="text-blue-300"/> Secretaria Digital
            </h1>
            <p className="text-blue-100 text-lg opacity-90 max-w-2xl">
              Central de gestão administrativa e eclesiástica.
            </p>
        </div>
      </div>

      {/* GRID DE MÓDULOS */}
      <div className="max-w-6xl mx-auto px-4 md:px-0 -mt-16">
        
        {visibleModules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleModules.map((mod, index) => (
                    <div 
                        key={index} 
                        onClick={mod.action ? mod.action : undefined} 
                    >
                        {mod.action ? (
                            // Botão com Ação (Arquivo Digital)
                            <div className={`cursor-pointer bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex items-start gap-4 transition duration-300 group ${mod.border} hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden h-full`}>
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${mod.bg} ${mod.color} shadow-inner`}>
                                    {mod.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-700 transition">{mod.title}</h3>
                                    <p className="text-sm text-gray-400 mt-1 leading-relaxed">{mod.desc}</p>
                                </div>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                    <ArrowRight className="text-gray-300" size={24}/>
                                </div>
                            </div>
                        ) : (
                            // Link Normal
                            <Link href={mod.link} className={`bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex items-start gap-4 transition duration-300 group ${mod.border} hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden h-full`}>
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${mod.bg} ${mod.color} shadow-inner`}>
                                    {mod.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-700 transition">{mod.title}</h3>
                                    <p className="text-sm text-gray-400 mt-1 leading-relaxed">{mod.desc}</p>
                                </div>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                    <ArrowRight className="text-gray-300" size={24}/>
                                </div>
                            </Link>
                        )}
                    </div>
                ))}
            </div>
        ) : (
            <div className="bg-white p-10 rounded-3xl shadow-sm text-center border border-gray-100">
                <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock size={32}/>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Acesso Restrito</h3>
                <p className="text-gray-500 mt-2">Você não possui permissões de secretaria habilitadas.</p>
                <Link href="/" className="inline-block mt-4 text-blue-600 font-bold hover:underline">Voltar ao Início</Link>
            </div>
        )}

        <div className="mt-12 text-center">
            <p className="text-sm text-gray-400">
                Precisa de ajuda? Consulte o <span className="font-bold text-blue-600 cursor-pointer hover:underline">Manual do Secretário</span>.
            </p>
        </div>

      </div>

      {/* MODAL ARQUIVO DIGITAL (Exemplo Visual) */}
      {isDocModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><FolderOpen className="text-red-600"/> Arquivo Digital</h2>
                    <button onClick={() => setIsDocModalOpen(false)} className="text-gray-400 hover:text-red-500 font-bold">FECHAR</button>
                </div>
                
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6 text-sm text-blue-700">
                    💡 <strong>Dica SaaS:</strong> Para não lotar o sistema, armazene os arquivos pesados (PDFs grandes, vídeos) no Google Drive da igreja e cadastre apenas o link aqui.
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {documents.map(doc => (
                        <div key={doc.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 transition group">
                            <div className="flex items-center gap-3">
                                <div className="bg-red-100 text-red-600 p-2.5 rounded-lg"><FileText size={20}/></div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">{doc.name}</p>
                                    <p className="text-[10px] text-gray-400">{new Date(doc.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <a href={doc.link} target="_blank" className="text-xs font-bold text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition">
                                Abrir ↗
                            </a>
                        </div>
                    ))}
                    {documents.length === 0 && <p className="text-center text-gray-400 py-4">Nenhum arquivo cadastrado.</p>}
                </div>

                <button className="w-full mt-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition flex justify-center items-center gap-2">
                    + Adicionar Novo Arquivo
                </button>
            </div>
        </div>
      )}

    </div>
  );
}