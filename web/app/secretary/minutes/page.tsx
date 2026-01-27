"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { minuteService } from "../../../services/minuteService";
import { churchService } from "../../../services/churchService";
import { 
  BookOpen, Plus, Search, Edit, Trash2, Printer, X, FileText, ArrowLeft 
} from "lucide-react";

export default function MinutesPage() {
  const router = useRouter();
  const [churchId, setChurchId] = useState("");
  const [churchName, setChurchName] = useState("Igreja");
  
  const [minutes, setMinutes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Modais
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Dados
  const [currentMinute, setCurrentMinute] = useState<any>(null);
  const [formData, setFormData] = useState({ title: "", date: "", content: "" });

  useEffect(() => {
    const id = localStorage.getItem("churchId");
    if (!id) { router.push("/login"); return; }
    setChurchId(id);
    
    // Busca nome da igreja e lista de atas
    churchService.getSettings(id).then(settings => {
        if(settings?.docs?.churchName) setChurchName(settings.docs.churchName);
        else setChurchName(localStorage.getItem("churchName") || "Minha Igreja");
    });
    carregarAtas(id);
  }, []);

  const carregarAtas = async (id: string) => {
    const lista = await minuteService.listByChurch(id);
    // Ordena por data (mais recente primeiro)
    lista.sort((a:any, b:any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setMinutes(lista);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        if (currentMinute?.id) {
            await minuteService.update(currentMinute.id, { ...formData, churchId });
        } else {
            await minuteService.create({ ...formData, churchId });
        }
        setIsEditorOpen(false);
        carregarAtas(churchId);
    } catch (error) { alert("Erro ao salvar."); } finally { setLoading(false); }
  };

  const handleEdit = (ata: any) => {
      setCurrentMinute(ata);
      setFormData({ title: ata.title, date: ata.date, content: ata.content });
      setIsEditorOpen(true);
  };

  const handlePreview = (ata: any) => {
      setCurrentMinute(ata);
      setIsPreviewOpen(true);
  };

  const handleDelete = async (id: string) => {
      if(confirm("Tem certeza que deseja excluir esta ata?")) {
          await minuteService.delete(id);
          carregarAtas(churchId);
      }
  };

  const openNew = () => {
      setCurrentMinute(null);
      setFormData({ title: "", date: new Date().toISOString().split('T')[0], content: "" });
      setIsEditorOpen(true);
  };

  const filteredMinutes = minutes.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 p-8 print:p-0 print:bg-white">
      
      {/* HEADER (Tela) */}
      <div className="max-w-5xl mx-auto mb-8 print:hidden">
        <div className="flex items-center gap-2 text-gray-500 cursor-pointer hover:text-blue-600 mb-4" onClick={() => router.push('/secretary')}>
            <ArrowLeft size={20}/> Voltar para Secretaria
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <BookOpen className="text-indigo-600"/> Livro de Atas
                </h1>
                <p className="text-gray-500">Registro oficial das reuniões e assembleias.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <div className="flex items-center bg-white border rounded-lg px-3 py-2 flex-1">
                    <Search size={18} className="text-gray-400 mr-2"/>
                    <input type="text" placeholder="Buscar ata..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="outline-none w-full text-sm"/>
                </div>
                <button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg font-bold">
                    <Plus size={20}/> Nova Ata
                </button>
            </div>
        </div>
      </div>

      {/* LISTA DE ATAS */}
      <div className="max-w-5xl mx-auto print:hidden">
          {filteredMinutes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                  <BookOpen size={48} className="text-gray-300 mx-auto mb-4"/>
                  <p className="text-gray-500">Nenhuma ata registrada.</p>
              </div>
          ) : (
              <div className="grid gap-4">
                  {filteredMinutes.map(ata => (
                      <div key={ata.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center hover:shadow-md transition">
                          <div className="flex items-start gap-4">
                              <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600 font-bold text-center min-w-[60px]">
                                  <span className="text-xl block">{ata.date.split('-')[2]}</span>
                                  <span className="text-xs uppercase">{new Date(ata.date).toLocaleDateString('pt-BR', {month:'short'}).replace('.','')}</span>
                              </div>
                              <div>
                                  <h3 className="font-bold text-gray-800 text-lg">{ata.title}</h3>
                                  <p className="text-gray-500 text-sm line-clamp-1">{ata.content}</p>
                              </div>
                          </div>
                          <div className="flex gap-2">
                              <button onClick={() => handlePreview(ata)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Imprimir / Visualizar">
                                  <Printer size={20}/>
                              </button>
                              <button onClick={() => handleEdit(ata)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar">
                                  <Edit size={20}/>
                              </button>
                              <button onClick={() => handleDelete(ata.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Excluir">
                                  <Trash2 size={20}/>
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>

      {/* MODAL EDITOR (Escrever a Ata) */}
      {isEditorOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm print:hidden">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 relative h-[80vh] flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-gray-800">{currentMinute ? 'Editar Ata' : 'Nova Ata'}</h2>
                      <button onClick={() => setIsEditorOpen(false)}><X size={24} className="text-gray-400 hover:text-gray-600"/></button>
                  </div>
                  <form onSubmit={handleSave} className="flex-1 flex flex-col gap-4">
                      <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-2">
                              <label className="text-xs font-bold text-gray-500 uppercase">Título da Sessão</label>
                              <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Ex: Assembleia Geral Ordinária"/>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase">Data</label>
                              <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-2 border rounded-lg"/>
                          </div>
                      </div>
                      <div className="flex-1 flex flex-col">
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1">Conteúdo da Ata</label>
                          <textarea 
                            required 
                            value={formData.content} 
                            onChange={e => setFormData({...formData, content: e.target.value})} 
                            className="w-full p-4 border rounded-lg flex-1 resize-none bg-gray-50 focus:bg-white transition leading-relaxed" 
                            placeholder="Aos vinte e sete dias do mês de..."
                          />
                      </div>
                      <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow">
                          {loading ? 'Salvando...' : 'Salvar Ata'}
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* MODAL PREVIEW (Impressão) */}
      {isPreviewOpen && currentMinute && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm print:relative print:inset-0 print:bg-white print:block print:p-0 print:z-auto">
            
            <button onClick={() => setIsPreviewOpen(false)} className="fixed top-6 right-6 z-[110] bg-red-600 text-white p-3 rounded-full hover:bg-red-700 shadow-2xl print:hidden">
                <X size={24} strokeWidth={3} />
            </button>

            <div className="bg-white w-full max-w-3xl min-h-[90vh] shadow-2xl rounded-sm relative flex flex-col print:shadow-none print:w-full print:rounded-none">
                {/* Toolbar */}
                <div className="flex justify-between items-center p-4 bg-gray-100 border-b print:hidden">
                    <h3 className="font-bold text-gray-700">Visualização de Impressão</h3>
                    <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow"><Printer size={18}/> IMPRIMIR</button>
                </div>

                {/* FOLHA A4 */}
                <div className="flex-1 p-12 print:p-16 font-serif text-gray-900 leading-relaxed">
                    
                    {/* Cabeçalho */}
                    <div className="text-center border-b-2 border-gray-800 pb-4 mb-8">
                        <h1 className="text-2xl font-bold uppercase tracking-wide">{churchName}</h1>
                        <p className="text-sm italic mt-1 text-gray-600">Livro de Atas</p>
                    </div>

                    {/* Título da Ata */}
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-bold uppercase underline underline-offset-4">{currentMinute.title}</h2>
                        <p className="text-sm text-gray-500 mt-2">Data: {new Date(currentMinute.date).toLocaleDateString('pt-BR', { dateStyle: 'long' })}</p>
                    </div>

                    {/* Conteúdo (Justificado e preservando parágrafos) */}
                    <div className="text-justify text-lg leading-loose whitespace-pre-wrap indent-12 mb-16">
                        {currentMinute.content}
                    </div>

                    {/* Assinaturas */}
                    <div className="mt-auto pt-12">
                        <div className="flex justify-center gap-16">
                            <div className="text-center">
                                <div className="w-64 border-t border-black mb-2"></div>
                                <p className="font-bold">Secretário(a)</p>
                            </div>
                            <div className="text-center">
                                <div className="w-64 border-t border-black mb-2"></div>
                                <p className="font-bold">Presidente / Pastor</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
      )}

    </div>
  );
}