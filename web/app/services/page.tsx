"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { memberService } from "../../services/memberService";
import { churchService } from "../../services/churchService";
import { Member } from "../../types/member";
import { Search, Printer, X, ArrowLeft, Shield } from "lucide-react";

export default function ServicesPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [docType, setDocType] = useState<string | null>(null);

  // Configurações
  const [churchInfo, setChurchInfo] = useState<any>({
    name: "Minha Igreja", pastor: "", city: "Local", address: "", logoUrl: "", 
    customTextRecomendacao: "", customTextTransferencia: ""
  });

  useEffect(() => {
    const id = localStorage.getItem("churchId");
    if (id) {
      memberService.listByChurch(id).then(setMembers);
      churchService.getSettings(id).then(settings => {
        if (settings && settings.docs) {
            setChurchInfo({ ...settings.docs });
        }
      });
    }
  }, []);

  const filteredMembers = members.filter(m => m.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
  const handleSelectMember = (m: Member, type: string) => { setSelectedMember(m); setDocType(type); };
  const printDoc = () => window.print();
  const todayDate = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  // Funções para pegar o texto
  const getTextRecomendacao = () => {
    if (churchInfo.customTextRecomendacao) {
        return churchInfo.customTextRecomendacao
            .replace('{nome}', selectedMember?.fullName)
            .replace('{cargo}', selectedMember?.role === 'member' ? 'membro' : 'obreiro');
    }
    return `Recomendamos o(a) portador(a) desta carta, ${selectedMember?.fullName}, membro desta igreja em plena comunhão, não constando nada em nossos registros que desabone sua conduta cristã até a presente data. Solicitamos que o(a) recebam no Senhor com alegria e o(a) auxiliem no que for necessário para o seu crescimento espiritual durante sua estadia/visita.`;
  };

  const getTextTransferencia = () => {
    if (churchInfo.customTextTransferencia) {
         return churchInfo.customTextTransferencia.replace('{nome}', selectedMember?.fullName);
    }
    return `Pela presente, encaminhamos ${selectedMember?.fullName}, membro desta congregação, que solicitou sua transferência para o rol de membros de vossa igreja. Atestamos que o(a) referido(a) irmão(ã) está em plena comunhão e apto(a) a cooperar na obra do Senhor. Ao ser recebido(a) por vós, considerá-lo-emos desligado(a) de nosso rol de membros.`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 print:p-0 print:bg-white">
      {/* SELEÇÃO */}
      <div className="max-w-4xl mx-auto print:hidden">
        <div className="mb-6 flex items-center gap-2 text-gray-500 cursor-pointer hover:text-blue-600" onClick={() => router.push('/secretary')}>
            <ArrowLeft size={20}/> Voltar para Secretaria
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Serviços de Secretaria</h1>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="flex items-center bg-gray-50 border rounded-lg px-3 py-2 mb-4">
              <Search size={18} className="text-gray-400 mr-2"/><input type="text" placeholder="Buscar membro..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent outline-none w-full text-sm"/>
           </div>
           <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
              {filteredMembers.map(m => (
                  <div key={m.id} className="p-3 hover:bg-blue-50 flex justify-between items-center group">
                      <div><p className="font-bold text-gray-800">{m.fullName}</p><p className="text-xs text-gray-400 capitalize">{m.role}</p></div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => handleSelectMember(m, 'recomendacao')} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">Recomendação</button>
                          <button onClick={() => handleSelectMember(m, 'transferencia')} className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200">Transferência</button>
                      </div>
                  </div>
              ))}
           </div>
        </div>
      </div>

      {/* MODAL DA CARTA */}
      {selectedMember && docType && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm print:relative print:inset-0 print:bg-white print:block print:p-0 print:z-auto">
            
            {/* BOTÃO FECHAR */}
            <button onClick={() => setSelectedMember(null)} className="fixed top-6 right-6 z-[110] bg-red-600 text-white p-3 rounded-full hover:bg-red-700 shadow-2xl print:hidden">
                <X size={24} strokeWidth={3} />
            </button>

            {/* A CARTA (CONTAINER) */}
            {/* max-w-2xl na tela (menor) mas w-full na impressão */}
            <div className="bg-white w-full max-w-2xl min-h-[85vh] shadow-2xl rounded-sm relative flex flex-col print:shadow-none print:w-full print:max-w-none print:rounded-none">
                
                {/* Header Tela */}
                <div className="flex justify-between items-center p-4 bg-gray-100 border-b print:hidden">
                    <h3 className="font-bold text-gray-700">Visualização (A4)</h3>
                    <button onClick={printDoc} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow"><Printer size={18}/> IMPRIMIR</button>
                </div>

                {/* CONTEÚDO DO PAPEL */}
                {/* padding-8 na tela (menor), padding-16 na impressão (maior) */}
                <div className="flex-1 p-10 print:p-16 font-serif text-gray-900 leading-relaxed flex flex-col justify-between">
                    <div>
                        {/* CABEÇALHO COM LOGO */}
                        <div className="text-center border-b-2 border-gray-800 pb-6 mb-8 flex flex-col items-center">
                            {/* Logo menor na tela (h-20), normal na impressão */}
                            {churchInfo.logoUrl ? (
                                <img src={churchInfo.logoUrl} alt="Logo" className="h-20 print:h-24 mb-4 object-contain" />
                            ) : (
                                <Shield size={48} className="text-gray-300 mb-2"/>
                            )}
                            <h1 className="text-2xl print:text-3xl font-bold uppercase tracking-wide">{churchInfo.churchName || "Minha Igreja"}</h1>
                            <p className="text-xs print:text-sm italic mt-1 text-gray-600">"Uma igreja bíblica, acolhedora e missionária"</p>
                        </div>

                        {/* TÍTULO */}
                        <h2 className="text-lg print:text-xl font-bold text-center mb-8 uppercase underline decoration-2 underline-offset-4">
                            {docType === 'recomendacao' ? 'Carta de Recomendação' : 'Carta de Transferência'}
                        </h2>

                        {/* SAUDAÇÃO */}
                        <p className="text-justify mb-4 text-base print:text-lg">
                            {docType === 'recomendacao' ? 'Aos pastores e irmãos em Cristo, graça e paz.' : 'Ao Pastor da Igreja co-irmã,'}
                        </p>

                        {/* TEXTO CORPO (Texto base na tela, LG na impressão) */}
                        <p className="text-justify mb-4 indent-10 text-base print:text-lg leading-loose whitespace-pre-wrap">
                            {docType === 'recomendacao' ? getTextRecomendacao() : getTextTransferencia()}
                        </p>

                        {/* DATA */}
                        <div className="mt-10 print:mt-16 text-center text-base print:text-lg">
                            <p className="mb-10 print:mb-12">Sem mais para o momento, subscrevemo-nos em Cristo.</p>
                            <p>{churchInfo.cityAndState || "Local"}, {todayDate}.</p>
                        </div>
                    </div>

                    {/* ASSINATURAS */}
                    <div>
                        <div className="flex justify-center gap-10 print:gap-16 mb-4 mt-8 print:mt-12">
                            <div className="text-center">
                                <div className="w-48 print:w-64 border-t border-black mb-2"></div>
                                <p className="font-bold text-sm print:text-base">Secretaria</p>
                            </div>
                            <div className="text-center">
                                <div className="w-48 print:w-64 border-t border-black mb-2"></div>
                                <p className="font-bold text-sm print:text-base">{churchInfo.seniorPastor || "Pastor Responsável"}</p>
                                <p className="text-xs print:text-sm">Pastor Titular</p>
                            </div>
                        </div>
                        {churchInfo.address && (
                            <div className="text-center text-[10px] print:text-xs text-gray-400 border-t pt-4">
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