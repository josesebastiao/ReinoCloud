"use client";
import { useState, useEffect } from "react";
import { useChurch } from "../../contexts/ChurchContext";
import { memberService, Member } from "../../services/memberService";
import { 
  FileText, Printer, Search, FileBadge, ArrowRightLeft, 
  MapPin, Calendar, Loader2, ShieldCheck, User 
} from "lucide-react";

export default function ServicesPage() {
  const { churchId, churchName, logoUrl, userName } = useChurch(); // Pegamos a logo aqui
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Controle dos Modais
  const [selectedDoc, setSelectedDoc] = useState<'recommendation' | 'transfer' | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [search, setSearch] = useState("");
  const [obs, setObs] = useState(""); // Observação extra para a carta

  useEffect(() => {
    if (churchId) loadMembers();
  }, [churchId]);

  const loadMembers = async () => {
    try {
      const list = await memberService.listByChurch(churchId);
      setMembers(list);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const filteredMembers = members.filter(m => m.fullName.toLowerCase().includes(search.toLowerCase()));

  // --- FUNÇÃO DE IMPRESSÃO (AQUI ESTÁ A CORREÇÃO DA LOGO) ---
  const handlePrint = () => {
    if (!selectedMember) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

    // HTML da Carta
    const htmlContent = `
      <html>
        <head>
          <title>Documento - ${churchName}</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; text-align: center; }
            .header { margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .logo { width: 100px; height: 100px; object-fit: contain; margin-bottom: 10px; }
            .title { font-size: 24px; font-weight: bold; text-transform: uppercase; margin: 10px 0; }
            .content { font-size: 18px; line-height: 1.8; text-align: justify; margin: 40px 0; }
            .footer { margin-top: 80px; display: flex; justify-content: space-around; }
            .signature { border-top: 1px solid #000; padding-top: 10px; width: 40%; font-weight: bold; }
            .meta { font-size: 12px; color: #999; margin-top: 50px; }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" class="logo" />` : ''}
            <div class="title">${churchName}</div>
            <div style="font-size: 14px; color: #666;">Departamento de Secretaria</div>
          </div>

          <h2>${selectedDoc === 'recommendation' ? 'CARTA DE RECOMENDAÇÃO' : 'CARTA DE TRANSFERÊNCIA'}</h2>

          <div class="content">
            <p>
              Recomendamos aos amados irmãos em Cristo o portador(a) desta, o(a) irmão(ã) 
              <strong>${selectedMember.fullName.toUpperCase()}</strong>, membro desta igreja em plena comunhão, 
              não constando nada, até a presente data, que desabone sua conduta cristã.
            </p>
            
            ${selectedDoc === 'transfer' ? `
              <p>Solicitamos que o(a) mesmo(a) seja recebido(a) como membro dessa amada igreja, cessando assim suas responsabilidades conosco.</p>
            ` : ''}

            ${obs ? `<p><strong>Observação:</strong> ${obs}</p>` : ''}

            <p>Sem mais para o momento, subscrevemo-nos em Cristo.</p>
          </div>

          <p style="text-align: right; margin-top: 40px;">${today}</p>

          <div class="footer">
            <div class="signature">Pastor Responsável</div>
            <div class="signature">Secretaria</div>
          </div>

          <div class="meta">Gerado digitalmente pelo sistema ReinoCloud</div>
          
          <script>
            window.print();
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* CABEÇALHO AZUL */}
      <div className="bg-[#1D4ED8] pt-10 pb-24 px-8 shadow-sm">
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <FileText className="text-blue-300"/> Serviços & Documentos
            </h1>
            <p className="text-blue-100 text-lg opacity-90">Emissão de cartas e certificados oficiais.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-0 -mt-16">
          
          {/* SELEÇÃO DE TIPO DE DOCUMENTO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div 
                onClick={() => { setSelectedDoc('recommendation'); setSelectedMember(null); }}
                className={`bg-white p-6 rounded-3xl shadow-xl cursor-pointer border-2 transition ${selectedDoc === 'recommendation' ? 'border-blue-500 ring-4 ring-blue-50' : 'border-transparent hover:border-blue-200'}`}
              >
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                      <FileBadge size={28}/>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Carta de Recomendação</h3>
                  <p className="text-sm text-gray-500 mt-2">Para membros que vão visitar outras igrejas ou participar de eventos.</p>
              </div>

              <div 
                onClick={() => { setSelectedDoc('transfer'); setSelectedMember(null); }}
                className={`bg-white p-6 rounded-3xl shadow-xl cursor-pointer border-2 transition ${selectedDoc === 'transfer' ? 'border-orange-500 ring-4 ring-orange-50' : 'border-transparent hover:border-orange-200'}`}
              >
                  <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-4">
                      <ArrowRightLeft size={28}/>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Carta de Transferência</h3>
                  <p className="text-sm text-gray-500 mt-2">Documento oficial para mudança definitiva de membro para outra congregação.</p>
              </div>
          </div>

          {/* ÁREA DE EMISSÃO (SÓ APARECE SE TIVER SELECIONADO UM TIPO) */}
          {selectedDoc && (
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
                      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          {selectedDoc === 'recommendation' ? <FileBadge className="text-blue-500"/> : <ArrowRightLeft className="text-orange-500"/>}
                          Emitir {selectedDoc === 'recommendation' ? 'Recomendação' : 'Transferência'}
                      </h2>
                      <button onClick={() => setSelectedDoc(null)} className="text-gray-400 hover:text-red-500 font-bold text-sm">CANCELAR</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* LADO ESQUERDO: BUSCA */}
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Selecione o Membro</label>
                          <div className="relative mb-4">
                              <Search className="absolute left-3 top-3 text-gray-400" size={20}/>
                              <input 
                                type="text" 
                                placeholder="Buscar membro..." 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-10 p-3 border rounded-xl bg-gray-50 focus:bg-white transition outline-none focus:ring-2 ring-blue-100"
                              />
                          </div>
                          
                          <div className="h-64 overflow-y-auto border rounded-xl p-2 custom-scrollbar bg-gray-50">
                              {filteredMembers.map(m => (
                                  <div 
                                    key={m.id} 
                                    onClick={() => setSelectedMember(m)}
                                    className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition mb-1 ${selectedMember?.id === m.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white hover:shadow-sm text-gray-700'}`}
                                  >
                                      <div className={`p-2 rounded-full ${selectedMember?.id === m.id ? 'bg-white/20' : 'bg-gray-200'}`}><User size={16}/></div>
                                      <span className="font-bold text-sm">{m.fullName}</span>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* LADO DIREITO: PREVIEW E AÇÃO */}
                      <div className="flex flex-col h-full">
                          <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Detalhes da Emissão</label>
                          
                          <div className="flex-1 bg-gray-50 rounded-xl p-6 border border-dashed border-gray-300 flex flex-col justify-center items-center text-center">
                              {selectedMember ? (
                                  <div className="animate-in zoom-in">
                                      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                          <ShieldCheck size={40}/>
                                      </div>
                                      <h3 className="text-xl font-bold text-gray-800">{selectedMember.fullName}</h3>
                                      <p className="text-sm text-gray-500 mb-4">{selectedMember.role} • {selectedMember.status === 'active' ? 'Ativo' : 'Inativo'}</p>
                                      
                                      <textarea 
                                        placeholder="Observação (Opcional)..." 
                                        value={obs}
                                        onChange={e => setObs(e.target.value)}
                                        className="w-full p-3 border rounded-xl text-sm mb-4"
                                        rows={2}
                                      />

                                      <button 
                                        onClick={handlePrint}
                                        className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition shadow-xl flex items-center gap-2 mx-auto"
                                      >
                                          <Printer size={20}/> Imprimir Documento
                                      </button>
                                  </div>
                              ) : (
                                  <p className="text-gray-400">Selecione um membro na lista ao lado para gerar o documento.</p>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          )}

      </div>
    </div>
  );
}