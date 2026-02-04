"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChurch } from "../../contexts/ChurchContext";
import { prayerService, PrayerRequest } from "../../services/prayerService";
import { 
  Heart, User, Trash2, CheckCircle2, Loader2, MessageSquareQuote 
} from "lucide-react";

export default function PrayersPage() {
  const router = useRouter();
  const { churchId, userRole, hasPermission, loading: authLoading } = useChurch();
  
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Segurança: Apenas Admin ou Pastor acessam
  useEffect(() => {
    if (!authLoading) {
         if (userRole !== 'admin' && !hasPermission('pastor')) {
            router.push('/');
         }
    }
  }, [authLoading, userRole, hasPermission, router]);

  // Carregar dados inicial
  useEffect(() => {
    if (churchId) {
        loadPrayers();
    }
  }, [churchId]);

  const loadPrayers = async () => {
    // CORREÇÃO: Garante que churchId existe antes de chamar o serviço
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
      loadPrayers(); // Recarrega a lista para atualizar a cor
  };

  const handleDelete = async (id: string) => {
      if(confirm("Excluir este pedido de oração permanentemente?")) {
          await prayerService.delete(id);
          loadPrayers();
      }
  };

  if (authLoading) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><Loader2 className="animate-spin text-purple-600"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* CABEÇALHO */}
      <div className="bg-purple-700 pt-10 pb-24 px-8 shadow-sm">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Heart className="text-purple-300" fill="currentColor"/> Pedidos de Oração
            </h1>
            <p className="text-purple-100 text-lg opacity-90">Intercessão e cuidado pastoral.</p>
        </div>
      </div>

      {/* LISTA DE PEDIDOS */}
      <div className="max-w-4xl mx-auto px-4 md:px-0 -mt-16 relative z-10">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden min-h-[400px]">
              {loading ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
                      <Loader2 className="animate-spin"/> Carregando pedidos...
                  </div>
              ) : prayers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
                      <MessageSquareQuote size={40} className="opacity-20"/>
                      <p>Nenhum pedido de oração pendente.</p>
                  </div>
              ) : (
                  <div className="divide-y divide-gray-100">
                      {prayers.map(prayer => (
                          <div key={prayer.id} className={`p-6 hover:bg-gray-50 transition flex flex-col md:flex-row gap-4 group ${prayer.status === 'prayed' ? 'opacity-60 bg-gray-50' : ''}`}>
                              
                              {/* Foto e Nome */}
                              <div className="flex items-center gap-3 md:w-48 shrink-0">
                                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-gray-100">
                                      {prayer.userPhoto ? <img src={prayer.userPhoto} className="w-full h-full object-cover"/> : <User size={20} className="w-full h-full p-2 text-gray-400"/>}
                                  </div>
                                  <div>
                                      <h3 className="font-bold text-sm text-gray-800 line-clamp-1">{prayer.userName}</h3>
                                      <p className="text-[10px] text-gray-400">
                                          {prayer.createdAt?.seconds ? new Date(prayer.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : new Date().toLocaleDateString()}
                                      </p>
                                  </div>
                              </div>
                              
                              {/* Conteúdo do Pedido */}
                              <div className="flex-1">
                                  <div className="bg-purple-50 p-4 rounded-xl text-sm text-gray-700 leading-relaxed border border-purple-100 relative">
                                      <span className="absolute -top-2 left-4 text-purple-200 text-2xl font-serif">“</span>
                                      {prayer.content}
                                  </div>

                                  {/* Ações */}
                                  <div className="flex items-center justify-end gap-3 mt-3">
                                      {prayer.status === 'prayed' ? (
                                          <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full uppercase flex items-center gap-1">
                                              <CheckCircle2 size={12}/> Orado
                                          </span>
                                      ) : (
                                          <button onClick={() => handleMarkAsPrayed(prayer.id!)} className="text-xs font-bold text-green-600 flex items-center gap-1 hover:bg-green-50 px-3 py-2 rounded-lg transition border border-green-200">
                                              <CheckCircle2 size={14}/> Marcar como Orado
                                          </button>
                                      )}
                                      
                                      <button onClick={() => handleDelete(prayer.id!)} className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition" title="Excluir">
                                          <Trash2 size={16}/>
                                      </button>
                                  </div>
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