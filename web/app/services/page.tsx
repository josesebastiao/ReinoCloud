"use client";
import { useState, useEffect } from "react";
import { useChurch } from "../../contexts/ChurchContext";
import { memberService, Member } from "../../services/memberService";
import { 
  FileText, Printer, Search, FileBadge, ArrowRightLeft, 
  User, X, Building2, Loader2, ShieldCheck 
} from "lucide-react";

export default function ServicesPage() {
  const { churchId, churchName, logoUrl } = useChurch(); 
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false); // Estado para mostrar feedback durante conversão
  
  // Controle dos Modais
  const [selectedDoc, setSelectedDoc] = useState<'recommendation' | 'transfer' | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [search, setSearch] = useState("");
  const [obs, setObs] = useState(""); 

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

  // --- FUNÇÃO MÁGICA: CONVERTER URL PARA BASE64 ---
  const toDataURL = async (url: string) => {
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Erro ao converter imagem:", e);
        return ""; // Se der erro, retorna vazio e imprime sem logo
    }
  };

  // --- IMPRESSÃO BLINDADA ---
  const handlePrint = async () => {
    if (!selectedMember) return;
    setPrinting(true); // Trava o botão para o usuário saber que está processando

    // 1. Converte a logo ANTES de abrir a janela
    let finalLogo = "";
    if (logoUrl) {
        finalLogo = await toDataURL(logoUrl);
    }

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
        setPrinting(false);
        alert("Permita pop-ups para imprimir!");
        return;
    }

    const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

    const htmlContent = `
      <html>
        <head>
          <title>Documento - ${churchName}</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; text-align: center; }
            .header { margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            /* AQUI: Garantimos que a imagem fique contida e centralizada */
            .logo { max-width: 120px; max-height: 120px; object-fit: contain; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto; }
            .title { font-size: 24px; font-weight: bold; text-transform: uppercase; margin: 10px 0; }
            .content { font-size: 18px; line-height: 1.8; text-align: justify; margin: 40px 0; }
            .footer { margin-top: 80px; display: flex; justify-content: space-around; }
            .signature { border-top: 1px solid #000; padding-top: 10px; width: 40%; font-weight: bold; }
            .meta { font-size: 12px; color: #999; margin-top: 50px; }
            
            @media print {
                @page { margin: 2cm; }
                body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${finalLogo ? `<img src="${finalLogo}" class="logo" />` : ''}
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
            ${selectedDoc === 'transfer' ? `<p>Solicitamos que o(a) mesmo(a) seja recebido(a) como membro dessa amada igreja, cessando assim suas responsabilidades conosco.</p>` : ''}
            ${obs ? `<p><strong>Observação:</strong> ${obs}</p>` : ''}
            <p>Sem mais para o momento, subscrevemo-nos em Cristo.</p>
          </div>
          
          <p style="text-align: right; margin-top: 40px;">${today}</p>
          
          <div class="footer"><div class="signature">Pastor Responsável</div><div class="signature">Secretaria</div></div>
          <div class="meta">Gerado digitalmente pelo sistema ReinoCloud</div>
          
          <script>
             // Pequeno delay de segurança apenas para garantir renderização da base64
             setTimeout(function() {
                window.print();
                // window.close(); // Opcional: fechar automático no mobile as vezes atrapalha o "Salvar como PDF"
             }, 500);
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setPrinting(false); // Destrava o botão
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* CABEÇALHO */}
      <div className="bg-[#1D4ED8] pt-10 pb-24 px-8 shadow-sm">
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <FileText className="text-blue-300"/> Serviços & Documentos
            </h1>
            <p className="text-blue-100 text-lg opacity-90">Emissão de cartas e certificados oficiais.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-0 -mt-16">
          
          {/* SELEÇÃO DE TIPO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div onClick={() => { setSelectedDoc('recommendation'); setSelectedMember(null); }} className={`bg-white p-6 rounded-3xl shadow-xl cursor-pointer border-2 transition ${selectedDoc === 'recommendation' ? 'border-blue-500 ring-4 ring-blue-50' : 'border-transparent hover:border-blue-200'}`}>
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4"><FileBadge size={28}/></div>
                  <h3 className="text-xl font-bold text-gray-800">Carta de Recomendação</h3>
                  <p className="text-sm text-gray-500 mt-2">Para membros que vão visitar outras igrejas.</p>
              </div>
              <div onClick={() => { setSelectedDoc('transfer'); setSelectedMember(null); }} className={`bg-white p-6 rounded-3xl shadow-xl cursor-pointer border-2 transition ${selectedDoc === 'transfer' ? 'border-orange-500 ring-4 ring-orange-50' : 'border-transparent hover:border-orange-200'}`}>
                  <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-4"><ArrowRightLeft size={28}/></div>
                  <h3 className="text-xl font-bold text-gray-800">Carta de Transferência</h3>
                  <p className="text-sm text-gray-500 mt-2">Para mudança definitiva de congregação.</p>
              </div>
          </div>

          {/* ÁREA DE EMISSÃO */}
          {selectedDoc && (
              <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
                      <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                          {selectedDoc === 'recommendation' ? <FileBadge className="text-blue-500"/> : <ArrowRightLeft className="text-orange-500"/>}
                          Emitir {selectedDoc === 'recommendation' ? 'Recomendação' : 'Transferência'}
                      </h2>
                      <button onClick={() => setSelectedDoc(null)} className="text-gray-500 hover:text-red-500 font-bold text-sm bg-gray-100 hover:bg-red-50 px-3 py-2 rounded-lg flex items-center gap-1 transition">
                          <X size={16}/> FECHAR
                      </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* LADO ESQUERDO: BUSCA */}
                      <div className={`${selectedMember ? 'hidden md:block' : 'block'}`}>
                          <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Selecione o Membro</label>
                          <div className="relative mb-4">
                              <Search className="absolute left-3 top-3 text-gray-400" size={20}/>
                              <input type="text" placeholder="Buscar membro..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 p-3 border rounded-xl bg-gray-50 focus:bg-white transition outline-none focus:ring-2 ring-blue-100"/>
                          </div>
                          <div className="h-64 overflow-y-auto border rounded-xl p-2 custom-scrollbar bg-gray-50">
                              {filteredMembers.map(m => (
                                  <div key={m.id} onClick={() => setSelectedMember(m)} className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition mb-1 ${selectedMember?.id === m.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white hover:shadow-sm text-gray-700'}`}>
                                      <div className={`p-2 rounded-full ${selectedMember?.id === m.id ? 'bg-white/20' : 'bg-gray-200'}`}><User size={16}/></div>
                                      <span className="font-bold text-sm">{m.fullName}</span>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* LADO DIREITO: PREVIEW */}
                      <div className={`flex flex-col h-full ${!selectedMember ? 'hidden md:flex' : 'flex'}`}>
                          <label className="text-xs font-bold text-gray-400 uppercase mb-2 flex justify-between items-center">
                              <span>Pré-visualização</span>
                              {selectedMember && (
                                  <button onClick={() => setSelectedMember(null)} className="md:hidden text-blue-600 font-bold flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg text-xs">
                                      ← Trocar Membro
                                  </button>
                              )}
                          </label>
                          
                          <div className="flex-1 bg-gray-100 rounded-xl p-4 md:p-6 border border-gray-200 flex flex-col items-center">
                              {selectedMember ? (
                                  <div className="bg-white p-6 shadow-md w-full max-w-sm mx-auto rounded-lg text-center animate-in zoom-in border border-gray-200">
                                      
                                      {/* LOGO NO PREVIEW DO APP */}
                                      <div className="flex justify-center mb-3">
                                          {logoUrl ? (
                                              <img src={logoUrl} alt="Logo" className="h-16 w-16 object-contain" />
                                          ) : (
                                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400"><Building2 size={32}/></div>
                                          )}
                                      </div>
                                      
                                      <h3 className="text-sm font-bold text-gray-800 uppercase border-b pb-2 mb-3">{churchName}</h3>
                                      
                                      <div className="bg-blue-50 text-blue-800 p-2 rounded-lg mb-4 text-sm font-bold">
                                          {selectedMember.fullName}
                                      </div>
                                      
                                      <textarea 
                                        placeholder="Observação extra (aparecerá na carta)..." 
                                        value={obs}
                                        onChange={e => setObs(e.target.value)}
                                        className="w-full p-2 border rounded-lg text-xs mb-4 bg-gray-50 resize-none outline-none focus:ring-1 ring-blue-300"
                                        rows={3}
                                      />

                                      <button 
                                        onClick={handlePrint} 
                                        disabled={printing}
                                        className="w-full bg-gray-900 text-white px-4 py-3 rounded-xl font-bold hover:bg-black transition shadow-lg flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                                      >
                                          {printing ? <Loader2 className="animate-spin" size={18}/> : <Printer size={18}/>} 
                                          {printing ? "Gerando..." : "Imprimir"}
                                      </button>
                                  </div>
                              ) : (
                                  <div className="text-center py-20 text-gray-400">
                                      <ShieldCheck size={40} className="mx-auto mb-2 opacity-20"/>
                                      <p className="text-sm">Selecione um membro para visualizar.</p>
                                  </div>
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