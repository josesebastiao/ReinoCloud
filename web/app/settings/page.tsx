"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChurch } from "../../contexts/ChurchContext";
import { db } from "../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Settings, Building2, User, Phone, Mail, ShieldAlert, Loader2, Save } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  
  // Puxamos também o updateContextData (setChurchData), logoUrl, signatureUrl, currency e userName
  const { churchId, userRole, hasPermission, loading: authLoading, setChurchData: updateContextData, logoUrl, signatureUrl, currency, userName } = useChurch();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [churchData, setChurchData] = useState({
    name: "",
    responsibleName: "",
    phone: "",
    email: "",
    planLimit: 0,
    status: "active"
  });

  useEffect(() => {
    if (!authLoading) {
        if (userRole !== 'admin' && !hasPermission('admin')) {
            router.push('/');
        }
    }
  }, [authLoading, userRole, hasPermission, router]);

  useEffect(() => {
    if (churchId) {
        loadData();
    }
  }, [churchId]);

  const loadData = async () => {
    if (!churchId) return;
    setLoading(true);
    try {
        const docRef = doc(db, "churches", churchId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            setChurchData({
                name: data.name || "",
                responsibleName: data.responsibleName || "",
                phone: data.phone || "",
                email: data.email || "",
                planLimit: data.planLimit || 0,
                status: data.status || "active"
            });
        }
    } catch (error) {
        console.error("Erro ao carregar dados da igreja", error);
    } finally {
        setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!churchId) return;
      setSaving(true);
      try {
          // 1. Atualiza no Banco de Dados
          await updateDoc(doc(db, "churches", churchId), {
              name: churchData.name,
              responsibleName: churchData.responsibleName,
              phone: churchData.phone,
              email: churchData.email,
          });

          // 2. FORÇA A ATUALIZAÇÃO DA MEMÓRIA INSTANTANEAMENTE (Sem precisar de Logout)
          const newUserName = userRole === 'admin' ? churchData.responsibleName : userName;
          updateContextData(
              churchId,
              churchData.name,
              userRole,
              newUserName, // Injeta o novo nome do Pastor no Dashboard
              logoUrl,
              signatureUrl,
              currency
          );

          alert("Dados salvos com sucesso!");
      } catch (error) {
          console.error("Erro ao salvar", error);
          alert("Ocorreu um erro ao salvar os dados.");
      } finally {
          setSaving(false);
      }
  };

  if (authLoading || loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <div className="bg-[#1D4ED8] pt-10 pb-24 px-8 shadow-sm">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Settings className="text-blue-300"/> Configurações
            </h1>
            <p className="text-blue-100 text-lg opacity-90">Gerencie os dados oficiais da sua igreja.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-0 -mt-16 relative z-10">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <form onSubmit={handleSave} className="p-6 md:p-8 space-y-8">
                  
                  {/* DADOS DA IGREJA */}
                  <div>
                      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 border-b pb-2">
                          <Building2 size={20} className="text-blue-600"/> Dados Institucionais
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase">Nome da Igreja</label>
                              <input 
                                  required 
                                  type="text" 
                                  value={churchData.name} 
                                  onChange={e => setChurchData({...churchData, name: e.target.value})} 
                                  className="w-full p-3 border border-gray-200 rounded-xl mt-1 focus:ring-2 focus:ring-blue-100 outline-none bg-gray-50 focus:bg-white transition"
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><User size={14}/> Pastor Responsável</label>
                              <input 
                                  required 
                                  type="text" 
                                  value={churchData.responsibleName} 
                                  onChange={e => setChurchData({...churchData, responsibleName: e.target.value})} 
                                  className="w-full p-3 border border-gray-200 rounded-xl mt-1 focus:ring-2 focus:ring-blue-100 outline-none bg-gray-50 focus:bg-white transition"
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Phone size={14}/> Telefone Principal</label>
                              <input 
                                  type="text" 
                                  value={churchData.phone} 
                                  onChange={e => setChurchData({...churchData, phone: e.target.value})} 
                                  className="w-full p-3 border border-gray-200 rounded-xl mt-1 focus:ring-2 focus:ring-blue-100 outline-none bg-gray-50 focus:bg-white transition"
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Mail size={14}/> E-mail Oficial</label>
                              <input 
                                  type="email" 
                                  value={churchData.email} 
                                  onChange={e => setChurchData({...churchData, email: e.target.value})} 
                                  className="w-full p-3 border border-gray-200 rounded-xl mt-1 focus:ring-2 focus:ring-blue-100 outline-none bg-gray-50 focus:bg-white transition"
                              />
                          </div>
                      </div>
                  </div>

                  {/* INFO DO PLANO (SOMENTE LEITURA) */}
                  <div>
                      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 border-b pb-2">
                          <ShieldAlert size={20} className="text-blue-600"/> Plano e Assinatura
                      </h2>
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                              <p className="text-sm font-bold text-blue-900">Status da Conta: <span className={`uppercase px-2 py-0.5 rounded text-[10px] ml-2 ${churchData.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{churchData.status === 'active' ? 'Ativa' : 'Bloqueada'}</span></p>
                              <p className="text-xs text-blue-700 mt-1">Limite do Plano Atual: <strong>{churchData.planLimit} Membros Ativos</strong></p>
                          </div>
                          <div className="text-xs text-blue-600 bg-white px-3 py-2 rounded-lg font-medium border border-blue-100 shadow-sm text-center">
                              Para alterar limites, entre em contato<br/>com o Suporte ReinoCloud.
                          </div>
                      </div>
                  </div>

                  {/* BOTÃO SALVAR */}
                  <div className="flex justify-end pt-4">
                      <button 
                          type="submit" 
                          disabled={saving} 
                          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition flex items-center gap-2 w-full md:w-auto justify-center disabled:opacity-70"
                      >
                          {saving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                          {saving ? 'Salvando...' : 'Salvar Alterações'}
                      </button>
                  </div>
              </form>
          </div>
      </div>
    </div>
  );
}