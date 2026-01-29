"use client";
import { useState } from "react";
import { useChurch } from "../../contexts/ChurchContext";
import { memberService } from "../../services/memberService"; // Certifique-se que o caminho está certo
import { 
  FileText, ArrowRight, Search, Printer, 
  ArrowLeft, User, Calendar, MapPin, Loader2, CheckCircle 
} from "lucide-react";

// Tipos
type DocType = 'recomendacao' | 'transferencia' | null;

export default function ServicesPage() {
  const { churchName, churchId, logoUrl, userName } = useChurch();
  
  // Passos: 'menu' -> 'search' -> 'preview'
  const [step, setStep] = useState<'menu' | 'search' | 'preview'>('menu');
  const [docType, setDocType] = useState<DocType>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // --- 1. CONFIGURAÇÃO DOS DOCUMENTOS ---
  // Aqui pegamos os textos que salvamos no banco (ou usamos padrão se vazio)
  // *Num cenário ideal, buscaríamos do 'settings' do banco, mas podemos usar padrão por enquanto*
  const getDocTitle = () => docType === 'recomendacao' ? "Carta de Recomendação" : "Carta de Transferência";
  
  const getDocContent = () => {
    // Texto Base
    let text = "";
    if (docType === 'recomendacao') {
       text = "Certificamos, para os devidos fins eclesiásticos, que o(a) irmão(ã) {NOME}, membro desta igreja, está em plena comunhão com a fé e a ordem desta comunidade. Recomendamo-lo(a) a qualquer igreja coirmã, rogando que o(a) recebam no Senhor.";
    } else {
       text = "Solicitamos a transferência do(a) irmão(ã) {NOME}, que manifestou desejo de unir-se a esta comunidade. Agradecemos o envio de sua carta demissória ou certificado de transferência.";
    }

    // Substituição de Variáveis (O "Merge")
    if (selectedMember) {
        text = text.replace(/{NOME}/g, `<strong>${selectedMember.fullName.toUpperCase()}</strong>`);
        // Adicione mais substituições aqui se quiser (ex: cargo, data de batismo)
    }
    return text;
  };

  // --- FUNÇÕES ---
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length > 2) {
      setLoadingMembers(true);
      try {
        const results = await memberService.search(churchId, term);
        setMembers(results);
      } catch (e) { console.error(e); }
      finally { setLoadingMembers(false); }
    } else {
      setMembers([]);
    }
  };

  const selectMember = (member: any) => {
      setSelectedMember(member);
      setStep('preview');
  };

  const handlePrint = () => {
    window.print();
  };

  // --- RENDERIZAÇÃO ---

  // 1. MENU DE ESCOLHA (IGUAL CARD)
  if (step === 'menu') {
      return (
        <div className="p-8 max-w-5xl mx-auto min-h-screen bg-gray-50">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Serviços de Secretaria</h1>
            <p className="text-gray-500 mb-8">Selecione o tipo de documento que deseja emitir.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CARD RECOMENDAÇÃO */}
                <button 
                  onClick={() => { setDocType('recomendacao'); setStep('search'); }}
                  className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition text-left group"
                >
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition">
                        <FileText size={28}/>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Carta de Recomendação</h3>
                    <p className="text-sm text-gray-400">Para membros que vão visitar outras igrejas ou mudar de cidade temporariamente.</p>
                </button>

                {/* CARD TRANSFERÊNCIA */}
                <button 
                  onClick={() => { setDocType('transferencia'); setStep('search'); }}
                  className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-purple-300 hover:shadow-md transition text-left group"
                >
                    <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition">
                        <ArrowRight size={28}/>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Carta de Transferência</h3>
                    <p className="text-sm text-gray-400">Para oficializar a saída de um membro para outra congregação.</p>
                </button>
            </div>
        </div>
      );
  }

  // 2. BUSCA DE MEMBRO
  if (step === 'search') {
      return (
        <div className="p-8 max-w-3xl mx-auto min-h-screen bg-gray-50">
            <button onClick={() => setStep('menu')} className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-6 text-sm font-bold">
                <ArrowLeft size={16}/> Voltar
            </button>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Quem é o membro?</h1>
            <p className="text-gray-500 mb-6">Busque pelo nome para gerar o documento de <strong>{getDocTitle()}</strong>.</p>

            <div className="relative mb-6">
                <Search className="absolute left-4 top-4 text-gray-400" size={20}/>
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Digite o nome do membro..." 
                  className="w-full pl-12 p-4 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={searchTerm}
                  onChange={e => handleSearch(e.target.value)}
                />
            </div>

            <div className="space-y-3">
                {loadingMembers && <div className="text-center py-4"><Loader2 className="animate-spin mx-auto text-blue-500"/></div>}
                
                {!loadingMembers && members.map(member => (
                    <button 
                        key={member.id} 
                        onClick={() => selectMember(member)}
                        className="w-full bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between hover:border-blue-300 hover:bg-blue-50 transition group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold group-hover:bg-blue-200 group-hover:text-blue-700">
                                <User size={20}/>
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-gray-800">{member.fullName}</p>
                                <p className="text-xs text-gray-400">{member.role || 'Membro'}</p>
                            </div>
                        </div>
                        <ArrowRight size={18} className="text-gray-300 group-hover:text-blue-500"/>
                    </button>
                ))}
                
                {!loadingMembers && searchTerm.length > 2 && members.length === 0 && (
                    <p className="text-center text-gray-400 py-4">Nenhum membro encontrado.</p>
                )}
            </div>
        </div>
      );
  }

  // 3. PREVIEW & IMPRESSÃO (A4)
  if (step === 'preview' && selectedMember) {
      return (
        <div className="min-h-screen bg-gray-200 p-4 md:p-8 flex flex-col items-center print:bg-white print:p-0">
            
            {/* BARRA DE AÇÕES (Somem na impressão) */}
            <div className="w-full max-w-[210mm] flex justify-between items-center mb-6 print:hidden">
                <button onClick={() => setStep('search')} className="flex items-center gap-2 text-gray-600 font-bold hover:text-gray-900 bg-white px-4 py-2 rounded-lg shadow-sm">
                    <ArrowLeft size={16}/> Voltar
                </button>
                <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-md shadow-blue-200 transition">
                    <Printer size={18}/> Imprimir / Salvar PDF
                </button>
            </div>

            {/* A FOLHA A4 */}
            <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl print:shadow-none print:w-full print:max-w-none">
                
                {/* CABEÇALHO */}
                <header className="flex flex-col items-center border-b-2 border-gray-100 pb-8 mb-8">
                    {logoUrl && (
                        <img src={logoUrl} alt="Logo" className="h-24 w-auto mb-4 object-contain" />
                    )}
                    <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-wide text-center">{churchName}</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                        <MapPin size={14}/> <span>Sede Administrativa</span>
                    </div>
                </header>

                {/* TÍTULO DO DOCUMENTO */}
                <div className="text-center mb-12">
                    <h2 className="text-xl font-bold text-gray-900 uppercase border-2 border-gray-800 inline-block px-6 py-2 tracking-widest">
                        {getDocTitle()}
                    </h2>
                </div>

                {/* CORPO DO TEXTO */}
                <div className="text-justify text-lg leading-relaxed text-gray-800 font-serif mb-16">
                    <p dangerouslySetInnerHTML={{ __html: getDocContent() }} />
                </div>

                {/* DETALHES ADICIONAIS */}
                <div className="bg-gray-50 p-6 rounded-xl mb-16 border border-gray-100 print:bg-white print:border-gray-200">
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2"><User size={16}/> Dados do Membro</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="block text-gray-400 text-xs">Nome Completo</span>
                            <span className="font-bold text-gray-800">{selectedMember.fullName}</span>
                        </div>
                        <div>
                            <span className="block text-gray-400 text-xs">Cargo Eclesiástico</span>
                            <span className="font-bold text-gray-800">{selectedMember.role || 'Membro'}</span>
                        </div>
                        <div>
                            <span className="block text-gray-400 text-xs">Data de Emissão</span>
                            <span className="font-bold text-gray-800">{new Date().toLocaleDateString('pt-BR')}</span>
                        </div>
                    </div>
                </div>

                {/* ASSINATURA */}
                <div className="mt-auto pt-10 flex flex-col items-center">
                    <div className="w-64 border-t border-gray-800 mb-2"></div>
                    <p className="font-bold text-gray-800">{userName}</p>
                    <p className="text-sm text-gray-500">Secretaria / Liderança</p>
                </div>

                {/* RODAPÉ */}
                <footer className="mt-20 text-center text-[10px] text-gray-400 border-t border-gray-100 pt-4">
                    Documento gerado digitalmente via ReinoCloud System • {new Date().getFullYear()}
                </footer>

            </div>
        </div>
      );
  }

  return null;
}