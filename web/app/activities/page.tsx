"use client";
import { useState, useEffect } from "react";
import { useChurch } from "../../contexts/ChurchContext";
import { db } from "../../lib/firebase";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import {
    PlusCircle, Printer, Calendar, Users, HeartHandshake,
    BookOpen, Trash2, Loader2, X, TrendingUp, Droplet
} from "lucide-react";

// --- INTERFACES ---
export interface ChurchActivity {
    id?: string;
    churchId: string;
    title: string;
    date: string;
    category: string;
    quantity: number;
    description: string;
    createdBy: string;
    createdAt: number;
}

export default function ActivitiesPage() {
    const { churchId, churchName, userRole, logoUrl } = useChurch();

    const [activities, setActivities] = useState<ChurchActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

    // Dados do formulário (Sem departamento agora)
    const [formData, setFormData] = useState({
        title: "", date: "", category: "Visita Pastoral",
        quantity: 1, description: ""
    });
    const [saving, setSaving] = useState(false);

    // Categorias padrão
    const categories = ["Visita Pastoral", "Batismo", "Casamento", "Ação Social", "Culto Especial", "Reunião Administrativa", "Outros"];

    // Nome dinâmico da aba
    const pageTitle = userRole === 'admin' ? "Relatório Pastoral" : "Relatório de Atividades";

    useEffect(() => {
        if (churchId) loadActivities();
    }, [churchId]);

    const loadActivities = async () => {
        if (!churchId) return;
        setLoading(true);
        try {
            const q = query(collection(db, "activities"), where("churchId", "==", churchId));
            const querySnapshot = await getDocs(q);
            const data: ChurchActivity[] = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as ChurchActivity);
            });
            // Ordena da mais recente para a mais antiga
            data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setActivities(data);
        } catch (error) {
            console.error("Erro ao carregar atividades:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!churchId) return;
        setSaving(true);
        try {
            // Se não for batismo ou ação social, força a quantidade a ser 1
            const finalQuantity = (formData.category === 'Batismo' || formData.category === 'Ação Social') 
                ? Number(formData.quantity) 
                : 1;

            const payload: ChurchActivity = {
                ...formData,
                churchId,
                quantity: finalQuantity,
                createdBy: userRole || "unknown",
                createdAt: Date.now()
            };
            await addDoc(collection(db, "activities"), payload);
            setShowModal(false);
            setFormData({ title: "", date: "", category: "Visita Pastoral", quantity: 1, description: "" });
            loadActivities();
        } catch (error) {
            alert("Erro ao salvar atividade.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este registro?")) return;
        try {
            await deleteDoc(doc(db, "activities", id));
            loadActivities();
        } catch (error) {
            alert("Erro ao excluir.");
        }
    };

    // --- CÁLCULO DAS MÉTRICAS (DASHBOARD) ---
    const filteredActivities = activities.filter(act => act.date.startsWith(filterYear));
    
    const totalBatismos = filteredActivities.filter(a => a.category === 'Batismo').reduce((acc, curr) => acc + curr.quantity, 0);
    const totalCasamentos = filteredActivities.filter(a => a.category === 'Casamento').length;
    const totalVisitas = filteredActivities.filter(a => a.category === 'Visita Pastoral').length;
    const totalAcaoSocial = filteredActivities.filter(a => a.category === 'Ação Social').length;

    // --- FUNÇÃO DE IMPRESSÃO ---
    const handlePrint = () => {
        setPrinting(true);
        const printWindow = window.open('', '_blank', 'width=900,height=600');
        if (!printWindow) {
            setPrinting(false);
            return alert("Permita os pop-ups para imprimir.");
        }

        const safeLogoUrl = logoUrl ? logoUrl : '';
        const logoHtml = safeLogoUrl ? `<img src="${safeLogoUrl}" style="height: 60px; margin-bottom: 10px;" />` : '';

        const tableRows = filteredActivities.map(act => `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px; font-size: 12px;">${new Date(act.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                <td style="padding: 10px; font-size: 12px;"><strong>${act.category}</strong></td>
                <td style="padding: 10px; font-size: 12px;">${act.title}</td>
                <td style="padding: 10px; font-size: 12px; text-align: center;">${(act.category === 'Batismo' || act.category === 'Ação Social') ? act.quantity : '-'}</td>
            </tr>
        `).join('');

        const html = `
        <html>
        <head>
            <title>Relatório Anual - ${filterYear}</title>
            <style>
                body { font-family: sans-serif; padding: 40px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1e40af; padding-bottom: 20px; }
                .dashboard { display: flex; justify-content: space-between; margin-bottom: 30px; gap: 15px; }
                .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; flex: 1; text-align: center; }
                .card h3 { font-size: 12px; color: #64748b; text-transform: uppercase; margin: 0 0 5px 0; }
                .card p { font-size: 24px; font-weight: bold; color: #1e40af; margin: 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; text-align: left; }
                th { background: #f1f5f9; padding: 10px; border-bottom: 2px solid #cbd5e1; font-size: 12px; text-transform: uppercase; }
                .signature { margin-top: 60px; text-align: center; }
                .line { width: 250px; border-bottom: 1px solid #000; margin: 0 auto 10px auto; }
                @media print { .close-btn { display: none; } }
            </style>
        </head>
        <body>
            <button onclick="window.close()" class="close-btn" style="position:fixed; top:10px; left:10px; padding:10px; background:#ef4444; color:#fff; border:none; border-radius:5px; cursor:pointer;">FECHAR</button>
            <div class="header">
                ${logoHtml}
                <h1 style="margin:5px 0;">${churchName || 'Igreja'}</h1>
                <h2 style="color:#64748b; margin:0;">${pageTitle} Consolidado - ${filterYear}</h2>
            </div>

            <div class="dashboard">
                <div class="card"><h3>Batismos (Vidas)</h3><p>${totalBatismos}</p></div>
                <div class="card"><h3>Casamentos</h3><p>${totalCasamentos}</p></div>
                <div class="card"><h3>Visitas Pastorais</h3><p>${totalVisitas}</p></div>
                <div class="card"><h3>Ações Sociais</h3><p>${totalAcaoSocial}</p></div>
            </div>

            <h3 style="margin-top:40px; border-bottom:1px solid #eee; padding-bottom:5px;">Histórico de Ocorrências</h3>
            <table>
                <thead><tr><th>Data</th><th>Categoria</th><th>Descrição / Nomes</th><th style="text-align:center;">Qtd/Vidas</th></tr></thead>
                <tbody>${tableRows || '<tr><td colspan="4" style="text-align:center; padding:20px;">Nenhuma atividade registrada neste ano.</td></tr>'}</tbody>
            </table>

            <div class="signature">
                <div class="line"></div>
                <p style="margin:0; font-weight:bold;">Pastor Presidente / Liderança</p>
                <p style="margin:0; font-size:12px; color:#666;">Documento gerado pelo sistema ReinoCloud</p>
            </div>
            <script>window.onload = () => setTimeout(() => window.print(), 500);</script>
        </body>
        </html>
        `;

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        setPrinting(false);
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* CABEÇALHO */}
            <div className="bg-blue-800 pt-10 pb-32 px-4 md:px-8 shadow-sm">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <BookOpen className="text-blue-300" size={32} /> {pageTitle}
                        </h1>
                        <p className="text-blue-200 mt-2 text-lg opacity-90">
                            Acompanhe o crescimento e as ocorrências do ano.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select 
                            value={filterYear} 
                            onChange={(e) => setFilterYear(e.target.value)}
                            className="bg-blue-700/50 text-white border border-blue-600 p-3 rounded-xl font-bold outline-none cursor-pointer"
                        >
                            <option value="2026">Ano 2026</option>
                            <option value="2025">Ano 2025</option>
                        </select>
                        <button onClick={handlePrint} disabled={printing} className="bg-white text-blue-900 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition shadow-lg flex items-center gap-2">
                            {printing ? <Loader2 className="animate-spin" size={20} /> : <Printer size={20} />}
                            Imprimir Consolidado
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 md:px-0 -mt-20 relative z-10 space-y-6">
                
                {/* DASHBOARD CARDS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3"><Droplet size={24} /></div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Batismos (Vidas)</p>
                        <h2 className="text-3xl font-black text-slate-800 mt-1">{totalBatismos}</h2>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mb-3"><HeartHandshake size={24} /></div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Casamentos</p>
                        <h2 className="text-3xl font-black text-slate-800 mt-1">{totalCasamentos}</h2>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-3"><Users size={24} /></div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Visitas Pastorais</p>
                        <h2 className="text-3xl font-black text-slate-800 mt-1">{totalVisitas}</h2>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3"><TrendingUp size={24} /></div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ações Sociais</p>
                        <h2 className="text-3xl font-black text-slate-800 mt-1">{totalAcaoSocial}</h2>
                    </div>
                </div>

                {/* LISTA / TIMELINE */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-lg">Histórico de Ocorrências</h3>
                        <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition shadow-md shadow-blue-200">
                            <PlusCircle size={18} /> Nova Atividade
                        </button>
                    </div>

                    <div className="p-6">
                        {filteredActivities.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 flex flex-col items-center">
                                <Calendar size={48} className="mb-4 opacity-50" />
                                <p>Nenhuma atividade registrada no ano de {filterYear}.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredActivities.map((act) => (
                                    <div key={act.id} className="flex flex-col md:flex-row gap-4 p-4 border border-slate-100 bg-slate-50 hover:bg-slate-100 transition rounded-xl relative group">
                                        <div className="flex-shrink-0 w-24 flex flex-col items-center justify-center text-center border-r border-slate-200 pr-4">
                                            <span className="text-2xl font-black text-blue-600">{act.date.split('-')[2]}</span>
                                            <span className="text-xs font-bold text-slate-500 uppercase">{new Date(act.date + 'T00:00:00').toLocaleString('pt-BR', { month: 'short' })}</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded">{act.category}</span>
                                            </div>
                                            <h4 className="font-bold text-slate-800 text-lg leading-tight">{act.title}</h4>
                                            {act.description && <p className="text-sm text-slate-600 mt-2">{act.description}</p>}
                                        </div>
                                        <div className="flex flex-row md:flex-col justify-between items-end md:items-center pl-4 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0">
                                            {/* SÓ MOSTRA O NÚMERO SE FOR BATISMO OU AÇÃO SOCIAL */}
                                            {(act.category === 'Batismo' || act.category === 'Ação Social') && (
                                                <div className="text-center">
                                                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Qtd/Vidas</span>
                                                    <span className="block text-xl font-black text-slate-800">{act.quantity}</span>
                                                </div>
                                            )}
                                            {(userRole === 'admin' || act.createdBy === userRole) && (
                                                <button onClick={() => handleDelete(act.id!)} className="text-red-400 hover:text-red-600 transition p-2 bg-red-50 rounded-lg opacity-100 md:opacity-0 group-hover:opacity-100 mt-2">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL DE NOVA ATIVIDADE */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800">Registrar Atividade</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Data</label>
                                    <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3 border rounded-lg mt-1" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
                                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-3 border rounded-lg mt-1 bg-white">
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            {/* LINHA DINÂMICA: Título e Quantidade (se for batismo) */}
                            <div className={`grid ${formData.category === 'Batismo' ? 'grid-cols-2 gap-4' : 'grid-cols-1'}`}>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">
                                        {formData.category === 'Casamento' ? 'Nome dos Noivos' : 'Título Curto'}
                                    </label>
                                    <input required type="text" placeholder={formData.category === 'Casamento' ? "Ex: João e Maria" : "Ex: Culto de Ceia"} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3 border rounded-lg mt-1" />
                                </div>
                                
                                {formData.category === 'Batismo' && (
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Qtd de Vidas</label>
                                        <input required type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} className="w-full p-3 border rounded-lg mt-1" />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Detalhes / Relatório da Atividade</label>
                                <textarea rows={4} placeholder="Escreva aqui todas as observações, texto base que foi pregado, ou detalhes da visita..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 border rounded-lg mt-1 resize-none bg-slate-50" />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl border font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                                <button type="submit" disabled={saving} className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 flex items-center gap-2">
                                    {saving ? <Loader2 className="animate-spin" size={18} /> : "Salvar Registro"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}