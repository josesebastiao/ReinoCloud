"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChurch } from "../../contexts/ChurchContext";
import { db } from "../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Globe, Users, TrendingUp, Building2, ArrowRight, Loader2, MapPin, DollarSign, ShieldCheck } from "lucide-react";

export default function NetworkDashboard() {
    const router = useRouter();
    const { churchId, churchName, isHeadquarters, headquartersId, branches, formatMoney, switchChurch, loading: authLoading } = useChurch();

    const [loading, setLoading] = useState(true);
    const [networkData, setNetworkData] = useState<any[]>([]);
    const [globalStats, setGlobalStats] = useState({ totalChurches: 0, totalMembers: 0, totalBalance: 0 });

    useEffect(() => {
        if (!authLoading) {
            if (!isHeadquarters) router.push('/');
            else loadNetworkData();
        }
    }, [authLoading, isHeadquarters, churchId, headquartersId]);

    const loadNetworkData = async () => {
        if (!churchId) return;
        setLoading(true);
        try {
            const hqId = headquartersId || churchId; 
            
            // TRUQUE DE MESTRE: Array.from(new Set(...)) remove 100% de qualquer ID duplicado
            const allIds = [hqId, ...branches.map(b => b.id)];
            const uniqueIds = Array.from(new Set(allIds)); 
            
            const results = [];
            let sumMembers = 0; let sumBalance = 0;

            for (const id of uniqueIds) {
                const isHq = id === hqId;
                let name = isHq ? (id === churchId ? (churchName || "Sede") : "Sede Principal") : (branches.find(b => b.id === id)?.name || "Filial");

                const membersQ = query(collection(db, "members"), where("churchId", "==", id));
                const membersSnap = await getDocs(membersQ);
                const totalM = membersSnap.size;
                const activeM = membersSnap.docs.filter(doc => doc.data().status === 'active').length;

                const finQ = query(collection(db, "transactions"), where("churchId", "==", id));
                const finSnap = await getDocs(finQ);
                let inc = 0; let exp = 0;
                finSnap.forEach(doc => {
                    const t = doc.data();
                    if (t.type === 'income') inc += Number(t.amount);
                    if (t.type === 'expense') exp += Number(t.amount);
                });
                const bal = inc - exp;

                results.push({ id, name, isHeadquarters: isHq, totalMembers: totalM, activeMembers: activeM, balance: bal });
                sumMembers += totalM; sumBalance += bal;
            }

            setNetworkData(results);
            setGlobalStats({ totalChurches: uniqueIds.length, totalMembers: sumMembers, totalBalance: sumBalance });

        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const handleVisitBranch = async (targetId: string) => {
        if (targetId === churchId) return;
        await switchChurch(targetId);
        window.location.href = "/";
    };

    if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={40}/></div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans">
            <div className="bg-[#0F172A] pt-10 pb-32 px-4 md:px-8 shadow-sm">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3"><Globe className="text-indigo-400" size={32} /> Visão Global</h1>
                    <p className="text-slate-400 text-lg opacity-90">Acompanhe Sede e Filiais.</p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 md:px-0 -mt-20 relative z-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600"><Building2 size={28} /></div>
                        <div><p className="text-xs font-bold text-slate-400 uppercase">Igrejas</p><h3 className="text-3xl font-black text-slate-800">{globalStats.totalChurches}</h3></div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600"><Users size={28} /></div>
                        <div><p className="text-xs font-bold text-slate-400 uppercase">Membros</p><h3 className="text-3xl font-black text-slate-800">{globalStats.totalMembers}</h3></div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600"><DollarSign size={28} /></div>
                        <div><p className="text-xs font-bold text-slate-400 uppercase">Saldo Global</p><h3 className={`text-2xl md:text-3xl font-black ${globalStats.totalBalance < 0 ? 'text-red-500' : 'text-slate-800'}`}>{formatMoney(globalStats.totalBalance)}</h3></div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                    <div className="bg-slate-50 px-6 py-5 border-b"><h2 className="font-bold text-slate-800 text-lg flex items-center gap-2"><MapPin className="text-indigo-500" size={20} /> Mapa das Congregações</h2></div>
                    <div className="divide-y divide-slate-100">
                        {networkData.map((church) => {
                            const isCurrentChurch = church.id === churchId;
                            return (
                            <div key={church.id} className={`p-6 flex flex-col md:flex-row items-center justify-between gap-6 ${isCurrentChurch ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}>
                                <div className="flex-1 w-full">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold text-lg text-slate-800">{church.name}</h3>
                                        {church.isHeadquarters ? <span className="text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700 px-2 py-1 rounded flex items-center gap-1"><ShieldCheck size={12}/> Sede</span> : <span className="text-[10px] font-bold uppercase bg-cyan-100 text-cyan-700 px-2 py-1 rounded">Filial</span>}
                                    </div>
                                    <p className="text-sm text-slate-500">Membros: {church.activeMembers} / {church.totalMembers}</p>
                                </div>
                                <div className="flex-1 w-full md:text-center">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Saldo em Caixa</p>
                                    <p className={`font-bold text-lg ${church.balance < 0 ? 'text-red-500' : 'text-emerald-600'}`}>{formatMoney(church.balance)}</p>
                                </div>
                                <div className="w-full md:w-auto">
                                    <button onClick={() => handleVisitBranch(church.id)} className={`w-full md:w-auto px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${isCurrentChurch ? 'bg-slate-100 text-slate-400' : church.isHeadquarters ? 'bg-indigo-600 text-white' : 'bg-white border-2 border-indigo-100 text-indigo-600'}`} disabled={isCurrentChurch}>
                                        {isCurrentChurch ? 'Você está aqui' : (church.isHeadquarters ? 'Voltar para Sede' : 'Acessar Painel')} {!isCurrentChurch && <ArrowRight size={18} />}
                                    </button>
                                </div>
                            </div>
                        )})}
                    </div>
                </div>
            </div>
        </div>
    );
}