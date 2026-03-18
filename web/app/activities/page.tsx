"use client";
import { useState, useEffect } from "react";
import { useChurch } from "../../contexts/ChurchContext";
import { db } from "../../lib/firebase";
import { collection, query, where, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { BookOpen, Users, PlusCircle, Loader2, X, Calendar, Activity, CheckCircle2, ChevronRight, AlertCircle, BarChart3, Clock, User, Download } from "lucide-react";

export default function ActivitiesPage() {
    const { churchId, userRole, userName, hasPermission } = useChurch();

    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState<any[]>([]);
    
    const [departmentMembers, setDepartmentMembers] = useState(0);
    const [myMinistryId, setMyMinistryId] = useState<string | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

    const [form, setForm] = useState({
        title: "", date: new Date().toISOString().split('T')[0], category: "Culto/Reunião", quantity: "", description: ""
    });

    const isFullAccess = userRole === 'admin' || userRole === 'pastor' || hasPermission('secretary') || hasPermission('pastor');

    useEffect(() => {
        if (churchId) {
            loadInitialData();
        }
    }, [churchId, selectedYear]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            if (!isFullAccess) {
                const membersQ = query(collection(db, "members"), where("churchId", "==", churchId));
                const membersSnap = await getDocs(membersQ);
                // CORREÇÃO TS AQUI: as any
                const allMembers = membersSnap.docs.map(d => ({id: d.id, ...d.data()} as any));
                const me = allMembers.find((m: any) => m.fullName === userName);

                const minQ = query(collection(db, "ministries"), where("churchId", "==", churchId));
                const minSnap = await getDocs(minQ);
                // CORREÇÃO TS AQUI: as any
                const allMinistries = minSnap.docs.map(d => ({id: d.id, ...d.data()} as any));

                const myDept = allMinistries.find((m: any) => m.leaderId === me?.id || m.leaderName === me?.fullName || m.leaderName === userName);

                if (myDept) {
                    setMyMinistryId(myDept.id);
                    const qto = allMembers.filter((m: any) => m.ministries?.includes(myDept.id)).length;
                    setDepartmentMembers(qto);
                } else {
                    setDepartmentMembers(0);
                }
            } else {
                const mQ = query(collection(db, "members"), where("churchId", "==", churchId), where("status", "==", "active"));
                const mSnap = await getDocs(mQ);
                setDepartmentMembers(mSnap.size);
            }

            const startOfYear = new Date(`${selectedYear}-01-01T00:00:00`).getTime();
            const endOfYear = new Date(`${selectedYear}-12-31T23:59:59`).getTime();

            const actQ = query(collection(db, "activities"), where("churchId", "==", churchId));
            const actSnap = await getDocs(actQ);
            
            let allActivities = actSnap.docs.map(doc => {
                const data = doc.data();
                let time = 0;
                if (data.createdAt && typeof data.createdAt === 'number') time = data.createdAt;
                else if (data.date) time = new Date(data.date + "T12:00:00").getTime();
                
                return { id: doc.id, ...data, timeMs: time };
            });

            allActivities = allActivities.filter(a => a.timeMs >= startOfYear && a.timeMs <= endOfYear);
            
            if (!isFullAccess) {
                allActivities = allActivities.filter((a: any) => a.createdBy === userName);
            }

            allActivities.sort((a, b) => b.timeMs - a.timeMs);
            setActivities(allActivities);

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
            await addDoc(collection(db, "activities"), {
                ...form,
                churchId,
                quantity: Number(form.quantity),
                createdBy: userName || "Desconhecido",
                ministryId: myMinistryId || "geral",
                createdAt: Date.now()
            });
            setShowModal(false);
            setForm({ title: "", date: new Date().toISOString().split('T')[0], category: "Culto/Reunião", quantity: "", description: "" });
            loadInitialData();
            alert("Atividade registrada com sucesso!");
        } catch (error) {
            alert("Erro ao registrar atividade.");
        } finally {
            setSaving(false);
        }
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 6}, (_, i) => (currentYear - i).toString());

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans">
            <div className="bg-blue-800 pt-8 pb-32 px-4 md:px-8 shadow-sm">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <BookOpen className="text-blue-300" size={32} /> 
                            {isFullAccess ? 'Relatório Pastoral' : 'Relatório de Atividades'}
                        </h1>
                        <p className="text-blue-100 text-sm md:text-base opacity-90">
                            {isFullAccess ? 'Acompanhe o crescimento geral da igreja.' : 'Acompanhe o crescimento e as ocorrências do seu departamento.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-white/10 text-white border border-white/20 px-4 py-3 rounded-xl font-bold outline-none cursor-pointer hover:bg-white/20 transition flex-1 md:flex-none appearance-none"
                        >
                            {years.map(y => <option key={y} value={y} className="text-slate-800">Ano {y}</option>)}
                        </select>
                        {isFullAccess && (
                            <button onClick={() => window.print()} className="bg-white text-blue-800 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-50 transition shadow-sm whitespace-nowrap">
                                <Download size={20}/> Imprimir
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-0 -mt-20 relative z-10">
                {loading ? (
                    <div className="flex justify-center p-20 bg-white rounded-3xl shadow-xl border border-slate-100"><Loader2 className="animate-spin text-blue-600" size={40}/></div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100 flex flex-col items-center justify-center text-center">
                                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 border border-blue-100">
                                    <Users size={28}/>
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    {isFullAccess ? 'Membros Ativos (Igreja)' : 'Membros do Departamento'}
                                </span>
                                <h3 className="text-5xl font-black text-slate-800 tracking-tight">{departmentMembers}</h3>
                            </div>

                            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100 flex flex-col items-center justify-center text-center">
                                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100">
                                    <Activity size={28}/>
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Atividades Realizadas
                                </span>
                                <h3 className="text-5xl font-black text-slate-800 tracking-tight">{activities.length}</h3>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100 overflow-hidden">
                            <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                                <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                    <BarChart3 className="text-blue-500" size={20} /> 
                                    {isFullAccess ? 'Histórico da Igreja' : 'Histórico de Ocorrências'}
                                </h2>
                                <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-200 transition">
                                    <PlusCircle size={18}/> Nova Atividade
                                </button>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {activities.length === 0 ? (
                                    <div className="p-12 text-center flex flex-col items-center">
                                        <Calendar size={48} className="text-slate-200 mb-4"/>
                                        <h3 className="text-lg font-bold text-slate-700">Nenhuma atividade registrada.</h3>
                                        <p className="text-slate-400 text-sm mt-1">Clique no botão azul acima para registrar visitas, cultos ou reuniões.</p>
                                    </div>
                                ) : (
                                    activities.map(act => (
                                        <div key={act.id} className="p-6 flex flex-col md:flex-row gap-6 hover:bg-slate-50 transition items-start">
                                            <div className="flex items-start gap-4 shrink-0 w-full md:w-48">
                                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex flex-col items-center justify-center font-bold border border-blue-100 shadow-sm shrink-0">
                                                    <span className="text-lg leading-none">{act.date ? act.date.split('-')[2] : new Date(act.timeMs).getDate()}</span>
                                                    <span className="text-[10px] uppercase">{act.date ? new Date(act.date + "T12:00:00").toLocaleDateString('pt-BR', {month:'short'}).replace('.','') : new Date(act.timeMs).toLocaleDateString('pt-BR', {month:'short'}).replace('.','')}</span>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                        <Activity size={10}/> {act.category}
                                                    </p>
                                                    {isFullAccess && (
                                                        <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1 w-fit mt-1">
                                                            <User size={10}/> Lançado por: {act.createdBy}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1 w-full">
                                                <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight">{act.title}</h3>
                                                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{act.description}</p>
                                            </div>
                                            <div className="shrink-0 w-full md:w-32 bg-slate-50 rounded-2xl p-4 text-center border border-slate-100 self-stretch flex flex-col justify-center">
                                                <span className="text-3xl font-black text-slate-700">{act.quantity || 0}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                                                    {act.category.includes('Visita') ? 'Pessoas' : 'Presentes'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                        <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                                <PlusCircle className="text-blue-600"/> Registrar Atividade
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition bg-white p-2 rounded-full shadow-sm"><X size={20}/></button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block ml-1">Data</label>
                                    <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm bg-slate-50 focus:bg-white transition" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block ml-1">Categoria</label>
                                    <select required value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold bg-slate-50 focus:bg-white transition appearance-none">
                                        <option>Culto/Reunião</option>
                                        <option>Visita Pastoral</option>
                                        <option>Ação Social</option>
                                        <option>Evangelismo</option>
                                        <option>Outros</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block ml-1">Título Resumido</label>
                                <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm bg-slate-50 focus:bg-white transition" placeholder="Ex: Ensaio Geral" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block ml-1 flex items-center gap-1">
                                    Quantidade de Pessoas <AlertCircle size={12}/>
                                </label>
                                <input required type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm bg-slate-50 focus:bg-white transition font-bold" placeholder="Quantos participaram?" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block ml-1">Descrição / Observações</label>
                                <textarea required rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm bg-slate-50 focus:bg-white transition resize-none" placeholder="Relate como foi, quem esteve, o que foi decidido..." />
                            </div>
                            <button type="submit" disabled={saving} className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 transition flex justify-center items-center gap-2 disabled:opacity-70 mt-2">
                                {saving ? <Loader2 className="animate-spin" size={20}/> : 'Salvar no Relatório'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}