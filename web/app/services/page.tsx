"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { memberService } from "../../services/memberService";
import { churchService } from "../../services/churchService"; // Importar serviço
import { Member } from "../../types/member";
import { FileText, Search, Printer, X, ArrowLeft } from "lucide-react";

export default function ServicesPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [docType, setDocType] = useState<string | null>(null);

  // Estados dos dados da Igreja
  const [churchInfo, setChurchInfo] = useState({
    name: "Minha Igreja",
    pastor: "Pastor Responsável",
    city: "Local",
    address: ""
  });

  useEffect(() => {
    const id = localStorage.getItem("churchId");
    if (id) {
      // 1. Carrega Membros
      memberService.listByChurch(id).then(setMembers);
      
      // 2. Carrega Configurações Personalizadas
      churchService.getSettings(id).then(settings => {
        if (settings && settings.docs) {
            setChurchInfo({
                name: settings.docs.churchName || "Minha Igreja",
                pastor: settings.docs.seniorPastor || "Pastor Responsável",
                city: settings.docs.cityAndState || "Local",
                address: settings.docs.address || ""
            });
        }
      });
    }
  }, []);

  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectMember = (m: Member, type: string) => {
    setSelectedMember(m);
    setDocType(type);
  };

  const printDoc = () => window.print();

  // Data formatada com a cidade da configuração
  const todayDate = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50 p-8 print:p-0 print:bg-white">
      
      {/* SELEÇÃO (Esconde na impressão) */}
      <div className="max-w-4xl mx-auto print:hidden">
        <div className="mb-6 flex items-center gap-2 text-gray-500 cursor-pointer hover:text-blue-600" onClick={() => router.push('/secretary')}>
            <ArrowLeft size={20}/> Voltar para Secretaria
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Serviços de Secretaria</h1>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h2 className="font-bold text-gray-700 mb-4">1. Selecione o Membro</h2>
           <div className="flex items-center bg-gray-50 border rounded-lg px-3 py-2 mb-4">
              <Search size={18} className="text-gray-400 mr-2"/>
              <input type="text" placeholder="Buscar membro..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent outline-none w-full text-sm"/>
           </div>
           <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
              {filteredMembers.map(m => (
                  <div key={m.id} className="p-3 hover:bg-blue-50 flex justify-between items-center group">
                      <div><p className="font-bold text-gray-800">{m.fullName}</p><p className="text-xs text-gray-400">{m.role === 'member' ? 'Membro' : 'Líder/Obreiro'}</p></div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => handleSelectMember(m, 'recomendacao')} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">Recomendação</button>
                          <button onClick={() => handleSelectMember(m, 'transferencia')} className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200">Transferência</button>
                      </div>
                  </div>
              ))}
           </div>
        </div>
      </div>

      {/* DOCUMENTO FINAL */}
      {selectedMember && docType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm print:relative print:inset-0 print:bg-white print:block print:p-0">
            <div className="bg-white w-full max-w-3xl min-h-[80vh] shadow-2xl rounded-xl relative flex flex-col print:shadow-none print:w-full print:rounded-none">
                
                {/* Header Modal */}
                <div className="flex justify-between items-center p-4 border-b print:hidden">
                    <h3 className="font-bold text-gray-700">Pré-visualização</h3>
                    <div className="flex gap-2">
                        <button onClick={printDoc} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700"><Printer size={16}/> Imprimir</button>
                        <button onClick={() => setSelectedMember(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
                    </div>
                </div>

                {/* PAPEL A4 */}
                <div className="flex-1 p-16 font-serif text-gray-900 leading-relaxed print:p-12 flex flex-col justify-between">
                    <div>
                        {/* CABEÇALHO PERSONALIZADO */}
                        <div className="text-center border-b-2 border-gray-800 pb-6 mb-8">
                            <h1 className="text-3xl font-bold uppercase tracking-wide">{churchInfo.name}</h1>
                            <p className="text-sm italic mt-1 text-gray-600">"Uma igreja bíblica, acolhedora e missionária"</p>
                        </div>

                        {docType === 'recomendacao' && (
                            <div>
                                <h2 className="text-xl font-bold text-center mb-10 uppercase underline decoration-2 underline-offset-4">Carta de Recomendação</h2>
                                <p className="text-justify mb-6 text-lg">Aos pastores e irmãos em Cristo, graça e paz.</p>
                                <p className="text-justify mb-6 indent-12 text-lg leading-loose">
                                    Recomendamos o(a) portador(a) desta carta, <strong>{selectedMember.fullName}</strong>, 
                                    membro desta igreja em plena comunhão, não constando nada em nossos registros que desabone sua conduta cristã até a presente data.
                                </p>
                                <p className="text-justify mb-6 indent-12 text-lg leading-loose">
                                    Solicitamos que o(a) recebam no Senhor com alegria e o(a) auxiliem no que for necessário para o seu crescimento espiritual durante sua estadia/visita.
                                </p>
                            </div>
                        )}

                        {docType === 'transferencia' && (
                            <div>
                                <h2 className="text-xl font-bold text-center mb-10 uppercase underline decoration-2 underline-offset-4">Carta de Transferência</h2>
                                <p className="text-justify mb-6 text-lg">Ao Pastor da Igreja co-irmã,</p>
                                <p className="text-justify mb-6 indent-12 text-lg leading-loose">
                                    Pela presente, encaminhamos <strong>{selectedMember.fullName}</strong>, membro desta congregação, 
                                    que solicitou sua transferência para o rol de membros de vossa igreja.
                                </p>
                                <p className="text-justify mb-6 indent-12 text-lg leading-loose">
                                    Atestamos que o(a) referido(a) irmão(ã) está em plena comunhão e apto(a) a cooperar na obra do Senhor. 
                                    Ao ser recebido(a) por vós, considerá-lo-emos desligado(a) de nosso rol de membros.
                                </p>
                            </div>
                        )}

                        <div className="mt-12 text-center text-lg">
                            <p className="mb-12">Sem mais para o momento, subscrevemo-nos em Cristo.</p>
                            <p>{churchInfo.city}, {todayDate}.</p>
                        </div>
                    </div>

                    {/* RODAPÉ E ASSINATURA PERSONALIZADA */}
                    <div>
                        <div className="flex justify-center gap-16 mb-8">
                            <div className="text-center">
                                <div className="w-64 border-t border-black mb-2"></div>
                                <p className="font-bold">Secretaria</p>
                            </div>
                            <div className="text-center">
                                <div className="w-64 border-t border-black mb-2"></div>
                                <p className="font-bold">{churchInfo.pastor}</p>
                                <p className="text-xs">Pastor Responsável</p>
                            </div>
                        </div>
                        {churchInfo.address && (
                            <div className="text-center text-xs text-gray-400 border-t pt-4">
                                <p>{churchInfo.address}</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
      )}
    </div>
  );
}