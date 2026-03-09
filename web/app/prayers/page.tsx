"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChurch } from "../../contexts/ChurchContext";
import { prayerService, PrayerRequest } from "../../services/prayerService";
import {
    Heart, User, Trash2, CheckCircle2, Loader2, MessageSquareQuote, Send, MessageCircle
} from "lucide-react";

export default function PrayersPage() {
    const router = useRouter();
    const { churchId, userRole, hasPermission, loading: authLoading, churchModules } = useChurch();

    const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // Controle de resposta
    const [replyingId, setReplyingId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");

    // Segurança
    useEffect(() => {
        if (!authLoading) {
            if (churchModules === 'admin') {
                router.push('/');
                return;
            }

            if (userRole !== 'admin' && !hasPermission('pastor')) {
                router.push('/');
            }
        }
    }, [authLoading, userRole, hasPermission, router, churchModules]);

    useEffect(() => {
        if (churchId) loadPrayers();
    }, [churchId]);

    const loadPrayers = async () => {
        if (!churchId) return;
        setLoading(true);
        try {
            const data = await prayerService.listByChurch(churchId);
            setPrayers(data);
        } catch (error) {
            console.error("Erro ao carregar orações", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsPrayed = async (id: string) => {
        await prayerService.updateStatus(id, 'prayed');
        loadPrayers();
    };

    const handleSendReply = async (id: string) => {
        if (!replyText.trim()) return;
        await prayerService.respond(id, replyText);
        setReplyText("");
        setReplyingId(null);
        loadPrayers();
        alert("Resposta enviada!");
    };

    const handleDelete = async (id: string) => {
        if (confirm("Excluir este pedido permanentemente?")) {
            await prayerService.delete(id);
            loadPrayers();
        }
    };

    if (authLoading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin text-blue-600" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">

            {/* CABEÇALHO PADRONIZADO EM AZUL */}
            <div className="bg-[#1D4ED8] pt-10 pb-24 px-8 shadow-sm">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Heart className="text-blue-300" fill="currentColor" /> Caixa de Oração
                    </h1>
                    <p className="text-blue-100 text-lg opacity-90">Intercessão e cuidado pastoral.</p>
                </div>
            </div>

            {/* LISTA DE PEDIDOS */}
            <div className="max-w-4xl mx-auto px-4 md:px-0 -mt-16 relative z-10">
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
                            <Loader2 className="animate-spin text-blue-600" /> Carregando pedidos...
                        </div>
                    ) : prayers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
                            <MessageSquareQuote size={40} className="opacity-20" />
                            <p>Nenhum pedido pendente.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {prayers.map(prayer => (
                                <div key={prayer.id} className={`p-6 hover:bg-gray-50 transition flex flex-col md:flex-row gap-4 group ${prayer.status === 'prayed' ? 'opacity-60 bg-gray-50' : ''}`}>

                                    {/* Foto e Nome */}
                                    <div className="flex items-center gap-3 md:w-48 shrink-0">
                                        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-gray-100">
                                            {prayer.userPhoto ? <img src={prayer.userPhoto} className="w-full h-full object-cover" /> : <User size={24} className="w-full h-full p-2.5 text-gray-400" />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-gray-800 line-clamp-1">{prayer.userName}</h3>
                                            <p className="text-[10px] text-gray-400">
                                                {prayer.createdAt?.seconds ? new Date(prayer.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : new Date().toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Conteúdo */}
                                    <div className="flex-1">
                                        <div className="bg-blue-50 p-4 rounded-xl text-sm text-gray-700 leading-relaxed border border-blue-100 relative">
                                            <span className="absolute -top-2 left-4 text-blue-200 text-4xl font-serif h-4">“</span>
                                            <p className="relative z-10">{prayer.content}</p>
                                        </div>

                                        {/* Resposta Atual (Se houver) */}
                                        {prayer.response && (
                                            <div className="mt-3 ml-4 pl-3 border-l-2 border-green-300">
                                                <p className="text-xs text-green-700 font-bold mb-1">Sua Resposta:</p>
                                                <p className="text-sm text-gray-600 italic">"{prayer.response}"</p>
                                            </div>
                                        )}

                                        {/* Área de Responder */}
                                        {replyingId === prayer.id ? (
                                            <div className="mt-3 flex gap-2 animate-in fade-in">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-blue-200"
                                                    placeholder="Escreva uma palavra de conforto..."
                                                    value={replyText}
                                                    onChange={e => setReplyText(e.target.value)}
                                                />
                                                <button onClick={() => handleSendReply(prayer.id!)} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"><Send size={16} /></button>
                                                <button onClick={() => setReplyingId(null)} className="text-gray-400 p-2 hover:text-red-500"><CheckCircle2 size={16} /></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-3 mt-3">
                                                {prayer.status === 'prayed' ? (
                                                    <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full uppercase flex items-center gap-1">
                                                        <CheckCircle2 size={12} /> Orado
                                                    </span>
                                                ) : (
                                                    <>
                                                        <button onClick={() => { setReplyingId(prayer.id!); setReplyText(prayer.response || ""); }} className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:bg-blue-50 px-3 py-2 rounded-lg transition border border-blue-200">
                                                            <MessageCircle size={14} /> {prayer.response ? 'Editar Resposta' : 'Responder'}
                                                        </button>

                                                        <button onClick={() => handleMarkAsPrayed(prayer.id!)} className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-2">
                                                            <CheckCircle2 size={14} /> Orado
                                                        </button>
                                                    </>
                                                )}

                                                <button onClick={() => handleDelete(prayer.id!)} className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition" title="Excluir">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}