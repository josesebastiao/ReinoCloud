"use client";
import { useState, useEffect } from "react";
// CORREÇÃO AQUI: Note os dois pontos ../../ para voltar duas pastas
import { churchService } from "../../services/churchService"; 
import { Church } from "../../types/church";
import { Building2, Plus, ShieldAlert, CheckCircle } from "lucide-react";

export default function SuperAdmin() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados do formulário
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const loadChurches = async () => {
    try {
      const list = await churchService.listAll();
      setChurches(list);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChurches();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await churchService.create({
        name: newName,
        slug: newName.toLowerCase().replace(/ /g, '-'),
        adminEmail: newEmail,
        plan: 'basic',
        active: true,
        maxMembers: 100
      });
      setShowForm(false);
      setNewName("");
      setNewEmail("");
      loadChurches();
      alert("✅ Igreja criada com sucesso!");
    } catch (error) {
      alert("❌ Erro ao criar igreja");
      console.error(error);
    }
  };

  const toggleStatus = async (church: Church) => {
    if(!church.id) return;
    if(confirm(`Deseja ${church.active ? 'BLOQUEAR' : 'ATIVAR'} a igreja ${church.name}?`)) {
        await churchService.toggleStatus(church.id, church.active);
        loadChurches();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">ReinoCloud <span className="text-white text-base font-normal opacity-50">| Super Admin</span></h1>
            <p className="text-slate-400">Gestão dos Tenants (Clientes)</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} /> Nova Igreja
          </button>
        </div>

        {/* Formulário de Cadastro Rápido */}
        {showForm && (
          <div className="bg-slate-800 p-6 rounded-lg mb-8 border border-slate-700 animate-in fade-in slide-in-from-top-4">
            <h3 className="font-bold mb-4">Cadastrar Novo Cliente</h3>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input 
                placeholder="Nome da Igreja" 
                className="bg-slate-900 border border-slate-700 p-2 rounded text-white"
                value={newName} onChange={e => setNewName(e.target.value)} required
              />
              <input 
                placeholder="E-mail do Pastor" 
                className="bg-slate-900 border border-slate-700 p-2 rounded text-white"
                value={newEmail} onChange={e => setNewEmail(e.target.value)} required
              />
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white p-2 rounded">
                Confirmar Cadastro
              </button>
            </form>
          </div>
        )}

        {/* Lista de Clientes */}
        <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="p-4">Igreja</th>
                <th className="p-4">Plano</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {churches.map(church => (
                <tr key={church.id} className="hover:bg-slate-700/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-700 p-2 rounded-full">
                        <Building2 size={20} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium">{church.name}</p>
                        <p className="text-xs text-slate-500">{church.adminEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-700 px-2 py-1 rounded text-xs uppercase font-bold text-slate-300">
                      {church.plan}
                    </span>
                  </td>
                  <td className="p-4">
                    {church.active ? (
                        <span className="flex items-center gap-1 text-green-400 text-sm"><CheckCircle size={14}/> Ativa</span>
                    ) : (
                        <span className="flex items-center gap-1 text-red-400 text-sm"><ShieldAlert size={14}/> Bloqueada</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                        onClick={() => toggleStatus(church)}
                        className={`text-xs px-3 py-1 rounded border ${
                            church.active 
                            ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' 
                            : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                        }`}
                    >
                        {church.active ? 'Bloquear Acesso' : 'Reativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {churches.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-500">
                Nenhuma igreja cadastrada ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}