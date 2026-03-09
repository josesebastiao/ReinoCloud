"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useChurch } from "../../contexts/ChurchContext";
import { documentService, ChurchDoc } from "../../services/documentService";
import {
    Users, Calendar, Book, BarChart3,
    FileText, ArrowRight, ShieldCheck, Lock, FolderOpen,
    Link as LinkIcon, Save, X, Trash2, Plus, Loader2, Package
} from "lucide-react";

export default function SecretaryPage() {
    const { userRole, hasPermission, churchId } = useChurch();

    // ESTADOS DO ARQUIVO DIGITAL
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [isAddingDoc, setIsAddingDoc] = useState(false);
    const [documents, setDocuments] = useState<ChurchDoc[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [savingDoc, setSavingDoc] = useState(false);

    // FORMULÁRIO NOVO DOC
    const [newDocData, setNewDocData] = useState({ name: "", link: "" });

    // Carregar documentos ao abrir
    useEffect(() => {
        if (churchId) {
            // Carrega documentos se tiver permissão, mas não bloqueia a página se não tiver
            loadDocuments();
        }
    }, [churchId]);

    const loadDocuments = async () => {
        if (!churchId) return;
        setLoadingDocs(true);
        try {
            const docs = await documentService.listByChurch(churchId);
            setDocuments(docs);
        } catch (error) { console.error(error); }
        finally { setLoadingDocs(false); }
    };

    const handleSaveDoc = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!churchId) return;

        setSavingDoc(true);
        try {
            await documentService.create({
                churchId,
                name: newDocData.name,
                link: newDocData.link,
                date: new Date().toISOString()
            });

            setNewDocData({ name: "", link: "" });
            setIsAddingDoc(false);
            await loadDocuments();
        } catch (error) {
            alert("Erro ao salvar arquivo.");
        } finally {
            setSavingDoc(false);
        }
    };

    const handleDeleteDoc = async (id: string) => {
        if (confirm("Tem certeza que deseja remover este arquivo da lista?")) {
            await documentService.delete(id);
            loadDocuments();
        }
    };

    // LISTA DE SERVIÇOS (MÓDULOS)
    const modules = [
        {
            title: "Membros",
            desc: "Cadastro de ovelhas e liderança",
            icon: <Users size={28} />,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "hover:border-blue-300",
            link: "/members",
            show: true // Sempre visível na secretaria
        },
        {
            title: "Agenda Pastoral",
            desc: "Cultos, reuniões e eventos",
            icon: <Calendar size={28} />,
            color: "text-purple-600",
            bg: "bg-purple-50",
            border: "hover:border-purple-300",
            link: "/agenda",
            show: true
        },
        {
            title: "Livro de Atas",
            desc: "Registro oficial de reuniões",
            icon: <Book size={28} />,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            border: "hover:border-indigo-300",
            link: "/secretary/minutes", // Rota precisa existir ou criar depois
            show: true
        },
        {
            title: "Estatísticas",
            desc: "Relatórios de crescimento",
            icon: <BarChart3 size={28} />,
            color: "text-green-600",
            bg: "bg-green-50",
            border: "hover:border-green-300",
            link: "/reports", // Rota futura
            show: true
        },
        {
            title: "Serviços & Doc.",
            desc: "Cartas, certificados e ofícios",
            icon: <FileText size={28} />,
            color: "text-orange-600",
            bg: "bg-orange-50",
            border: "hover:border-orange-300",
            link: "/services", // Rota futura
            show: true
        },
        {
            title: "Arquivo Digital",
            desc: "Documentos e contratos na nuvem",
            icon: <FolderOpen size={28} />,
            color: "text-red-600",
            bg: "bg-red-50",
            border: "hover:border-red-300",
            link: "#",
            action: () => setIsDocModalOpen(true),
            show: true
        },
        {
            title: "Patrimônio",
            desc: "Controle de bens e equipamentos",
            icon: <Package size={28} />,
            color: "text-teal-600",
            bg: "bg-teal-50",
            border: "hover:border-teal-300",
            link: "/secretary/assets",
            show: true
        }
    ];

    // Se não for secretaria/admin/pastor, bloqueia tudo
    if (userRole !== 'admin' && userRole !== 'pastor' && userRole !== 'secretary' && !hasPermission('secretary')) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-400">
                    <Lock size={40} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Acesso Restrito</h1>
                <p className="text-gray-500 mt-2 max-w-md">Esta área é exclusiva para a equipe de secretaria.</p>
                <Link href="/" className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
                    Voltar ao Início
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">

            {/* CABEÇALHO */}
            <div className="bg-[#1D4ED8] pt-10 pb-24 px-8 shadow-sm">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <ShieldCheck className="text-blue-300" /> Secretaria Digital
                    </h1>
                    <p className="text-blue-100 text-lg opacity-90 max-w-2xl">
                        Central de gestão administrativa e eclesiástica.
                    </p>
                </div>
            </div>

            {/* GRID DE MÓDULOS */}
            <div className="max-w-6xl mx-auto px-4 md:px-0 -mt-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((mod, index) => (
                        <div key={index} onClick={mod.action ? mod.action : undefined}>
                            {mod.action ? (
                                <div className={`cursor-pointer bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex items-start gap-4 transition duration-300 group ${mod.border} hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden h-full`}>
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${mod.bg} ${mod.color} shadow-inner`}>
                                        {mod.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-700 transition">{mod.title}</h3>
                                        <p className="text-sm text-gray-400 mt-1 leading-relaxed">{mod.desc}</p>
                                    </div>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                        <ArrowRight className="text-gray-300" size={24} />
                                    </div>
                                </div>
                            ) : (
                                <Link href={mod.link} className={`bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex items-start gap-4 transition duration-300 group ${mod.border} hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden h-full`}>
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${mod.bg} ${mod.color} shadow-inner`}>
                                        {mod.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-700 transition">{mod.title}</h3>
                                        <p className="text-sm text-gray-400 mt-1 leading-relaxed">{mod.desc}</p>
                                    </div>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                        <ArrowRight className="text-gray-300" size={24} />
                                    </div>
                                </Link>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <p className="text-sm text-gray-400">
                        Precisa de ajuda? Consulte o <span className="font-bold text-blue-600 cursor-pointer hover:underline">Manual do Secretário</span>.
                    </p>
                </div>
            </div>

            {/* --- MODAL ARQUIVO DIGITAL --- */}
            {isDocModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <FolderOpen className="text-red-600" /> Arquivo Digital
                            </h2>
                            <button onClick={() => { setIsDocModalOpen(false); setIsAddingDoc(false); }} className="text-gray-400 hover:text-red-500 font-bold text-sm bg-gray-50 px-3 py-1 rounded-lg">FECHAR</button>
                        </div>

                        {isAddingDoc ? (
                            <form onSubmit={handleSaveDoc} className="space-y-4 animate-in slide-in-from-right-4">
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-2">
                                    <h3 className="text-sm font-bold text-red-700 mb-1">Novo Documento</h3>
                                    <p className="text-xs text-red-500">Cole o link do Google Drive, Dropbox ou OneDrive.</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Nome do Documento</label>
                                    <input required type="text" value={newDocData.name} onChange={e => setNewDocData({ ...newDocData, name: e.target.value })} className="w-full p-3 border rounded-xl mt-1 outline-none focus:ring-2 ring-red-100" placeholder="Ex: Contrato de Aluguel 2026" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Link (URL)</label>
                                    <div className="relative mt-1">
                                        <LinkIcon className="absolute left-3 top-3 text-gray-400" size={18} />
                                        <input required type="url" value={newDocData.link} onChange={e => setNewDocData({ ...newDocData, link: e.target.value })} className="w-full pl-10 p-3 border rounded-xl outline-none focus:ring-2 ring-red-100" placeholder="https://drive.google.com/..." />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setIsAddingDoc(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition">Cancelar</button>
                                    <button type="submit" disabled={savingDoc} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition flex justify-center items-center gap-2">
                                        {savingDoc ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Salvar
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6 text-sm text-blue-700">
                                    💡 <strong>Dica SaaS:</strong> Para não lotar o sistema, armazene arquivos pesados no Google Drive da igreja e cadastre apenas o link aqui.
                                </div>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar min-h-[150px]">
                                    {loadingDocs ? (
                                        <div className="text-center py-8 text-gray-400"><Loader2 className="animate-spin inline mr-2" /> Carregando arquivos...</div>
                                    ) : documents.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            <FolderOpen size={32} className="mx-auto mb-2 opacity-20" />
                                            <p className="text-xs">Nenhum arquivo cadastrado.</p>
                                        </div>
                                    ) : (
                                        documents.map(doc => (
                                            <div key={doc.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 transition group">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="bg-red-100 text-red-600 p-2.5 rounded-lg shrink-0"><FileText size={20} /></div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-gray-800 truncate">{doc.name}</p>
                                                        <p className="text-[10px] text-gray-400">{new Date(doc.date).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <a href={doc.link} target="_blank" className="text-xs font-bold text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition">Abrir ↗</a>
                                                    <button onClick={() => handleDeleteDoc(doc.id!)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <button onClick={() => setIsAddingDoc(true)} className="w-full mt-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition flex justify-center items-center gap-2">
                                    <Plus size={20} /> Adicionar Novo Arquivo
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}