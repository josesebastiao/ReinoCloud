"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChurch } from "../../contexts/ChurchContext";
import { memberService } from "../../services/memberService";
import { generalScaleService } from "../../services/generalScaleService"; // <--- NOVO SERVIÇO
import { Member } from "../../types/member"; 

import { 
  FileText, Printer, Search, FileBadge, ArrowRightLeft, 
  User, X, Building2, Loader2, ShieldCheck, CalendarRange, Plus, Trash2, Save, Clock, ChevronRight
} from "lucide-react";

// Tipo para as linhas da escala
interface ScaleRow {
    date: string;
    event: string;
    leader: string;
    preacher: string;
    music: string;
    obs: string;
}

export default function ServicesPage() {
  const router = useRouter();
  const { churchId, churchName, logoUrl, userRole, hasPermission, loading: authLoading } = useChurch(); 
  
  const [members, setMembers] = useState<Member[]>([]);
  const [savedScales, setSavedScales] = useState<any[]>([]); // Histórico
  
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false); 
  const [saving, setSaving] = useState(false);
  
  // Controle dos Modais
  const [selectedDoc, setSelectedDoc] = useState<'recommendation' | 'transfer' | 'scale' | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [search, setSearch] = useState("");
  const [obs, setObs] = useState(""); 

  // ESTADO DA ESCALA ATUAL
  const [scaleData, setScaleData] = useState({
      title: `ESCALA DE ${new Date().toLocaleString('pt-BR', { month: 'long' }).toUpperCase()} / ${new Date().getFullYear()}`,
      theme: "",
      text: "",
      rows: [] as ScaleRow[]
  });

  // Segurança
  useEffect(() => {
    if (!authLoading) {
         if (userRole !== 'admin' && !hasPermission('secretary')) {
            router.push('/');
         }
    }
  }, [authLoading, userRole, hasPermission, router]);

  // Carregar Membros e Histórico
  useEffect(() => {
    if (churchId) {
        loadMembers();
        if(selectedDoc === 'scale') loadHistory();
    }
  }, [churchId, selectedDoc]);

// ... dentro do componente ServicesPage ...

  const loadMembers = async () => {
    // ADICIONE ESTA LINHA: Se não tiver ID, para tudo e o erro some.
    if (!churchId) return; 

    setLoading(true);
    try {
      const list = await memberService.listByChurch(churchId);
      setMembers(list);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadHistory = async () => {
      // ADICIONE ESTA LINHA AQUI TAMBÉM
      if (!churchId) return;

      // Agora o TypeScript sabe que churchId é uma string segura
      const history = await generalScaleService.listByChurch(churchId);
      setSavedScales(history);
  };
  const filteredMembers = members.filter(m => m.fullName.toLowerCase().includes(search.toLowerCase()));

  // --- FUNÇÕES DA ESCALA ---
  const handleSaveScale = async () => {
      if(!churchId) return;
      if(scaleData.rows.length === 0) return alert("Adicione pelo menos uma linha na escala.");
      
      setSaving(true);
      try {
          await generalScaleService.create({
              churchId,
              ...scaleData
          });
          alert("Escala salva no histórico!");
          loadHistory(); // Recarrega a lista
      } catch (error) {
          console.error(error);
          alert("Erro ao salvar.");
      } finally {
          setSaving(false);
      }
  };

  const loadFromHistory = (scale: any) => {
      if(confirm("Carregar esta escala? Os dados atuais serão substituídos.")) {
          setScaleData({
              title: scale.title,
              theme: scale.theme,
              text: scale.text,
              rows: scale.rows
          });
      }
  };

  const deleteFromHistory = async (e: any, id: string) => {
      e.stopPropagation();
      if(confirm("Excluir esta escala do histórico?")) {
          await generalScaleService.delete(id);
          loadHistory();
      }
  };

  const addScaleRow = () => {
      const newRow: ScaleRow = { date: "", event: "", leader: "", preacher: "", music: "", obs: "" };
      setScaleData({ ...scaleData, rows: [...scaleData.rows, newRow] });
  };

  const removeScaleRow = (index: number) => {
      const newRows = [...scaleData.rows];
      newRows.splice(index, 1);
      setScaleData({ ...scaleData, rows: newRows });
  };

  const updateScaleRow = (index: number, field: keyof ScaleRow, value: string) => {
      const newRows = [...scaleData.rows];
      newRows[index] = { ...newRows[index], [field]: value };
      setScaleData({ ...scaleData, rows: newRows });
  };

  const toDataURL = async (url: string) => {
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    } catch (e) { return ""; }
  };

  const handlePrint = async () => {
    setPrinting(true); 
    let finalLogo = "";
    if (logoUrl) finalLogo = await toDataURL(logoUrl);

    const printWindow = window.open('', '', 'width=1100,height=700');
    if (!printWindow) { setPrinting(false); return alert("Permita pop-ups!"); }

    const rowsHtml = scaleData.rows.map(row => {
        let dateDisplay = row.date;
        try {
            if(row.date.includes('-')) {
                const d = new Date(row.date);
                dateDisplay = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}`;
            }
        } catch(e){}
        return `<tr><td style="font-weight:bold;text-align:center;">${dateDisplay}</td><td>${row.event}</td><td>${row.leader}</td><td>${row.music}</td><td>${row.preacher}</td><td style="font-size:11px;color:#444;">${row.obs}</td></tr>`;
    }).join('');

    const htmlContent = `
      <html><head><title>Escala - ${churchName}</title><style>body{font-family:'Times New Roman',serif;padding:40px;text-align:center;color:#000}.header{margin-bottom:20px;padding-bottom:10px}.logo{max-width:100px;max-height:100px;object-fit:contain;margin:0 auto 10px}.footer{margin-top:60px;display:flex;justify-content:space-around}.signature{border-top:1px solid #000;padding-top:5px;width:40%;font-weight:bold}table{width:100%;border-collapse:collapse;margin-top:10px}td,th{border:1px solid #000;padding:6px;font-size:13px;text-align:left;vertical-align:top}th{background:#f0f0f0}@media print{@page{margin:1cm;size:A4}body{padding:0}}</style></head>
      <body>
        <div class="header">${finalLogo ? `<img src="${finalLogo}" class="logo" />` : ''}<h2 style="margin:0;text-transform:uppercase;font-size:24px;font-weight:900;">${churchName}</h2><h3 style="margin:5px 0 20px 0;text-transform:uppercase;font-size:18px;border-bottom:2px solid #000;display:inline-block;padding-bottom:5px;">${scaleData.title}</h3></div>
        <div style="margin:0 0 20px 0;text-align:left;font-size:14px;">${scaleData.theme ? `<p style="margin:5px 0;"><strong>TEMA DO MÊS:</strong> ${scaleData.theme}</p>` : ''}${scaleData.text ? `<p style="margin:5px 0;"><strong>TEXTO BASE:</strong> <em>${scaleData.text}</em></p>` : ''}</div>
        <table><thead><tr><th style="width:80px;">DATA</th><th>CULTO</th><th>DIRIGENTE</th><th>LOUVOR</th><th>PREGADOR</th><th>OBS / TEXTO</th></tr></thead><tbody>${rowsHtml}</tbody></table>
        <div style="margin-top:40px;font-size:12px;text-align:left;"><p style="font-weight:bold;text-decoration:underline;">Observações Importantes:</p><ul style="margin-top:5px;"><li>Em caso de indisponibilidade, o escalado deve comunicar a liderança com antecedência.</li><li>Não é permitida a troca de escala sem autorização prévia.</li></ul></div>
        <div class="footer"><div class="signature">Pastor / Responsável</div><div class="signature">Secretaria</div></div>
        <script>setTimeout(function(){window.print();},500);</script>
      </body></html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setPrinting(false);
  };

  if (authLoading) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><Loader2 className="animate-spin text-blue-600"/></div>;
  if (userRole !== 'admin' && !hasPermission('secretary')) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <datalist id="members-list">{members.map(m => <option key={m.id} value={m.fullName} />)}</datalist>

      <div className="bg-[#1D4ED8] pt-10 pb-24 px-8 shadow-sm">
        <div className="max-w-6xl mx-auto"><h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3"><FileText className="text-blue-300"/> Serviços & Documentos</h1><p className="text-blue-100 text-lg opacity-90">Emissão de cartas, certificados e escalas oficiais.</p></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-0 -mt-16">
          {!selectedDoc ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4">
                <div onClick={() => { setSelectedDoc('recommendation'); setSelectedMember(null); }} className="bg-white p-6 rounded-3xl shadow-xl cursor-pointer border-2 border-transparent hover:border-blue-200 transition hover:-translate-y-1"><div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4"><FileBadge size={28}/></div><h3 className="text-lg font-bold text-gray-800">Recomendação</h3><p className="text-xs text-gray-500 mt-2">Para membros visitantes.</p></div>
                <div onClick={() => { setSelectedDoc('transfer'); setSelectedMember(null); }} className="bg-white p-6 rounded-3xl shadow-xl cursor-pointer border-2 border-transparent hover:border-orange-200 transition hover:-translate-y-1"><div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-4"><ArrowRightLeft size={28}/></div><h3 className="text-lg font-bold text-gray-800">Transferência</h3><p className="text-xs text-gray-500 mt-2">Mudança definitiva.</p></div>
                <div onClick={() => { setSelectedDoc('scale'); }} className="bg-white p-6 rounded-3xl shadow-xl cursor-pointer border-2 border-transparent hover:border-green-200 transition hover:-translate-y-1"><div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4"><CalendarRange size={28}/></div><h3 className="text-lg font-bold text-gray-800">Gerador de Escalas</h3><p className="text-xs text-gray-500 mt-2">Cultos, pregadores e louvor.</p></div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4 overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                        {selectedDoc === 'scale' ? <CalendarRange className="text-green-600"/> : <FileBadge className="text-blue-500"/>}
                        {selectedDoc === 'scale' ? 'Gerador de Escala' : 'Emitir Carta'}
                    </h2>
                    <button onClick={() => setSelectedDoc(null)} className="text-gray-500 hover:text-red-500 font-bold text-sm bg-white border border-gray-200 hover:bg-red-50 px-3 py-2 rounded-lg flex items-center gap-1 transition"><X size={16}/> FECHAR</button>
                </div>

                {selectedDoc === 'scale' ? (
                    <div className="flex flex-col lg:flex-row h-[800px]">
                        {/* SIDEBAR HISTÓRICO */}
                        <div className="w-full lg:w-72 bg-gray-50 border-r border-gray-100 flex flex-col">
                            <div className="p-4 border-b border-gray-100 font-bold text-xs text-gray-400 uppercase flex items-center gap-2">
                                <Clock size={14}/> Histórico de Escalas
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                {savedScales.length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-4">Nenhuma escala salva.</p>
                                ) : (
                                    savedScales.map(scale => (
                                        <div key={scale.id} onClick={() => loadFromHistory(scale)} className="group p-3 rounded-xl hover:bg-white hover:shadow-sm cursor-pointer border border-transparent hover:border-gray-200 transition">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-sm font-bold text-gray-700 line-clamp-2">{scale.title}</h4>
                                                <button onClick={(e) => deleteFromHistory(e, scale.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">{new Date(scale.createdAt).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* EDITOR DA ESCALA */}
                        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
                            <div className="flex justify-end gap-2 mb-6">
                                <button onClick={handleSaveScale} disabled={saving} className="bg-white border border-green-200 text-green-700 hover:bg-green-50 px-4 py-2 rounded-xl font-bold shadow-sm transition flex items-center gap-2">
                                    {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Salvar
                                </button>
                                <button onClick={handlePrint} disabled={printing} className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold shadow hover:bg-green-700 transition flex items-center gap-2">
                                    {printing ? <Loader2 className="animate-spin" size={18}/> : <Printer size={18}/>} Imprimir PDF
                                </button>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div><label className="text-xs font-bold text-gray-500 uppercase">Título</label><input type="text" value={scaleData.title} onChange={e => setScaleData({...scaleData, title: e.target.value})} className="w-full p-2 border rounded-lg mt-1" /></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase">Tema</label><input type="text" value={scaleData.theme} onChange={e => setScaleData({...scaleData, theme: e.target.value})} className="w-full p-2 border rounded-lg mt-1" /></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase">Texto Base</label><input type="text" value={scaleData.text} onChange={e => setScaleData({...scaleData, text: e.target.value})} className="w-full p-2 border rounded-lg mt-1" /></div>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-gray-100 text-gray-600 text-xs uppercase">
                                            <th className="p-3 border-b">Data</th><th className="p-3 border-b">Evento</th><th className="p-3 border-b">Dirigente</th><th className="p-3 border-b">Pregador</th><th className="p-3 border-b">Louvor</th><th className="p-3 border-b">Obs</th><th className="p-3 border-b w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {scaleData.rows.map((row, idx) => (
                                            <tr key={idx} className="group hover:bg-gray-50">
                                                <td className="p-2"><input type="date" value={row.date} onChange={e => updateScaleRow(idx, 'date', e.target.value)} className="w-full p-2 border rounded bg-transparent focus:bg-white" /></td>
                                                <td className="p-2"><input type="text" value={row.event} onChange={e => updateScaleRow(idx, 'event', e.target.value)} className="w-full p-2 border rounded bg-transparent focus:bg-white" /></td>
                                                <td className="p-2"><input type="text" list="members-list" value={row.leader} onChange={e => updateScaleRow(idx, 'leader', e.target.value)} className="w-full p-2 border rounded bg-transparent focus:bg-white" /></td>
                                                <td className="p-2"><input type="text" list="members-list" value={row.preacher} onChange={e => updateScaleRow(idx, 'preacher', e.target.value)} className="w-full p-2 border rounded bg-transparent focus:bg-white" /></td>
                                                <td className="p-2"><input type="text" value={row.music} onChange={e => updateScaleRow(idx, 'music', e.target.value)} className="w-full p-2 border rounded bg-transparent focus:bg-white" /></td>
                                                <td className="p-2"><input type="text" value={row.obs} onChange={e => updateScaleRow(idx, 'obs', e.target.value)} className="w-full p-2 border rounded bg-transparent focus:bg-white" /></td>
                                                <td className="p-2 text-center"><button onClick={() => removeScaleRow(idx)} className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <button onClick={addScaleRow} className="w-full py-3 mt-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition flex items-center justify-center gap-2"><Plus size={20}/> Adicionar Linha</button>
                        </div>
                    </div>
                ) : (
                    // CARTAS (SEM MUDANÇAS, SÓ RECOLAPSEI PRA CABER)
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                        <div className={`${selectedMember ? 'hidden md:block' : 'block'}`}>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Selecione o Membro</label>
                            <div className="relative mb-4"><Search className="absolute left-3 top-3 text-gray-400" size={20}/><input type="text" placeholder="Buscar membro..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 p-3 border rounded-xl bg-gray-50 focus:bg-white transition outline-none focus:ring-2 ring-blue-100"/></div>
                            <div className="h-64 overflow-y-auto border rounded-xl p-2 custom-scrollbar bg-gray-50">{loading ? <div className="p-4 text-center"><Loader2 className="animate-spin inline"/></div> : filteredMembers.map(m => (<div key={m.id} onClick={() => setSelectedMember(m)} className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition mb-1 ${selectedMember?.id === m.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white hover:shadow-sm text-gray-700'}`}><div className={`p-2 rounded-full ${selectedMember?.id === m.id ? 'bg-white/20' : 'bg-gray-200'}`}><User size={16}/></div><span className="font-bold text-sm">{m.fullName}</span></div>))}</div>
                        </div>
                        <div className={`flex flex-col h-full ${!selectedMember ? 'hidden md:flex' : 'flex'}`}>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 flex justify-between items-center"><span>Pré-visualização</span>{selectedMember && <button onClick={() => setSelectedMember(null)} className="md:hidden text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-lg text-xs">← Voltar</button>}</label>
                            <div className="flex-1 bg-gray-100 rounded-xl p-4 md:p-6 border border-gray-200 flex flex-col items-center">
                                {selectedMember ? (<div className="bg-white p-6 shadow-md w-full max-w-sm mx-auto rounded-lg text-center animate-in zoom-in border border-gray-200"><div className="flex justify-center mb-3">{logoUrl ? <img src={logoUrl} alt="Logo" className="h-16 w-16 object-contain" /> : <Building2 size={32} className="text-gray-400"/>}</div><h3 className="text-sm font-bold text-gray-800 uppercase border-b pb-2 mb-3">{churchName}</h3><div className="bg-blue-50 text-blue-800 p-2 rounded-lg mb-4 text-sm font-bold">{selectedMember.fullName}</div><textarea placeholder="Observação extra..." value={obs} onChange={e => setObs(e.target.value)} className="w-full p-2 border rounded-lg text-xs mb-4 bg-gray-50 resize-none outline-none focus:ring-1 ring-blue-300" rows={3}/><button onClick={handlePrint} disabled={printing} className="w-full bg-gray-900 text-white px-4 py-3 rounded-xl font-bold hover:bg-black transition shadow-lg flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-wait">{printing ? <Loader2 className="animate-spin" size={18}/> : <Printer size={18}/>} {printing ? "Gerando..." : "Imprimir"}</button></div>) : (<div className="text-center py-20 text-gray-400"><ShieldCheck size={40} className="mx-auto mb-2 opacity-20"/><p className="text-sm">Selecione um membro.</p></div>)}
                            </div>
                        </div>
                    </div>
                )}
            </div>
          )}
      </div>
    </div>
  );
}