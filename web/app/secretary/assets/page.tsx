"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChurch } from "../../../contexts/ChurchContext";
import { assetService, Asset } from "../../../services/assetService";
import {
    Package, Plus, Trash2, Printer, Edit2,
    Search, Loader2, ArrowLeft, Archive, X,
    UploadCloud, Download
} from "lucide-react";

export default function AssetsPage() {
    const router = useRouter();
    const { churchId, churchName, userRole, hasPermission, loading: authLoading } = useChurch();

    const [assets, setAssets] = useState<Asset[]>([]);
    const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [printing, setPrinting] = useState(false);
    const [importing, setImporting] = useState(false);

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        quantity: 1,
        condition: "bom",
        location: "",
        description: "",
        acquisitionDate: ""
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            const allowed = ['admin', 'pastor', 'secretary'];
            if (!allowed.includes(userRole || "") && !hasPermission('secretary')) {
                router.push('/');
            }
        }
    }, [authLoading, userRole, hasPermission, router]);

    useEffect(() => {
        if (churchId) {
            loadAssets();
        }
    }, [churchId]);

    useEffect(() => {
        if (search.trim() === "") {
            setFilteredAssets(assets);
        } else {
            const lowerSearch = search.toLowerCase();
            setFilteredAssets(assets.filter(a =>
                a.name.toLowerCase().includes(lowerSearch) ||
                (a.location && a.location.toLowerCase().includes(lowerSearch))
            ));
        }
    }, [search, assets]);

    const loadAssets = async () => {
        if (!churchId) return;
        setLoading(true);
        try {
            const data = await assetService.listByChurch(churchId);
            setAssets(data);
            setFilteredAssets(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (asset?: Asset) => {
        if (asset) {
            setEditingAsset(asset);
            setFormData({
                name: asset.name,
                quantity: asset.quantity || 1,
                condition: asset.condition || 'bom',
                location: asset.location || '',
                description: asset.description || '',
                acquisitionDate: asset.acquisitionDate || ''
            });
        } else {
            setEditingAsset(null);
            setFormData({
                name: "",
                quantity: 1,
                condition: "bom",
                location: "",
                description: "",
                acquisitionDate: ""
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!churchId) return;
        setSaving(true);
        try {
            if (editingAsset && editingAsset.id) {
                await assetService.update(editingAsset.id, {
                    ...formData,
                    condition: formData.condition as 'novo' | 'bom' | 'regular' | 'ruim'
                });
            } else {
                await assetService.create({
                    ...formData,
                    churchId,
                    condition: formData.condition as any
                });
            }
            setIsModalOpen(false);
            loadAssets();
        } catch (error) {
            alert("Erro ao salvar patrimônio.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Tem certeza que deseja excluir este item?")) {
            await assetService.delete(id);
            loadAssets();
        }
    };

    const handlePrint = () => {
        setPrinting(true);
        const printWindow = window.open('', '_blank', 'width=900,height=600');
        if (!printWindow) {
            setPrinting(false);
            return alert("Por favor, permita os pop-ups do navegador para imprimir.");
        }

        try {
            printWindow.document.open();
            printWindow.document.write('<html><body style="font-family: sans-serif; padding: 40px; text-align: center; color: #333;"><h2>Gerando relatório...</h2><p>Por favor, aguarde.</p></body></html>');
            printWindow.document.close();

            const rows = filteredAssets.map((asset, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td><b>${asset.name}</b></td>
                    <td>${asset.quantity}</td>
                    <td style="text-transform: capitalize;">${asset.condition}</td>
                    <td>${asset.location || '-'}</td>
                </tr>
            `).join('');

            const dateStr = new Date().toLocaleDateString('pt-BR');

            const html = `
                <html>
                <head>
                    <title>Relatório de Patrimônio</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; text-align: center; } 
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; text-align: left; } 
                        th { background: #f9fafb; padding: 12px 8px; border-bottom: 2px solid #ddd; } 
                        td { padding: 8px; border-bottom: 1px solid #eee; }
                        .close-btn { position: fixed; top: 15px; left: 15px; z-index: 9999; background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 50px; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.3); cursor: pointer; text-decoration: none; font-size: 14px; } 
                        @media print { .close-btn { display: none; } }
                    </style>
                </head>
                <body>
                    <button onclick="window.close()" class="close-btn">← FECHAR</button>
                    <h1>${churchName || 'Igreja'}</h1>
                    <p>Relatório de Patrimônio • ${dateStr}</p>
                    <p style="margin-bottom: 30px; color: #666;">Total de Itens Listados: ${filteredAssets.length}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Nome do Item / Descrição</th>
                                <th>Qtd</th>
                                <th>Estado</th>
                                <th>Localização</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                    <script>
                        window.onload = function() { setTimeout(() => window.print(), 500); }
                    </script>
                </body>
                </html>
            `;

            printWindow.document.open();
            printWindow.document.write(html);
            printWindow.document.close();
            setPrinting(false);
        } catch (error) {
            printWindow.document.open();
            printWindow.document.write('<html><body><h3 style="color:red; text-align:center;">Erro ao gerar relatório. Tente novamente.</h3></body></html>');
            printWindow.document.close();
            setPrinting(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !churchId) return;

        if (!confirm("Atenção: A primeira linha do CSV será ignorada (cabeçalho). Certifique-se de que a ordem das colunas seja: Nome, Quantidade, Estado, Localização, Descrição, Data(YYYY-MM-DD).\nDeseja continuar?")) {
            event.target.value = '';
            return;
        }

        setImporting(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                // Descobre o separador
                const separator = text.includes(';') ? ';' : ',';
                const rows = text.split('\n').filter(r => r.trim() !== '');

                let count = 0;
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    const cols = row.split(separator).map(col => col.trim().replace(/^"|"$/g, ''));

                    if (cols.length >= 1 && cols[0]) {
                        const name = cols[0];
                        const quantity = parseInt(cols[1]) || 1;
                        let conditionInput = (cols[2] || 'bom').toLowerCase();

                        if (conditionInput.includes('novo')) conditionInput = 'novo';
                        else if (conditionInput.includes('regular')) conditionInput = 'regular';
                        else if (conditionInput.includes('ruim')) conditionInput = 'ruim';
                        else conditionInput = 'bom';

                        const location = cols[3] || '';
                        const description = cols[4] || '';
                        const acquisitionDate = cols[5] || '';

                        await assetService.create({
                            churchId,
                            name,
                            quantity,
                            condition: conditionInput as any,
                            location,
                            description,
                            acquisitionDate
                        });
                        count++;
                    }
                }
                alert(`${count} patrimônios importados com sucesso!`);
                loadAssets();
            } catch (err) {
                alert("Erro ao importar CSV. Verifique a formatação do arquivo.");
            } finally {
                setImporting(false);
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const downloadCsvTemplate = () => {
        const headers = "Nome,Quantidade,Estado(novo/bom/regular/ruim),Localizacao,Descricao,Data_Aquisicao(YYYY-MM-DD)\n";
        const sample = "Mesa de Som Yamaha,1,bom,Templo,Mesa 16 canais,2024-01-10\n";
        const blob = new Blob([headers + sample], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "patrimonio_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            <div className="bg-[#1D4ED8] pt-10 pb-20 px-6 shadow-sm">
                <div className="max-w-6xl mx-auto">
                    <button onClick={() => router.push('/secretary')} className="text-white/80 hover:text-white flex items-center gap-2 mb-4 text-sm font-bold transition">
                        <ArrowLeft size={16} /> Voltar à Secretaria
                    </button>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                                <Package className="text-blue-300" /> Patrimônio
                            </h1>
                            <p className="text-blue-100 text-lg opacity-90">Controle de bens e inventário físico da igreja.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
                <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar patrimônio ou local..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 p-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 ring-blue-100 transition"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <div className="hidden">
                            <input type="file" id="csv-upload" accept=".csv" onChange={handleFileUpload} />
                        </div>
                        <button onClick={downloadCsvTemplate} className="flex-1 md:flex-none py-2.5 px-3 border border-blue-200 text-blue-600 font-bold rounded-xl bg-blue-50 hover:bg-blue-100 transition flex items-center justify-center gap-1.5 text-xs" title="Baixar Modelo CSV para Preencher">
                            <Download size={16} /> Modelo CSV
                        </button>
                        <button onClick={() => document.getElementById('csv-upload')?.click()} disabled={importing} className="flex-1 md:flex-none py-2.5 px-3 bg-green-600 text-white font-bold rounded-xl shadow border-green-700 hover:bg-green-700 transition flex items-center justify-center gap-1.5 text-xs" title="Importar da Planilha">
                            {importing ? <Loader2 className="animate-spin" size={16} /> : <UploadCloud size={16} />} Importar CSV
                        </button>
                        <button onClick={() => handleOpenModal()} className="flex-1 md:flex-none py-2.5 px-4 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm">
                            <Plus size={18} /> Novo Item
                        </button>
                        <button onClick={handlePrint} disabled={printing || filteredAssets.length === 0} className="flex-1 md:flex-none py-2.5 px-3 border border-gray-200 text-gray-700 font-bold rounded-xl bg-white hover:bg-gray-50 transition flex items-center justify-center gap-1.5 text-sm" title="Imprimir Relatório">
                            {printing ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />} Imprimir
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 overflow-hidden border border-gray-100 min-h-[400px]">
                    {loading ? (
                        <div className="flex justify-center items-center py-20 text-blue-600"><Loader2 className="animate-spin w-10 h-10" /></div>
                    ) : filteredAssets.length === 0 ? (
                        <div className="text-center py-24 px-4 text-gray-400">
                            <Archive size={60} className="mx-auto mb-4 opacity-20" />
                            <h3 className="text-xl font-bold text-gray-600 mb-1">Nenhum patrimônio cadastrado</h3>
                            <p className="text-sm">Clique em "Novo Patrimônio" para registrar o primeiro item.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-100">
                                        <th className="p-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Item</th>
                                        <th className="p-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Local</th>
                                        <th className="p-4 text-sm font-bold text-gray-500 uppercase tracking-wider text-center">Qtd</th>
                                        <th className="p-4 text-sm font-bold text-gray-500 uppercase tracking-wider text-center">Estado</th>
                                        <th className="p-4 text-sm font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAssets.map((asset) => (
                                        <tr key={asset.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition group">
                                            <td className="p-4">
                                                <div className="font-bold text-gray-800 text-base">{asset.name}</div>
                                                {asset.description && <div className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-xs">{asset.description}</div>}
                                            </td>
                                            <td className="p-4 text-sm text-gray-600 font-medium">{asset.location || '-'}</td>
                                            <td className="p-4">
                                                <div className="text-center text-sm font-bold text-gray-800 bg-gray-50 border border-gray-100 rounded-lg py-1 w-16 mx-auto">
                                                    {asset.quantity}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider
                                                    ${asset.condition === 'novo' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                        asset.condition === 'bom' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                                            asset.condition === 'regular' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                                                'bg-red-100 text-red-700 border border-red-200'}`}>
                                                    {asset.condition}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleOpenModal(asset)} className="p-2 bg-white text-gray-400 hover:text-blue-600 border border-gray-100 hover:border-blue-200 rounded-xl shadow-sm transition" title="Editar">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(asset.id!)} className="p-2 bg-white text-gray-400 hover:text-red-600 border border-gray-100 hover:border-red-200 rounded-xl shadow-sm transition" title="Excluir">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL CRIAR/EDITAR */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-8 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Package className="text-blue-600" /> {editingAsset ? 'Editar Patrimônio' : 'Novo Patrimônio'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 bg-gray-100 p-2 rounded-full transition"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4 pt-2">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome do Item</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-blue-100 text-gray-800" placeholder="Ex: Mesa de Som Digital, Ar Condicionado..." />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Quantidade</label>
                                    <input required type="number" min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })} className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-blue-100 text-gray-800" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Estado de Conservação</label>
                                    <select required value={formData.condition} onChange={e => setFormData({ ...formData, condition: e.target.value })} className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-blue-100 text-gray-800 font-medium">
                                        <option value="novo">Novo</option>
                                        <option value="bom">Bom</option>
                                        <option value="regular">Regular</option>
                                        <option value="ruim">Ruim</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Localização (Onde está?)</label>
                                <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-blue-100 text-gray-800" placeholder="Ex: Templo Principal, Sala das Crianças..." />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Data de Aquisição (Opcional)</label>
                                <input type="date" value={formData.acquisitionDate} onChange={e => setFormData({ ...formData, acquisitionDate: e.target.value })} className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-blue-100 text-gray-800" />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Observações Gerais</label>
                                <textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-blue-100 text-gray-800 resize-none custom-scrollbar" placeholder="Marca, cor, número de série..." />
                            </div>

                            <div className="flex gap-3 pt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-600 font-bold bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition">Cancelar</button>
                                <button type="submit" disabled={saving} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition flex justify-center items-center gap-2">
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Patrimônio'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
