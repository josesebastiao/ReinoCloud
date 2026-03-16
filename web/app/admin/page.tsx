"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChurch } from "../../contexts/ChurchContext";
import {
    Building2, Users, DollarSign, PlusCircle, CheckCircle,
    ShieldCheck, Trash2, Ban, Check, Search, Mail, User, Crown, Flag, Globe, X, MapPin
} from "lucide-react";

// FIREBASE
import { createUserWithEmailAndPassword, updateProfile, getAuth } from "firebase/auth";
import { initializeApp, getApps, getApp } from "firebase/app";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

// Tipo para a Igreja
interface ChurchData {
    id: string;
    name: string;
    ownerName?: string;
    email?: string;
    plan: string;
    planLimit: number;
    planModules: string; 
    status: 'active' | 'blocked';
    createdAt: string;
    currency?: string; 
    isTest?: boolean;
    memberCount?: number;
    isHeadquarters?: boolean;
    parentId?: string | null;
}

export default function AdminPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(false);

    // Dados Reais
    const [churches, setChurches] = useState<ChurchData[]>([]);
    const [stats, setStats] = useState({
        totalChurches: 0,
        activeChurches: 0,
        totalMembers: 0,
        churchesBR: 0,
        churchesAO: 0,
    });

    const [newChurch, setNewChurch] = useState({
        churchName: "", name: "", email: "", password: "", plan: "congr", planLimit: 100, planModules: "full"
    });

    // ESTADOS DO MODAL DE REDE
    const [networkModal, setNetworkModal] = useState<{isOpen: boolean, church: ChurchData | null}>({isOpen: false, church: null});
    const [editIsHq, setEditIsHq] = useState(false);
    const [editParentId, setEditParentId] = useState("");

    // CARREGAR DADOS AO ABRIR
    useEffect(() => {
        if (typeof window !== 'undefined') {
            fetchChurches();
        }
    }, [router]);

    const fetchChurches = async () => {
        try {
            const q = query(collection(db, "churches"));
            const [snapshot, membersSnapshot] = await Promise.all([
                getDocs(q),
                getDocs(collection(db, "members")),
            ]);

            // Conta membros por igreja
            const membersByChurch: Record<string, number> = {};
            membersSnapshot.forEach((mDoc) => {
                const data: any = mDoc.data();
                const cId = data.churchId;
                if (!cId) return;
                membersByChurch[cId] = (membersByChurch[cId] || 0) + 1;
            });

            const list: ChurchData[] = [];
            snapshot.forEach((docSnap) => {
                const data: any = docSnap.data();
                list.push({
                    id: docSnap.id,
                    name: data.name,
                    ownerName: data.ownerName || "Pastor N/A",
                    email: data.email || "Sem e-mail",
                    plan: data.plan || "congr",
                    planLimit: data.planLimit || 100,
                    planModules: data.planModules || "full",
                    status: data.status || "active",
                    createdAt: data.createdAt,
                    currency: data.currency,
                    isTest: data.isTest === true,
                    memberCount: membersByChurch[docSnap.id] || 0,
                    isHeadquarters: data.isHeadquarters === true,
                    parentId: data.parentId || null,
                });
            });

            setChurches(list);

            const nonTest = list.filter((c) => !c.isTest);

            setStats({
                totalChurches: nonTest.length,
                activeChurches: nonTest.filter((c) => c.status === "active").length,
                totalMembers: nonTest.reduce((acc, c) => acc + (c.memberCount || 0), 0),
                churchesBR: nonTest.filter((c) => c.currency === "BR").length,
                churchesAO: nonTest.filter((c) => c.currency === "AO").length,
            });

        } catch (error) {
            console.error("Erro ao buscar igrejas:", error);
        }
    };

    const handlePlanChangeSelect = (value: string) => {
        let limit = 100;
        if (value === 'sede') limit = 400;
        if (value === 'min') limit = 999999; 

        setNewChurch({ ...newChurch, plan: value, planLimit: limit });
    };

    const handleCreateChurch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // SOLUÇÃO PARA NÃO DESLOGAR O SUPER ADMIN: Usar um App Secundário
            const defaultApp = getApp();
            const secondaryApp = getApps().find(app => app.name === "SecondaryApp") || initializeApp(defaultApp.options, "SecondaryApp");
            const secondaryAuth = getAuth(secondaryApp);

            // 1. CRIAR USUÁRIO NO FIREBASE AUTH (No app secundário)
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newChurch.email, newChurch.password);
            const user = userCredential.user;

            // Atualiza o nome do perfil Auth
            await updateProfile(user, { displayName: newChurch.name });

            // Desloga apenas o app secundário
            await secondaryAuth.signOut();

            // 2. SALVAR NO FIRESTORE (BANCO DE DADOS)
            const churchId = `church_${user.uid}`;
            const nowIso = new Date().toISOString();

            await setDoc(doc(db, "churches", churchId), {
                name: newChurch.churchName,
                ownerName: newChurch.name,
                email: newChurch.email,
                createdAt: nowIso,
                plan: newChurch.plan,
                planLimit: newChurch.planLimit,
                planModules: newChurch.planModules,
                status: "active",
                ownerId: user.uid,
                initialPasswordCreatedAt: nowIso,
                initialPasswordShouldChange: true,
                isHeadquarters: false,
                parentId: null
            });

            // Cria o registro do Membro Admin (Pastor)
            await setDoc(doc(db, "members", user.uid), {
                fullName: newChurch.name,
                email: newChurch.email,
                churchId: churchId,
                role: "admin",
                status: "active",
                createdAt: new Date().toISOString()
            });

            alert("✅ Igreja criada com sucesso!");
            setNewChurch({ churchName: "", name: "", email: "", password: "", plan: "congr", planLimit: 100, planModules: "full" });
            fetchChurches();

        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/email-already-in-use') {
                alert("⚠️ ERRO: Este e-mail já está cadastrado no sistema de Login.\n\nComo você excluiu a igreja mas o login ficou preso, vá no console do Firebase > Authentication e exclua o usuário manualmente, ou use outro e-mail.");
            } else {
                alert("Erro: " + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (church: ChurchData) => {
        const newStatus = church.status === 'active' ? 'blocked' : 'active';
        const action = newStatus === 'blocked' ? 'BLOQUEAR' : 'DESBLOQUEAR';

        if (confirm(`Tem certeza que deseja ${action} a igreja "${church.name}"?`)) {
            try {
                await updateDoc(doc(db, "churches", church.id), {
                    status: newStatus
                });
                fetchChurches();
            } catch (error) {
                alert("Erro ao atualizar status.");
            }
        }
    };

    const handleUpgradePlan = async (church: ChurchData) => {
        const currentLabel = church.planLimit > 400 ? 'Ministério (Ilimitado)' : church.planLimit > 100 ? 'Sede (400)' : 'Congregação (100)';

        const promptResult = prompt(
            `PLANOS DISPONÍVEIS:\n1 - Congregação (Até 100 membros)\n2 - Sede (Até 400 membros)\n3 - Ministério (Ilimitado)\n\nPlano Atual: ${currentLabel}\n\nDigite o NÚMERO do novo plano (1, 2 ou 3):`
        );

        if (!promptResult) return;

        let newPlan = church.plan;
        let newLimit = church.planLimit;

        if (promptResult === "1") { newPlan = "congr"; newLimit = 100; }
        else if (promptResult === "2") { newPlan = "sede"; newLimit = 400; }
        else if (promptResult === "3") { newPlan = "min"; newLimit = 999999; }
        else { alert("Opção inválida."); return; }

        if (confirm(`Mudar o limite da igreja "${church.name}" para ${newLimit > 400 ? 'ILIMITADO' : newLimit + ' membros'}?`)) {
            try {
                await updateDoc(doc(db, "churches", church.id), {
                    plan: newPlan,
                    planLimit: newLimit
                });
                alert("Plano atualizado com sucesso!");
                fetchChurches();
            } catch (error) {
                alert("Erro ao atualizar plano.");
            }
        }
    };

    const handleUpgradeModules = async (church: ChurchData) => {
        const currentMod = church.planModules === 'admin' ? 'Apenas Administrativo (Secretaria e Tesouraria)' : 'Sistema Completo';

        const promptResult = prompt(
            `MÓDULOS DISPONÍVEIS:\n1 - Completo (Todos os Recursos)\n2 - Apenas Administrativo (Membros, Tesouraria)\n\nMódulo Atual: ${currentMod}\n\nDigite o NÚMERO (1 ou 2) para alterar:`
        );

        if (!promptResult) return;

        let newModules = church.planModules;

        if (promptResult === "1") { newModules = "full"; }
        else if (promptResult === "2") { newModules = "admin"; }
        else { alert("Opção inválida."); return; }

        if (confirm(`Mudar os módulos da igreja "${church.name}" para ${newModules === 'full' ? 'COMPLETO' : 'APENAS ADMINISTRATIVO'}?`)) {
            try {
                await updateDoc(doc(db, "churches", church.id), {
                    planModules: newModules
                });
                alert("Módulos atualizados com sucesso!");
                fetchChurches();
            } catch (error) {
                alert("Erro ao atualizar módulos.");
            }
        }
    };

    const toggleTestFlag = async (church: ChurchData) => {
        const newValue = !church.isTest;
        const label = newValue ? "marcar como IGREJA DE TESTE" : "remover da lista de testes";
        if (!confirm(`Deseja ${label} "${church.name}"?`)) return;

        try {
            await updateDoc(doc(db, "churches", church.id), {
                isTest: newValue,
            });
            fetchChurches();
        } catch (error) {
            alert("Erro ao atualizar flag de teste.");
        }
    };

    const deleteChurch = async (id: string) => {
        if (confirm("⚠️ ATENÇÃO: Isso vai apagar os DADOS da igreja, mas o LOGIN (e-mail/senha) continuará existindo no Firebase Auth.\n\nPara liberar o e-mail novamente, você precisará excluir o usuário manualmente no Console do Firebase.\n\nDeseja continuar?")) {
            try {
                await deleteDoc(doc(db, "churches", id));
                alert("Igreja removida do banco de dados.");
                fetchChurches();
            } catch (error) {
                alert("Erro ao excluir.");
            }
        }
    };

    // --- FUNÇÕES DO MODAL DE REDE ---
    const openNetworkModal = (church: ChurchData) => {
        setEditIsHq(church.isHeadquarters || false);
        setEditParentId(church.parentId || "");
        setNetworkModal({ isOpen: true, church });
    };

    const saveNetworkConfig = async () => {
        if (!networkModal.church) return;
        try {
            const finalParentId = editIsHq ? null : (editParentId || null);
            await updateDoc(doc(db, "churches", networkModal.church.id), {
                isHeadquarters: editIsHq,
                parentId: finalParentId
            });
            alert("Configuração de rede salva com sucesso!");
            setNetworkModal({ isOpen: false, church: null });
            fetchChurches();
        } catch (error) {
            alert("Erro ao salvar configuração.");
        }
    };

    const headquartersList = churches.filter(c => c.isHeadquarters);

    return (
        <div className="p-4 md:p-8 min-h-screen pb-24 bg-gray-50">

            <div className="max-w-6xl mx-auto mb-8">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <ShieldCheck className="text-red-600" /> Gestão ReinoCloud
                </h1>
                <p className="text-gray-500 text-sm">Controle total dos seus clientes</p>
            </div>

            {/* STATS */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600"><Building2 size={24} /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Igrejas (Clientes)</p>
                        <h3 className="text-2xl font-extrabold text-gray-800">{stats.totalChurches}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-50 text-green-600"><CheckCircle size={24} /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Igrejas Ativas</p>
                        <h3 className="text-2xl font-extrabold text-gray-800">{stats.activeChurches}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600"><Users size={24} /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Membros Cadastrados</p>
                        <h3 className="text-2xl font-extrabold text-gray-800">{stats.totalMembers}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600"><Flag size={24} /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Igrejas por País</p>
                        <div className="flex gap-3 mt-1 text-xs font-semibold text-gray-700">
                            <span className="flex items-center gap-1">🇧🇷 {stats.churchesBR}</span>
                            <span className="flex items-center gap-1">🇦🇴 {stats.churchesAO}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* FORMULÁRIO */}
                <div className="lg:col-span-1 h-fit bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden sticky top-8">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <h2 className="font-bold text-gray-700 flex items-center gap-2"><PlusCircle size={18} className="text-blue-600" /> Nova Igreja</h2>
                    </div>
                    <form onSubmit={handleCreateChurch} className="p-6 space-y-4">
                        <div><label className="text-[10px] font-bold text-gray-500 uppercase">Nome da Igreja</label><input type="text" required value={newChurch.churchName} onChange={e => setNewChurch({ ...newChurch, churchName: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl text-sm" placeholder="Ex: Igreja Batista..." /></div>
                        <div><label className="text-[10px] font-bold text-gray-500 uppercase">Pastor Responsável</label><input type="text" required value={newChurch.name} onChange={e => setNewChurch({ ...newChurch, name: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl text-sm" placeholder="Ex: Pr. João" /></div>
                        <div><label className="text-[10px] font-bold text-gray-500 uppercase">E-mail de Login</label><input type="email" required value={newChurch.email} onChange={e => setNewChurch({ ...newChurch, email: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl text-sm" placeholder="email@igreja.com" /></div>
                        <div><label className="text-[10px] font-bold text-gray-500 uppercase">Senha Inicial</label><input type="text" required value={newChurch.password} onChange={e => setNewChurch({ ...newChurch, password: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl text-sm" placeholder="******" /></div>

                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Plano (Limite de Membros)</label>
                            <select value={newChurch.plan} onChange={e => handlePlanChangeSelect(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl text-sm font-bold bg-gray-50">
                                <option value="congr">Plano Congregação (Até 100)</option>
                                <option value="sede">Plano Sede (Até 400)</option>
                                <option value="min">Plano Ministério (Ilimitado)</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Módulo</label>
                            <select value={newChurch.planModules} onChange={e => setNewChurch({ ...newChurch, planModules: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl text-sm font-bold bg-gray-50">
                                <option value="full">Completo (Todos os Recursos)</option>
                                <option value="admin">Administrativo (Sec. e Tesouraria)</option>
                            </select>
                        </div>

                        <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center justify-center gap-2 text-sm">{loading ? 'Criando...' : 'Cadastrar Cliente'}</button>
                    </form>
                </div>

                {/* LISTA DE CLIENTES */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="font-bold text-gray-700 flex items-center gap-2"><Users size={18} className="text-gray-500" /> Lista de Igrejas</h2>
                            <span className="text-xs font-bold text-gray-400">{churches.length} Cadastros</span>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {churches.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                                    <Search size={40} className="mb-2 opacity-20" />
                                    <p>Nenhuma igreja cadastrada ainda.</p>
                                </div>
                            ) : (
                                churches.map((church) => {
                                    const parentChurch = church.parentId ? churches.find(c => c.id === church.parentId) : null;
                                    
                                    return (
                                    <div key={church.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50 transition">
                                        <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs ${church.status === 'active' ? 'bg-blue-600' : 'bg-red-500'}`}>
                                                {church.name.substring(0, 2).toUpperCase()}
                                            </div>

                                            <div className="min-w-0">
                                                <h3 className={`font-bold text-sm truncate ${church.status === 'blocked' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{church.name}</h3>

                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-gray-500 mt-1">
                                                    <span className="flex items-center gap-1"><User size={10} /> {church.ownerName}</span>
                                                    <span className="hidden sm:inline text-gray-300">•</span>
                                                    <span className="flex items-center gap-1"><Mail size={10} /> {church.email}</span>
                                                </div>

                                                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                                                    {/* TAGS DE REDE AQUI */}
                                                    {church.isHeadquarters && (
                                                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                                                            Sede Principal
                                                        </span>
                                                    )}
                                                    {church.parentId && (
                                                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 border border-cyan-200">
                                                            Filial: {parentChurch?.name?.substring(0,10) || 'Sede'}...
                                                        </span>
                                                    )}

                                                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${church.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {church.status === 'active' ? 'Ativo' : 'Bloqueado'}
                                                    </span>
                                                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${church.planLimit > 400 ? 'bg-purple-100 text-purple-700' : church.planLimit > 100 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        Limite: {church.planLimit > 400 ? 'Ilimitado' : church.planLimit}
                                                    </span>
                                                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${church.planModules === 'admin' ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'}`} title={church.planModules === 'admin' ? "Apenas Administrativo" : "Completo"}>
                                                        Módulos: {church.planModules === 'admin' ? 'Admin' : 'Compl'}
                                                    </span>
                                                    {church.memberCount !== undefined && (
                                                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                                            Membros: {church.memberCount}
                                                        </span>
                                                    )}
                                                    <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                        {church.currency === 'BR' ? '🇧🇷 Brasil' : church.currency === 'AO' ? '🇦🇴 Angola' : '🌎 Outro'}
                                                    </span>
                                                    {church.isTest && (
                                                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                                                            Teste
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 w-full sm:w-auto">

                                            {/* BOTÃO DO GLOBO (REDE) FICA AQUI */}
                                            <button
                                                onClick={() => openNetworkModal(church)}
                                                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 min-w-[36px] ${church.isHeadquarters || church.parentId ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}
                                                title="Configurar Rede (Matriz/Filial)"
                                            >
                                                <Globe size={14} />
                                            </button>

                                            <button
                                                onClick={() => handleUpgradePlan(church)}
                                                className="px-3 py-2 rounded-lg text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 transition flex items-center justify-center gap-1 min-w-[36px]"
                                                title="Atualizar Limite"
                                            >
                                                <Crown size={14} />
                                            </button>

                                            <button
                                                onClick={() => handleUpgradeModules(church)}
                                                className="px-3 py-2 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition flex items-center justify-center gap-1 min-w-[36px]"
                                                title="Mudar Módulos"
                                            >
                                                <Building2 size={14} />
                                            </button>

                                            <button
                                                onClick={() => toggleTestFlag(church)}
                                                className={`px-3 py-2 rounded-lg text-xs font-bold ${church.isTest ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'} transition flex items-center justify-center gap-1 min-w-[60px]`}
                                                title="Marcar ou desmarcar como igreja de teste"
                                            >
                                                <Flag size={14} />
                                                {church.isTest ? 'Teste' : 'Real'}
                                            </button>

                                            <button
                                                onClick={() => toggleStatus(church)}
                                                className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition border ${church.status === 'active'
                                                        ? 'border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                                                        : 'bg-green-600 text-white border-transparent hover:bg-green-700'
                                                    }`}
                                            >
                                                {church.status === 'active' ? <><Ban size={14} /> Bloq</> : <><Check size={14} /> Liberar</>}
                                            </button>

                                            <button
                                                onClick={() => deleteChurch(church.id)}
                                                className="px-3 py-2 rounded-lg text-gray-300 hover:bg-red-100 hover:text-red-600 transition"
                                                title="Excluir Definitivamente"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )})
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* MODAL DE GESTÃO DE REDE */}
            {networkModal.isOpen && networkModal.church && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2"><Globe size={20}/> Conexões de Rede</h3>
                                <p className="text-indigo-200 text-sm">{networkModal.church.name}</p>
                            </div>
                            <button onClick={() => setNetworkModal({isOpen: false, church: null})} className="text-white hover:text-gray-200"><X size={24}/></button>
                        </div>

                        <div className="p-6 space-y-6">
                            <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${editIsHq ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                <input 
                                    type="checkbox" 
                                    checked={editIsHq} 
                                    onChange={(e) => {
                                        setEditIsHq(e.target.checked);
                                        if (e.target.checked) setEditParentId("");
                                    }}
                                    className="mt-1 w-5 h-5 text-indigo-600"
                                />
                                <div>
                                    <h4 className="font-bold text-gray-800">Esta igreja é uma Sede (Matriz)</h4>
                                    <p className="text-xs text-gray-500 mt-1">Habilita a visão global e permite que outras igrejas sejam vinculadas a esta como filiais.</p>
                                </div>
                            </label>

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-gray-200"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase">Ou</span>
                                <div className="flex-grow border-t border-gray-200"></div>
                            </div>

                            <div className={`p-4 rounded-xl border-2 transition ${!editIsHq && editParentId ? 'border-cyan-500 bg-cyan-50' : 'border-gray-200'}`}>
                                <h4 className="font-bold text-gray-800 mb-2">Vincular como Filial</h4>
                                <select 
                                    value={editParentId}
                                    onChange={(e) => setEditParentId(e.target.value)}
                                    disabled={editIsHq}
                                    className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Nenhuma (Igreja Independente)</option>
                                    {headquartersList
                                        .filter(hq => hq.id !== networkModal.church?.id) 
                                        .map(hq => (
                                        <option key={hq.id} value={hq.id}>{hq.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-2">
                                    {editIsHq ? "Desmarque a opção de Sede acima para vincular como filial." : "Selecione a matriz desta congregação."}
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                            <button onClick={() => setNetworkModal({isOpen: false, church: null})} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50">Cancelar</button>
                            <button onClick={saveNetworkConfig} className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md">Salvar Rede</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}