"use client";
import { useState, useEffect } from "react";
import { useChurch } from "../../contexts/ChurchContext";
import { memberService } from "../../services/memberService";
import { ministryService } from "../../services/ministryService";
import { Member } from "../../types/member";
import { Ministry } from "../../types/ministry";
import { createSystemUser } from "../../services/adminAuthService";
import { getDirectImageUrl, compressImageFile, uploadToImgbb, cacheImage, getCachedImage, validateImageFile } from "../../utils/imageHelper";
import { db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
    Users, Search, PlusCircle, Edit, Trash2, Key, Printer,
    MapPin, Phone, Mail, ChevronLeft, ChevronRight, Loader2, HandCoins, Lock, X, Building2, Heart, Briefcase, Camera, ShieldCheck, User, CreditCard, AlertTriangle, Shield, Upload, Download, Filter, ChevronDown
} from "lucide-react";

export default function MembersPage() {
    const { churchId, churchName, logoUrl, userRole, signatureUrl } = useChurch();

    const [members, setMembers] = useState<Member[]>([]);
    const [ministryOptions, setMinistryOptions] = useState<Ministry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [planLimit, setPlanLimit] = useState(100);

    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showAccessModal, setShowAccessModal] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [printing, setPrinting] = useState(false);

    // Estados para Importação de Planilha
    const [showImportModal, setShowImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

    const [viewMember, setViewMember] = useState<Member | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedMemberForAccess, setSelectedMemberForAccess] = useState<Member | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [creatingAccess, setCreatingAccess] = useState(false);

    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [isDeletingMass, setIsDeletingMass] = useState(false);
    
    const [phoneCountry, setPhoneCountry] = useState("+55");
    const [localPhone, setLocalPhone] = useState("");

    const [formData, setFormData] = useState({
        fullName: "", email: "", phone: "", document: "",
        birthDate: "", baptismDate: "", photoUrl: "",
        gender: "male", maritalStatus: "single",
        role: "member", status: "active", isTither: false,
        street: "", number: "", neighborhood: "", city: "", state: "", zipCode: "",
        selectedMinistries: [] as string[],
        permissions: [] as string[]
    });
    const [photoUploading, setPhotoUploading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    useEffect(() => {
        if (churchId) {
            loadData();
        }
    }, [churchId]);

    const loadData = async () => {
        if (!churchId) return;
        setLoading(true);
        try {
            const [membersList, ministriesList, churchSnap] = await Promise.all([
                memberService.listByChurch(churchId),
                ministryService.listByChurch(churchId),
                getDoc(doc(db, "churches", churchId))
            ]);

            setMembers(membersList);
            setMinistryOptions(ministriesList);

            if (churchSnap.exists() && churchSnap.data().planLimit) {
                setPlanLimit(churchSnap.data().planLimit);
            }

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const translateRole = (role: string | undefined) => {
        switch (role) {
            case 'admin': return 'Pastor Titular';
            case 'administrator': return 'Admin Tesouraria';
            case 'pastor': return 'Pastor Auxiliar';
            case 'deacon': return 'Diácono(a)';
            case 'leader': return 'Líder';
            case 'secretary': return 'Secretaria';
            case 'treasurer': return 'Tesouraria';
            case 'visitor': return 'Visitante / Convertido';
            default: return 'Membro';
        }
    };

    const translateStatus = (status: string | undefined) => {
        switch (status) {
            case 'active': return 'Ativo';
            case 'inactive': return 'Inativo';
            case 'disciplined': return 'Subdisciplina/Afastado';
            case 'transferred': return 'Transferido';
            case 'excluded': return 'Excluído';
            default: return 'Inativo';
        }
    };

    const isHighLeadershipRole = (role?: string) => {
        return role === 'admin' || role === 'administrator'|| role === 'treasurer';
    };

    const convertImageToBase64 = (url: string): Promise<string> => {
        return new Promise((resolve) => {
            if (!url || typeof url !== 'string') return resolve("");
            if (url.startsWith("data:image")) return resolve(url);

            const cached = getCachedImage(url);
            if (cached) return resolve(cached);

            const directUrl = getDirectImageUrl(url);
            if (!directUrl) return resolve("");

            const img = new Image();
            img.crossOrigin = "Anonymous";

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return resolve("");

                ctx.drawImage(img, 0, 0);

                try {
                    const dataUrl = canvas.toDataURL('image/png');
                    cacheImage(url, dataUrl);
                    resolve(dataUrl);
                } catch (e) {
                    console.warn(`CORS policy prevented converting image to Base64: ${url}`);
                    resolve("");
                }
            };
            img.onerror = () => resolve("");
            img.src = directUrl;
        });
    };

    const escapeHtml = (unsafe: string) => {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    const isValidUrl = (url: string) => {
        if (!url) return true;
        if (url.startsWith('data:image')) return true;
        try {
            const parsed = new URL(url);
            return ['http:', 'https:'].includes(parsed.protocol);
        } catch { return false; }
    };

    const validatePassword = (password: string): string[] => {
        const errors: string[] = [];
        if (password.length < 8) errors.push("Ter no mínimo 8 caracteres");
        if (!/[a-z]/.test(password)) errors.push("Conter uma letra minúscula (a-z)");
        if (!/[A-Z]/.test(password)) errors.push("Conter uma letra maiúscula (A-Z)");
        if (!/[0-9]/.test(password)) errors.push("Conter um número (0-9)");
        return errors;
    };

    const formatPhone = (value: string) => {
        if (!value) return value;
        // Permite formato livre para suportar internacionalização (Angola, Brasil, etc)
        // Apenas remove caracteres inválidos que não sejam números ou símbolos de telefone
        return value.replace(/[^\d+()\-\s]/g, '').slice(0, 20);
    };

    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const calculateAge = (birthDate: string) => {
        if (!birthDate) return null;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const handlePhoneChange = (country: string, value: string) => {
        const digits = value.replace(/\D/g, "");
        let formattedValue = "";
        
        if (country === "+55") {
            // Máscara Brasil: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
            let v = digits.slice(0, 11);
            if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
            if (v.length > 9) v = v.replace(/-/, "").replace(/(\d{4})$/, "-$1");
            formattedValue = v;
        } else if (country === "+244") {
            // Máscara Angola: XXX XXX XXX (sem parênteses)
            formattedValue = digits.slice(0, 9).replace(/(\d{3})(?=\d)/g, '$1 ');
        }
        
        setPhoneCountry(country);
        setLocalPhone(formattedValue);
        
        // Atualiza formData com o DDI
        const fullPhone = digits ? `${country} ${formattedValue}` : "";
        setFormData(prev => ({ ...prev, phone: fullPhone }));
    };

    const filteredMembers = members.filter(m => {
        const matchesSearch = m.fullName.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;

        if (filterCategory === 'all') return true;
        if (filterCategory === 'active') return m.status === 'active';
        if (filterCategory === 'inactive') return m.status === 'inactive';
        if (filterCategory === 'disciplined') return m.status === 'disciplined';
        if (filterCategory === 'transferred') return m.status === 'transferred';
        if (filterCategory === 'excluded') return m.status === 'excluded';
        if (filterCategory === 'men') return m.gender === 'male';
        if (filterCategory === 'women') return m.gender === 'female';

        if (['children', 'youth', 'adults'].includes(filterCategory)) {
            const age = calculateAge(m.birthDate || '');
            if (age === null) return false;
            if (filterCategory === 'children') return age <= 12;
            if (filterCategory === 'youth') return age >= 13 && age <= 17;
            if (filterCategory === 'adults') return age >= 18;
        }

        return true;
    }).sort((a, b) => a.fullName.localeCompare(b.fullName));

    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
    const currentMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const activeMembersCount = members.filter(m => {
        if (m.status !== 'active') return false;
        const age = calculateAge(m.birthDate || '');
        if (age !== null && age <= 12) return false;
        return true;
    }).length;

    const handleOpenView = (member: Member) => {
        setViewMember(member);
        setShowViewModal(true);
    };

    const handleOpenEdit = (member?: Member) => {
        setShowViewModal(false);

        if (!member && activeMembersCount >= planLimit) {
            alert(`LIMITE ATINGIDO!\n\nSua igreja atingiu o limite de ${planLimit} membros ativos (Adultos) no plano atual.\n\nAltere membros antigos para 'Inativo' ou fale com o Suporte (ReinoCloud) para fazer o Upgrade do seu plano.`);
            return;
        }

        if (userRole === 'secretary' && isHighLeadershipRole(member?.role)) {
            alert("Secretaria não pode editar o cadastro de cargos de liderança.");
            return;
        }

        if (member) {
            setEditingId(member.id || null);
            let addr: any = member.address || {};

            // Separa DDI do número para exibição correta
            const rawPhone = member.phone || "";
            let pCountry = "+55";
            let pLocal = "";
            if (rawPhone.includes("+244")) {
                pCountry = "+244";
                pLocal = rawPhone.replace("+244", "").trim();
            } else if (rawPhone.includes("+55")) {
                pCountry = "+55";
                pLocal = rawPhone.replace("+55", "").trim();
            } else {
                pLocal = rawPhone;
            }
            setPhoneCountry(pCountry);
            setLocalPhone(pLocal);

            setFormData({
                fullName: member.fullName, email: member.email || "", phone: member.phone || "",
                document: member.document || "", birthDate: member.birthDate || "", baptismDate: member.baptismDate || "",
                photoUrl: member.photoUrl || "",
                gender: (member.gender as string) || "male",
                maritalStatus: member.maritalStatus || "single",
                role: member.role || "member", status: member.status || "active",
                isTither: member.isTither || false,
                street: addr.street || "", number: addr.number || "", neighborhood: addr.neighborhood || "",
                city: addr.city || "", state: addr.state || "", zipCode: addr.zipCode || "",
                selectedMinistries: member.ministries || [],
                permissions: member.permissions || []
            });
        } else {
            setEditingId(null);
            setPhoneCountry("+55");
            setLocalPhone("");
            setFormData({
                fullName: "", email: "", phone: "", document: "", birthDate: "", baptismDate: "", photoUrl: "",
                gender: "male", maritalStatus: "single", role: "visitor", status: "active", isTither: false,
                street: "", number: "", neighborhood: "", city: "", state: "", zipCode: "",
                selectedMinistries: [],
                permissions: []
            });
        }
        setShowModal(true);
    };

    const toggleMinistry = (ministryId: string) => {
        if (formData.selectedMinistries.includes(ministryId)) {
            setFormData({ ...formData, selectedMinistries: formData.selectedMinistries.filter(id => id !== ministryId) });
        } else {
            setFormData({ ...formData, selectedMinistries: [...formData.selectedMinistries, ministryId] });
        }
    };

    const togglePermission = (permission: string) => {
        if (userRole !== 'admin') return;
        if (formData.permissions.includes(permission)) {
            setFormData({ ...formData, permissions: formData.permissions.filter(p => p !== permission) });
        } else {
            setFormData({ ...formData, permissions: [...formData.permissions, permission] });
        }
    };

    const handleFileInputChange = async (file?: File) => {
        if (!file) return;
        try {
            const validationError = validateImageFile(file);
            if (validationError) throw new Error(validationError);

            setPhotoUploading(true);
            const compressedBase64 = await compressImageFile(file);
            setPhotoPreview(compressedBase64);
            const uploadedUrl = await uploadToImgbb(compressedBase64);
            setFormData(fd => ({ ...fd, photoUrl: uploadedUrl }));
            cacheImage(uploadedUrl, compressedBase64);
        } catch (err: any) {
            console.error('Erro ao processar imagem:', err);
            alert((err?.message || 'Não foi possível enviar a imagem.'));
        } finally { setPhotoUploading(false); }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files && e.target.files[0];
        if (f) handleFileInputChange(f);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!churchId) return;

        const isNewActive = formData.status === 'active' && !editingId;
        let isReactivating = false;

        if (editingId && formData.status === 'active') {
            const existingMember = members.find(m => m.id === editingId);
            if (existingMember && existingMember.status !== 'active') {
                isReactivating = true;
            }
        }

        if ((isNewActive || isReactivating) && activeMembersCount >= planLimit) {
            alert(`LIMITE ATINGIDO!\n\nSua igreja atingiu o limite de ${planLimit} membros ativos adultos.\n\nPara ativar este cadastro, você precisa inativar outro membro ou fazer um Upgrade.`);
            return;
        }

        if (userRole !== 'admin' && isHighLeadershipRole(formData.role)) {
            alert("Apenas o Pastor (Admin) pode definir este cargo.");
            return;
        }

        if (editingId && userRole !== 'admin') {
            const existingMember = members.find(m => m.id === editingId);
            if (isHighLeadershipRole(existingMember?.role)) {
                alert("Ação não permitida: Você não pode editar cargos de liderança.");
                setLoading(false);
                return;
            }
        }

        if (formData.photoUrl && !isValidUrl(formData.photoUrl)) {
            alert("A URL da foto é inválida. Insira um link válido (http/https).");
            setLoading(false);
            return;
        }

        if (formData.email && formData.email.trim() !== "" && !isValidEmail(formData.email)) {
            alert("O formato do e-mail é inválido.");
            setLoading(false);
            return;
        }

        if (formData.birthDate && formData.baptismDate) {
            if (new Date(formData.baptismDate) <= new Date(formData.birthDate)) {
                alert("A data de batismo não pode ser anterior ou igual à data de nascimento.");
                setLoading(false);
                return;
            }
        }

        setLoading(true);
        try {
            let safePermissions = formData.permissions;
            let safeRole = formData.role;

            if (userRole !== 'admin') {
                if (editingId) {
                    const existing = members.find(m => m.id === editingId);
                    safePermissions = existing?.permissions || [];
                    safeRole = existing?.role || 'member';
                    if (isHighLeadershipRole(formData.role)) safeRole = existing?.role || 'member';
                    else safeRole = formData.role;
                } else {
                    safePermissions = [];
                    if (isHighLeadershipRole(formData.role)) safeRole = 'member';
                }
            }

            const payload: Member = {
                fullName: formData.fullName.trim(), churchId, email: formData.email.trim(), phone: formData.phone.trim(),
                document: formData.document.trim(), birthDate: formData.birthDate, baptismDate: formData.baptismDate,
                photoUrl: formData.photoUrl.trim(),
                gender: formData.gender, maritalStatus: formData.maritalStatus,
                role: safeRole, status: formData.status, isTither: formData.isTither,
                ministries: formData.selectedMinistries,
                permissions: safePermissions,
                address: {
                    street: formData.street.trim(), number: formData.number.trim(), neighborhood: formData.neighborhood.trim(),
                    city: formData.city.trim(), state: formData.state.trim(), zipCode: formData.zipCode.trim()
                }
            };
            if (editingId) await memberService.update(editingId, payload);
            else await memberService.create(payload);
            setShowModal(false);
            loadData();
        } catch (error: any) {
            console.error("Erro detalhado ao salvar:", error);
            if (error.message && error.message.toLowerCase().includes('permission')) {
                alert("🚫 Erro de Permissão ao Salvar\n\nO banco de dados negou sua solicitação. Isso acontece por um dos motivos:\n\n1. O seu cargo no cadastro não é 'admin' ou 'secretary' (verifique se não está como 'Secretaria' com letra maiúscula).\n2. Você está tentando editar um Pastor ou Admin, o que não é permitido para seu cargo.\n\nPeça para o Pastor Titular verificar seu cadastro.");
            } else {
                // Mostra a mensagem real de outros erros para facilitar a correção
                alert(`Erro ao salvar: ${error.message || "Erro desconhecido. Verifique o console (F12)."}`);
            }
        } finally { setLoading(false); }
    };

    const handleDelete = async (id: string) => {
        if (userRole !== 'admin') {
            alert("Apenas administradores podem excluir membros.");
            return;
        }
        if (confirm("Excluir membro permanentemente?")) { await memberService.delete(id); loadData(); }
    };

    const handleSelectMember = (id: string) => {
        if (selectedMembers.includes(id)) {
            setSelectedMembers(selectedMembers.filter(mId => mId !== id));
        } else {
            setSelectedMembers([...selectedMembers, id]);
        }
    };

    const handleSelectAllCurrentPage = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const newSelections = currentMembers.map(m => m.id!).filter(id => !selectedMembers.includes(id));
            setSelectedMembers([...selectedMembers, ...newSelections]);
        } else {
            const currentIds = currentMembers.map(m => m.id!);
            setSelectedMembers(selectedMembers.filter(id => !currentIds.includes(id)));
        }
    };

    const handleMassDelete = async () => {
        if (userRole !== 'admin') {
            alert("Apenas administradores podem excluir membros.");
            return;
        }
        if (selectedMembers.length === 0) return;

        if (confirm(`Tem certeza que deseja excluir ${selectedMembers.length} membro(s) permanentemente? Esta ação não pode ser desfeita.`)) {
            setIsDeletingMass(true);
            try {
                const chunkSize = 10;
                for (let i = 0; i < selectedMembers.length; i += chunkSize) {
                    const chunk = selectedMembers.slice(i, i + chunkSize);
                    await Promise.all(chunk.map(id => memberService.delete(id)));
                }
                setSelectedMembers([]);
                loadData();
            } catch (error) {
                alert("Erro ao excluir alguns membros.");
            } finally {
                setIsDeletingMass(false);
            }
        }
    };

    const openAccessModal = (member: Member) => {
        if (!member.email && !member.phone) { alert("Este membro precisa de um e-mail ou telefone cadastrado."); return; }
        if (userRole === 'secretary' && isHighLeadershipRole(member.role)) {
            alert("Secretaria não pode alterar o acesso de cargos de Alta Liderança (Pastor/Admin).");
            return;
        }
        setSelectedMemberForAccess(member);
        setNewPassword("");
        setShowAccessModal(true);
    };

    const handleCreateAccess = async (e: React.FormEvent) => {
        e.preventDefault();
        if (userRole !== 'admin' && userRole !== 'secretary') {
            alert("Apenas administradores e secretaria podem criar acessos.");
            return;
        }

        // Trava de segurança adicional
        if (userRole === 'secretary' && isHighLeadershipRole(selectedMemberForAccess?.role)) {
            alert("Ação Bloqueada: Secretaria não tem permissão para alterar senha deste cargo.");
            return;
        }

        const passwordErrors = validatePassword(newPassword);
        if (passwordErrors.length > 0) {
            alert(`A senha não é forte o suficiente. Ela precisa:\n\n- ${passwordErrors.join('\n- ')}`);
            return;
        }

        const loginIdentifier = selectedMemberForAccess?.email || selectedMemberForAccess?.phone;
        if (!loginIdentifier) return;
        setCreatingAccess(true);
        try {
            // Se for telefone (não tem @), cria um email fictício para o Firebase
            let firebaseLogin = loginIdentifier;
            if (!loginIdentifier.includes('@')) {
                const cleanPhone = loginIdentifier.replace(/[^\d+]/g, '');
                firebaseLogin = `${cleanPhone}@login.com`;
            }

            await createSystemUser(firebaseLogin, newPassword);
            alert(`✅ Acesso criado com sucesso!\n\nUsuário: ${loginIdentifier}\nSenha: ${newPassword}\n\nInforme a senha ao membro.`);
            setShowAccessModal(false);
        } catch (error: any) {
            console.error("Erro ao criar acesso:", error);
            const errCode = (error && error.code) || "";
            const errMsg = (error && error.message ? String(error.message) : "").toLowerCase();

            if (errCode === 'auth/email-already-in-use') {
                alert("Este e-mail ou telefone já possui um acesso cadastrado no sistema.");
            } else if (errCode === 'permission-denied' || errMsg.includes('permission')) {
                alert("🚫 Acesso Negado pelo Banco de Dados.\n\nOcorreu uma falha de permissão durante a gravação. Isso geralmente acontece porque a criação do usuário interferiu na sua sessão atual.\n\nVerifique se o usuário foi criado apesar do erro.");
            } else {
                alert(`Não foi possível criar o acesso.\nErro: ${errMsg}`);
            }
        } finally {
            setCreatingAccess(false);
        }
    };

    // --- LÓGICA DE IMPORTAÇÃO DE PLANILHA (AGORA COM DATA DE NASCIMENTO E LIMPANDO ASPAS) ---
    const downloadTemplate = () => {
        // Definindo o cabeçalho padrão com Data de Nascimento adicionada
        const headers = "Nome Completo;Email;Telefone;Sexo (M/F);Estado Civil (solteiro/casado/divorciado/viuvo);Cargo (membro/visitante/diacono);Dizimista (S/N);Data de Nascimento (DD/MM/AAAA)\n";
        // Linha de exemplo
        const sample = "Joao da Silva;joao@email.com;11999999999;M;casado;membro;S;15/08/1990\n";

        // Suporte a acentos (UTF-8 BOM)
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, headers + sample], { type: 'text/csv;charset=utf-8;' });

        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "ReinoCloud_Modelo_Membros.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            if (!text) return;

            setImporting(true);
            try {
                // Descobre se o Excel salvou com vírgula ou ponto-e-vírgula
                const separator = text.indexOf(';') > -1 ? ';' : ',';

                // Separa as linhas (ignorando linhas vazias no final)
                const rows = text.split('\n').filter(row => row.trim() !== '');

                if (rows.length <= 1) {
                    alert("A planilha parece estar vazia ou conter apenas o cabeçalho.");
                    setImporting(false);
                    return;
                }

                // Remove o cabeçalho para processar só os dados
                const dataRows = rows.slice(1);

                // Validação do Limite de Plano
                if (activeMembersCount + dataRows.length > planLimit) {
                    alert(`LIMITE DE PLANO ATINGIDO!\n\nVocê tem ${activeMembersCount} membros e está tentando importar ${dataRows.length} novos.\nO limite do seu plano é ${planLimit}.\n\nFaça o upgrade do seu plano para importar toda a lista.`);
                    setImporting(false);
                    return;
                }

                setImportProgress({ current: 0, total: dataRows.length });

                // Processa linha por linha
                let successCount = 0;
                for (let i = 0; i < dataRows.length; i++) {
                    // --- AQUI É ONDE LIMPAMOS AS ASPAS ---
                    const columns = dataRows[i].split(separator).map(col => {
                        let cleaned = col.trim();
                        // Remove aspas do começo e do fim se o Excel colocou
                        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                            cleaned = cleaned.slice(1, -1).trim();
                        }
                        return cleaned;
                    });

                    // Ignora linhas incompletas
                    if (columns.length < 1 || !columns[0]) continue;

                    const nome = columns[0] || "";
                    const email = columns[1] || "";
                    const telefone = columns[2] || "";

                    // Tratamento Sexo
                    const rawSexo = (columns[3] || "").toUpperCase();
                    const sexo = rawSexo.startsWith('F') ? 'female' : 'male';

                    // Tratamento Estado Civil
                    const rawCivil = (columns[4] || "").toLowerCase();
                    let civil = 'single';
                    if (rawCivil.includes('casad')) civil = 'married';
                    else if (rawCivil.includes('divorciad')) civil = 'divorced';
                    else if (rawCivil.includes('viuv') || rawCivil.includes('viúv')) civil = 'widowed';

                    // Tratamento Cargo
                    const rawCargo = (columns[5] || "").toLowerCase();
                    let cargo = 'member';
                    if (rawCargo.includes('visit') || rawCargo.includes('novo')) cargo = 'visitor';
                    else if (rawCargo.includes('diacon') || rawCargo.includes('diácon')) cargo = 'deacon';
                    else if (rawCargo.includes('lider') || rawCargo.includes('líder')) cargo = 'leader';

                    // Tratamento Dizimista
                    const rawDizimista = (columns[6] || "").toUpperCase();
                    const isDizimista = rawDizimista.startsWith('S') || rawDizimista === 'SIM';

                    // Tratamento Data de Nascimento (Formato DD/MM/AAAA para YYYY-MM-DD)
                    let formatedBirthDate = "";
                    const rawBirthDate = columns[7] ? columns[7].trim() : "";
                    if (rawBirthDate) {
                        const parts = rawBirthDate.includes('/') ? rawBirthDate.split('/') : rawBirthDate.split('-');
                        if (parts.length === 3) {
                            if (parts[2].length === 4) { // Se for DD/MM/YYYY
                                formatedBirthDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                            } else if (parts[0].length === 4) { // Se o Excel já salvou como YYYY/MM/DD
                                formatedBirthDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                            }
                        }
                    }

                    const payload: Member = {
                        churchId: churchId!,
                        fullName: nome,
                        email: email,
                        phone: telefone,
                        gender: sexo,
                        maritalStatus: civil,
                        role: cargo,
                        status: 'active',
                        isTither: isDizimista,
                        birthDate: formatedBirthDate, 
                        ministries: [],
                        permissions: [],
                        address: { street: "", number: "", neighborhood: "", city: "", state: "", zipCode: "" }
                    };

                    await memberService.create(payload);
                    successCount++;
                    setImportProgress({ current: successCount, total: dataRows.length });
                }

                alert(`✅ Importação Concluída!\n\ ${successCount} membros foram adicionados à sua igreja.`);
                setShowImportModal(false);
                loadData(); // Recarrega a lista
            } catch (error) {
                console.error("Erro na importação:", error);
                alert("Ocorreu um erro ao ler o arquivo. Certifique-se de que ele é um arquivo CSV válido salvo pelo Excel.");
            } finally {
                setImporting(false);
                setImportProgress({ current: 0, total: 0 });
                // Limpa o input de arquivo
                if (e.target) e.target.value = '';
            }
        };

        reader.readAsText(file, 'ISO-8859-1');
    };

    const handlePrintExecute = async () => {
        setPrinting(true);
        const printWindow = window.open('', '_blank', 'width=900,height=600');
        if (!printWindow) { setPrinting(false); return alert("Por favor, permita os pop-ups do navegador para imprimir."); }

        try {
            printWindow.document.open();
            printWindow.document.write('<html><body style="font-family: sans-serif; padding: 40px; text-align: center; color: #333;"><h2>Gerando relatório...</h2><p>Por favor, aguarde alguns segundos.</p></body></html>');
            printWindow.document.close();

            const today = new Date().toLocaleDateString('pt-BR');
            const base64Logo = logoUrl ? await convertImageToBase64(logoUrl) : "";
            const safeLogoUrl = (base64Logo && (base64Logo.startsWith('data:image') || base64Logo.startsWith('http'))) ? base64Logo : '';
            const logoHtml = safeLogoUrl ? `<img src="${safeLogoUrl}" style="height: 60px; margin-bottom: 10px;" />` : '';

            const sortedMembers = [...filteredMembers].sort((a, b) => a.fullName.localeCompare(b.fullName));

            const rows = sortedMembers.map((m, index) => `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px;">${index + 1}</td>
                <td style="padding: 8px;"><strong>${escapeHtml(m.fullName)}</strong></td>
                <td style="padding: 8px;">${escapeHtml(translateRole(m.role))}</td>
                <td style="padding: 8px;">${escapeHtml(m.phone || '-')}</td>
                <td style="padding: 8px;">${escapeHtml(translateStatus(m.status))}</td>
            </tr>
        `).join('');

            const categoryTitles: Record<string, string> = {
                all: 'Todos os Membros',
                active: 'Membros Ativos',
                disciplined: 'Membros em Subdisciplina/Afastados',
                transferred: 'Membros Transferidos',
                excluded: 'Membros Excluídos',
                inactive: 'Membros Inativos',
                men: 'Homens',
                women: 'Mulheres',
                children: 'Crianças (0 a 12 anos)',
                youth: 'Jovens (13 a 17 anos)',
                adults: 'Adultos (18+ anos)'
            };
            const printTitle = categoryTitles[filterCategory] || 'Relatório de Membros';

            const html = `
            <html><head><title>Lista de Membros</title><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: sans-serif; padding: 20px; text-align: center; } table { width: 100%; border-collapse: collapse; margin-top: 20px; text-align: left; } th { background: #f9fafb; padding: 8px; border-bottom: 2px solid #eee; } .close-btn { position: fixed; top: 15px; left: 15px; z-index: 9999; background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 50px; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.3); cursor: pointer; text-decoration: none; font-size: 14px; } @media print { .close-btn { display: none; } }</style></head><body><button onclick="window.close()" class="close-btn">← FECHAR</button>${logoHtml}<h1>${escapeHtml(churchName || '')}</h1><p>${escapeHtml(printTitle)} • ${escapeHtml(today)}</p><table><thead><tr><th>#</th><th>Nome</th><th>Cargo</th><th>Telefone</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload = function() { setTimeout(() => window.print(), 500); }</script></body></html>
        `;

            printWindow.document.open();
            printWindow.document.write(html);
            printWindow.document.close();
        } catch (error) {
            console.error("Erro na impressão:", error);
            printWindow.document.open();
            printWindow.document.write('<html><body><h3 style="color:red; text-align:center;">Erro ao gerar relatório. Tente novamente.</h3></body></html>');
            printWindow.document.close();
        } finally {
            setPrinting(false);
        }
    };

    const handlePrintCard = async (member: Member) => {
        setPrinting(true);
        const printWindow = window.open('', '_blank', 'width=900,height=600');
        if (!printWindow) { setPrinting(false); return alert("Por favor, permita os pop-ups do navegador para imprimir a carteirinha."); }

        try {
            printWindow.document.open();
            printWindow.document.write('<html><body style="font-family: sans-serif; padding: 40px; text-align: center; color: #333;"><h2>Preparando Carteirinha...</h2><p>Processando imagens de alta qualidade.</p></body></html>');
            printWindow.document.close();

            const safeFormatDate = (dateStr?: string) => {
                if (!dateStr) return '---';
                const date = new Date(dateStr + 'T00:00:00');
                if (isNaN(date.getTime())) return '---';
                return date.toLocaleDateString('pt-BR');
            };

            const safeGetFullYear = (dateStr?: string) => {
                if (!dateStr) return new Date().getFullYear();
                const date = new Date(dateStr + 'T00:00:00');
                if (isNaN(date.getTime())) return new Date().getFullYear();
                return date.getFullYear();
            };

            const base64Logo = logoUrl ? await convertImageToBase64(logoUrl) : "";
            const base64Photo = member.photoUrl ? await convertImageToBase64(member.photoUrl) : "";
            const base64Signature = signatureUrl ? await convertImageToBase64(signatureUrl) : "";
            const baptismText = safeFormatDate(member.baptismDate);

            // Validação para garantir que as imagens são válidas antes de injetar no HTML
            const safeLogo = (base64Logo && base64Logo.startsWith('data:image')) ? base64Logo : '';
            const safePhoto = (base64Photo && base64Photo.startsWith('data:image')) ? base64Photo : '';
            const safeSignature = (base64Signature && (base64Signature.startsWith('data:image') || base64Signature.startsWith('http'))) ? base64Signature : '';

            const signatureHtml = safeSignature
                ? `<img src="${safeSignature}" style="height: 35px; margin-bottom: -2px; display: block; margin-left: auto; margin-right: auto;" />`
                : `<div style="height:30px;"></div>`;

            const html = `
          <html><head><title>Carteirinha - ${escapeHtml(member.fullName)}</title><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&display=swap'); body { font-family: 'Montserrat', sans-serif; background: #eef2f5; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; } .card-wrapper { display: flex; gap: 30px; flex-wrap: wrap; justify-content: center; } .card { width: 324px; height: 204px; background: #fff; border-radius: 12px; position: relative; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #ddd; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .card.front { background: linear-gradient(120deg, #1e3a8a 0%, #172554 100%); color: white; display: flex; flex-direction: column; } .front-header { display: flex; align-items: center; gap: 10px; padding: 15px 15px 5px 15px; border-bottom: 1px solid rgba(255,255,255,0.1); } .front-logo { width: 35px; height: 35px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); } .church-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2; text-shadow: 0 2px 4px rgba(0,0,0,0.5); } .front-body { flex: 1; display: flex; align-items: center; padding: 0 15px; gap: 15px; } .photo-frame { width: 75px; height: 75px; border-radius: 12px; background: #fff; border: 3px solid rgba(255,255,255,0.3); overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 8px rgba(0,0,0,0.3); } .photo-frame img { width: 100%; height: 100%; object-fit: cover; } .member-info { display: flex; flex-direction: column; justify-content: center; } .label { font-size: 7px; text-transform: uppercase; opacity: 0.7; letter-spacing: 1px; margin-bottom: 2px; } .name { font-size: 14px; font-weight: 800; text-transform: uppercase; line-height: 1.2; margin-bottom: 6px; } .role-badge { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 20px; font-size: 8px; font-weight: 700; text-transform: uppercase; width: fit-content; } .front-footer { background: rgba(0,0,0,0.2); padding: 6px 15px; text-align: right; font-size: 7px; letter-spacing: 2px; text-transform: uppercase; opacity: 0.8; } .card.back { background: #fff; color: #333; display: flex; flex-direction: column; background-image: radial-gradient(#e5e7eb 1px, transparent 1px); background-size: 10px 10px; } .back-body { padding: 20px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; } .data-row { display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding-bottom: 4px; margin-bottom: 8px; } .data-col { display: flex; flex-direction: column; } .data-label { font-size: 6px; font-weight: 700; text-transform: uppercase; color: #888; } .data-value { font-size: 9px; font-weight: 600; color: #000; } .signature-box { text-align: center; margin-top: 10px; } .line { height: 1px; background: #000; width: 100%; margin: 2px auto; } .sig-label { font-size: 7px; font-weight: 700; text-transform: uppercase; } .close-btn { position: fixed; top: 15px; left: 15px; z-index: 9999; background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 50px; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.3); cursor: pointer; text-decoration: none; font-size: 14px; } @media print { body { background: white; height: auto; display: block; } .card-wrapper { margin-bottom: 20px; page-break-inside: avoid; } .card { border: 1px solid #ccc; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .close-btn { display: none !important; } }</style></head><body><button onclick="window.close()" class="close-btn">← FECHAR</button><div class="card-wrapper"><div class="card front"><div class="front-header">${safeLogo ? `<img src="${safeLogo}" class="front-logo" />` : ''}<div class="church-title">${escapeHtml(churchName || '')}</div></div><div class="front-body"><div class="photo-frame">${safePhoto ? `<img src="${safePhoto}" />` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:30px;">👤</div>`}</div><div class="member-info"><span class="label">Membro</span><span class="name">${escapeHtml(member.fullName)}</span><span class="role-badge">Batismo: ${escapeHtml(baptismText)}</span></div></div><div class="front-footer">Cartão de Membro</div></div><div class="card back"><div class="back-body"><div><div class="data-row"><div class="data-col"><span class="data-label">Data de Nascimento</span><span class="data-value">${safeFormatDate(member.birthDate)}</span></div><div class="data-col" style="text-align:right"><span class="data-label">Desde</span><span class="data-value">${safeGetFullYear(member.baptismDate)}</span></div></div><div class="data-row" style="border:none"><div class="data-col"><span class="data-label">Validade</span><span class="data-value">INDETERMINADA</span></div></div></div><div class="signature-box">${signatureHtml}<div class="line"></div><div class="sig-label">Pastor Presidente</div></div><div style="display:flex; align-items:flex-end; justify-content:space-between; margin-top:10px;"><span style="font-size:6px; color:#999; width: 60%;">Este cartão é pessoal e intransferível.</span><img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`reino_member_id:${member.id}`)}" style="width:35px; height:35px; opacity:0.8;" /></div></div></div></div><script>window.onload = function(){ setTimeout(function(){ window.print(); }, 800); }</script></body></html>
        `;

            printWindow.document.open();
            printWindow.document.write(html);
            printWindow.document.close();
        } catch (error) {
            console.error("Erro na impressão:", error);
            printWindow.document.open();
            printWindow.document.write('<html><body><h3 style="color:red; text-align:center;">Erro ao gerar carteirinha. Tente novamente.</h3></body></html>');
            printWindow.document.close();
        } finally {
            setPrinting(false);
        }
    };

    if (loading && members.length === 0) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            <div className="bg-blue-800 pt-10 pb-32 px-4 md:px-8 shadow-sm">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <Users className="text-blue-300" size={32} /> Membros
                        </h1>
                        <p className="text-blue-200 mt-2 text-lg opacity-90">
                            Gerencie o cadastro e a vida eclesiástica.
                        </p>
                    </div>
                    <div className="bg-blue-700/50 p-3 rounded-lg border border-blue-600 backdrop-blur-sm">
                        <p className="text-sm text-blue-100 font-medium">Lotação (Exclui Crianças)</p>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-2xl font-bold ${activeMembersCount >= planLimit ? 'text-red-400' : 'text-white'}`}>
                                {activeMembersCount}
                            </span>
                            <span className="text-blue-200">/ {planLimit} ativos</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 md:px-0 -mt-20 relative z-10 space-y-6">
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row gap-4 justify-between items-center bg-white">
                        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto flex-1">
                            <div className="relative w-full md:w-80 xl:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Buscar membro..."
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-slate-50 focus:bg-white"
                                    value={searchTerm}
                                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                />
                            </div>
                            <div className="relative w-full md:w-64">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select
                                    value={filterCategory}
                                    onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-slate-50 focus:bg-white appearance-none cursor-pointer text-slate-700 font-medium"
                                >
                                    <option value="all">Todos os Membros</option>
                                    <option value="active">🟢 Ativos</option>
                                    <option value="inactive">🔴 Inativos</option>
                                    <option value="disciplined">🟡 Subdisciplina/Afastado</option>
                                    <option value="transferred">✈️ Transferidos</option>
                                    <option value="excluded">✖️ Excluídos</option>
                                    <option value="men">🧔 Homens</option>
                                    <option value="women">👩 Mulheres</option>
                                    <option value="children">👧 Crianças (0-12 anos)</option>
                                    <option value="youth">🧒 Jovens (13-17 anos)</option>
                                    <option value="adults">🧑 Adultos (18+ anos)</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                                    <ChevronDown size={18} />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full lg:w-auto flex-wrap lg:flex-nowrap">
                            {userRole === 'admin' && selectedMembers.length > 0 && (
                                <button onClick={handleMassDelete} disabled={isDeletingMass} className="flex-1 md:flex-none px-4 py-3 rounded-xl bg-red-50 text-red-600 font-bold border border-red-200 hover:bg-red-100 transition flex items-center justify-center gap-2">
                                    {isDeletingMass ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                                    <span className="hidden md:inline">Apagar ({selectedMembers.length})</span>
                                </button>
                            )}
                            <button onClick={handlePrintExecute} disabled={printing} className="flex-1 md:flex-none px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2" title="Imprimir Lista">
                                {printing ? <Loader2 className="animate-spin" size={20} /> : <Printer size={20} />}
                            </button>
                            {(userRole === 'admin' || userRole === 'secretary') && (
                                <>
                                    {/* BOTÃO DE IMPORTAÇÃO DE PLANILHA */}
                                    <button onClick={() => setShowImportModal(true)} className="flex-1 md:flex-none px-4 py-3 rounded-xl bg-emerald-50 text-emerald-600 font-bold border border-emerald-200 hover:bg-emerald-100 transition flex items-center justify-center gap-2">
                                        <Upload size={20} /> <span className="hidden md:inline">Importar</span>
                                    </button>
                                    <button onClick={() => handleOpenEdit()} className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center justify-center gap-2">
                                        <PlusCircle size={20} /> Novo
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-600">
                            Total: <strong className="text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full ml-1">{filteredMembers.length}</strong> {filteredMembers.length === 1 ? 'resultado' : 'resultados'}
                        </p>
                        {(userRole === 'admin' || userRole === 'secretary') && (
                            <div className="flex gap-3 items-center">
                                {selectedMembers.length > 0 && (
                                    <button onClick={() => setSelectedMembers([])} className="text-sm text-slate-500 hover:text-slate-700 font-semibold transition">
                                        Limpar Seleção
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        if (selectedMembers.length === filteredMembers.length) {
                                            setSelectedMembers([]);
                                        } else {
                                            setSelectedMembers(filteredMembers.map(m => m.id!));
                                        }
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-semibold transition bg-blue-50/50 px-3 py-1 rounded-lg border border-blue-100"
                                >
                                    {selectedMembers.length === filteredMembers.length && filteredMembers.length > 0
                                        ? "Desmarcar Todos"
                                        : `Selecionar todos os ${filteredMembers.length}`}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="hidden md:block bg-white overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        {(userRole === 'admin' || userRole === 'secretary') && (
                                            <th className="p-4 w-12 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                    checked={currentMembers.length > 0 && currentMembers.every(m => selectedMembers.includes(m.id!))}
                                                    onChange={handleSelectAllCurrentPage}
                                                />
                                            </th>
                                        )}
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nome</th><th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contato</th><th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {currentMembers.map(member => (
                                        <tr key={member.id} onClick={() => handleOpenView(member)} className={`hover:bg-blue-50/50 transition group cursor-pointer ${selectedMembers.includes(member.id!) ? 'bg-blue-50/30' : ''}`}>
                                            {(userRole === 'admin' || userRole === 'secretary') && (
                                                <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                        checked={selectedMembers.includes(member.id!)}
                                                        onChange={() => handleSelectMember(member.id!)}
                                                    />
                                                </td>
                                            )}
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border border-gray-300">
                                                        {member.photoUrl ? (<img src={getCachedImage(member.photoUrl) || getDirectImageUrl(member.photoUrl)} alt={member.fullName} referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=e5e7eb&color=9ca3af`; }} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-gray-400"><Users size={20} /></div>)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-800 flex items-center gap-2">
                                                            {member.fullName}
                                                            {member.permissions && member.permissions.includes('secretary') && <span title="Acesso Secretaria"><Shield size={14} className="text-blue-500 fill-blue-100" /></span>}
                                                            {member.permissions && member.permissions.includes('financial') && <span title="Acesso Tesouraria"><Shield size={14} className="text-green-500 fill-green-100" /></span>}
                                                        </span>
                                                        <div className="flex items-center gap-2 flex-wrap mt-1">
                                                            <span className={`text-[10px] px-2 rounded uppercase font-bold ${
                                                                member.role === 'admin' || member.role === 'administrator'
                                                                    ? 'bg-purple-100 text-purple-700'
                                                                    : member.role === 'visitor'
                                                                        ? 'bg-orange-100 text-orange-700'
                                                                        : 'bg-gray-100 text-gray-500'
                                                                }`}>
                                                                {translateRole(member.role)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4"><div className="flex flex-col gap-1">{member.phone && <span className="flex items-center gap-1 text-xs text-slate-500"><Phone size={12} /> {member.phone}</span>}{member.email && <span className="flex items-center gap-1 text-xs text-slate-500"><Mail size={12} /> {member.email}</span>}</div></td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {(member.email || member.phone) && (userRole === 'admin' || userRole === 'secretary') && (
                                                        <button onClick={(e) => { e.stopPropagation(); openAccessModal(member); }} className="p-2 bg-yellow-50 rounded-lg text-yellow-600 hover:bg-yellow-100 transition" title="Criar Acesso"><Key size={16} /></button>
                                                    )}
                                                    {(userRole === 'admin' || userRole === 'secretary') && (
                                                        <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(member); }} className="p-2 bg-slate-100 rounded-lg text-blue-600 hover:bg-blue-100 transition" title="Editar"><Edit size={16} /></button>
                                                    )}
                                                    {userRole === 'admin' && (
                                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(member.id!); }} className="p-2 bg-red-50 rounded-lg text-red-600 hover:bg-red-100 transition" title="Excluir"><Trash2 size={16} /></button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="md:hidden space-y-3 p-4 bg-slate-100">
                        {(userRole === 'admin' || userRole === 'secretary') && currentMembers.length > 0 && (
                            <div className="flex items-center justify-between mb-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        checked={currentMembers.every(m => selectedMembers.includes(m.id!))}
                                        onChange={handleSelectAllCurrentPage}
                                    />
                                    Selecionar página atual
                                </label>
                            </div>
                        )}
                        {currentMembers.map(member => (
                            <div key={member.id} onClick={() => handleOpenView(member)} className={`bg-white p-4 rounded-xl shadow-sm border ${selectedMembers.includes(member.id!) ? 'border-blue-300 ring-1 ring-blue-300' : 'border-slate-100'} flex flex-col gap-3 active:scale-[0.98] transition relative`}>
                                {(userRole === 'admin' || userRole === 'secretary') && (
                                    <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shadow-sm"
                                            checked={selectedMembers.includes(member.id!)}
                                            onChange={() => handleSelectMember(member.id!)}
                                        />
                                    </div>
                                )}
                                <div className="flex items-center gap-3 pr-8">
                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border border-gray-300">
                                        {member.photoUrl ? (<img src={getCachedImage(member.photoUrl) || getDirectImageUrl(member.photoUrl)} alt={member.fullName} referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=e5e7eb&color=9ca3af`; }} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-gray-400"><Users size={24} /></div>)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-slate-800 text-sm truncate flex items-center gap-1">
                                            {member.fullName}
                                            {member.permissions && member.permissions.includes('secretary') && <Shield size={12} className="text-blue-500 fill-blue-100" />}
                                            {member.permissions && member.permissions.includes('financial') && <Shield size={12} className="text-green-500 fill-green-100" />}
                                        </h3>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold ${member.role === 'admin' || member.role === 'administrator'
                                                ? 'bg-purple-100 text-purple-700'
                                                : member.role === 'visitor'
                                                    ? 'bg-orange-100 text-orange-700'
                                                    : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {translateRole(member.role)}
                                            </span>
                                            <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold ${member.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : member.status === 'disciplined' 
                                                    ? 'bg-yellow-100 text-yellow-700' 
                                                    : member.status === 'inactive' 
                                                        ? 'bg-red-100 text-red-700' 
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {translateStatus(member.status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-slate-100">
                                    {(userRole === 'admin' || userRole === 'secretary') && (member.email || member.phone) && (
                                        <button onClick={(e) => { e.stopPropagation(); openAccessModal(member); }} className="flex items-center justify-center gap-1 py-2 rounded-lg bg-yellow-50 text-yellow-600 font-bold text-xs">
                                            <Key size={14} /> Acesso
                                        </button>
                                    )}
                                    {(userRole === 'admin' || userRole === 'secretary') && (
                                        <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(member); }} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs">
                                            <Edit size={14} /> Editar
                                        </button>
                                    )}
                                    {userRole === 'admin' && (
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(member.id!); }} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-red-50 text-red-600 font-bold text-xs">
                                            <Trash2 size={14} /> Excluir
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="p-6 flex justify-center gap-4 items-center">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 bg-white shadow-sm border border-slate-200"><ChevronLeft size={20} /></button>
                            <span className="text-sm font-semibold text-slate-600">Página {currentPage} de {totalPages}</span>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 bg-white shadow-sm border border-slate-200"><ChevronRight size={20} /></button>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODAL DE IMPORTAÇÃO DE PLANILHA CSV --- */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95">
                        <button onClick={() => !importing && setShowImportModal(false)} disabled={importing} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition disabled:opacity-50">
                            <X size={18} />
                        </button>

                        <div className="flex flex-col items-center mb-6 mt-2">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                <Upload size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">Importar Membros</h2>
                            <p className="text-sm text-gray-500 text-center mt-2">Adicione vários membros de uma vez através de uma planilha do Excel (CSV).</p>
                        </div>

                        {!importing ? (
                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                                    <h3 className="text-xs font-bold text-blue-800 uppercase mb-2">Passo 1: Baixe o Modelo</h3>
                                    <p className="text-xs text-blue-600 mb-3">Sua planilha precisa ter colunas específicas para o sistema ler corretamente.</p>
                                    <button onClick={downloadTemplate} className="w-full py-2.5 bg-white text-blue-700 border border-blue-200 font-bold rounded-lg hover:bg-blue-100 transition flex justify-center items-center gap-2 text-sm shadow-sm">
                                        <Download size={16} /> Baixar Planilha Modelo
                                    </button>
                                </div>

                                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                                    <h3 className="text-xs font-bold text-slate-700 uppercase mb-2">Passo 2: Suba o arquivo CSV</h3>
                                    <p className="text-[10px] text-slate-500 mb-3">Preencha os dados no Excel, vá em "Salvar Como" e escolha o formato "CSV (separado por vírgulas)".</p>

                                    <label htmlFor="csv-upload" className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition flex justify-center items-center gap-2 text-sm shadow-md cursor-pointer">
                                        <Upload size={16} /> Escolher Arquivo CSV
                                    </label>
                                    <input id="csv-upload" type="file" accept=".csv, text/csv" className="hidden" onChange={handleFileUpload} />
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 flex flex-col items-center text-center">
                                <Loader2 size={48} className="text-emerald-500 animate-spin mb-4" />
                                <h3 className="text-lg font-bold text-gray-800">Importando Membros...</h3>
                                <p className="text-gray-500 mt-2 text-sm">Por favor, não feche esta janela.</p>
                                <div className="w-full bg-gray-100 rounded-full h-3 mt-6 overflow-hidden">
                                    <div className="bg-emerald-500 h-3 transition-all duration-300" style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}></div>
                                </div>
                                <p className="text-xs font-bold text-emerald-600 mt-2">{importProgress.current} de {importProgress.total} processados</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showViewModal && viewMember && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 relative">
                        <button onClick={() => setShowViewModal(false)} className="absolute top-4 right-4 z-[60] bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition"><X size={18} /></button>

                        <div className="bg-gradient-to-br from-blue-700 to-blue-900 p-8 flex flex-col items-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                            <div className="w-24 h-24 bg-white rounded-full mb-4 flex items-center justify-center border-4 border-blue-600 shadow-lg relative z-10 overflow-hidden shrink-0">
                                {viewMember.photoUrl ? <img src={getCachedImage(viewMember.photoUrl) || getDirectImageUrl(viewMember.photoUrl)} alt={viewMember.fullName} referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(viewMember.fullName)}&background=e5e7eb&color=9ca3af`; }} className="w-full h-full object-cover" /> : <User className="text-blue-300" size={48} />}
                            </div>

                            <h3 className="text-xl font-semibold text-white relative z-10 text-center leading-tight">{viewMember.fullName}</h3>
                            <p className="text-blue-200 text-sm uppercase font-bold tracking-wider relative z-10 text-center mt-1">{translateRole(viewMember.role)}</p>

                            <button onClick={() => handlePrintCard(viewMember)} disabled={printing} className="mt-6 relative z-20 bg-white/20 hover:bg-white/30 text-white py-2.5 px-5 rounded-xl backdrop-blur-md transition flex items-center gap-2 text-sm font-bold border border-white/30 shadow-lg" title="Imprimir Carteirinha">
                                {printing ? <Loader2 className="animate-spin" size={16} /> : <CreditCard size={18} />}
                                {printing ? 'Gerando...' : 'Carteirinha'}
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 text-center">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status</span>
                                    <p className={`font-semibold ${viewMember.status === 'active'
                                        ? 'text-green-600'
                                        : viewMember.status === 'disciplined'
                                            ? 'text-yellow-600'
                                            : viewMember.status === 'inactive'
                                                ? 'text-red-500'
                                                : 'text-slate-600'
                                        }`}>{translateStatus(viewMember.status)}</p>
                                </div>
                                <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 text-center">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Estado Civil</span>
                                    <p className="font-semibold text-slate-700 capitalize">{viewMember.maritalStatus === 'single' ? 'Solteiro(a)' : viewMember.maritalStatus === 'married' ? 'Casado(a)' : viewMember.maritalStatus === 'divorced' ? 'Divorciado(a)' : 'Viúvo(a)'}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 hover:bg-slate-100 rounded-lg transition">
                                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0"><Phone size={18} /></div>
                                    <div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Telefone</p><p className="font-medium text-slate-800">{viewMember.phone || "—"}</p></div>
                                </div>
                                <div className="flex items-center gap-3 p-3 hover:bg-slate-100 rounded-lg transition">
                                    <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center shrink-0"><Mail size={18} /></div>
                                    <div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">E-mail</p><p className="font-medium text-slate-800 text-sm truncate max-w-[200px]">{viewMember.email || "—"}</p></div>
                                </div>
                                <div className="flex items-center gap-3 p-3 hover:bg-slate-100 rounded-lg transition">
                                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center shrink-0"><MapPin size={18} /></div>
                                    <div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Endereço</p><p className="font-medium text-slate-800 text-sm">{viewMember.address?.street || "—"}</p></div>
                                </div>
                            </div>

                            <button onClick={() => handleOpenEdit(viewMember)} className="w-full py-3 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition shadow-lg flex justify-center items-center gap-2">
                                <Edit size={18} /> Editar Cadastro Completo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 custom-scrollbar">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-semibold text-slate-800">{editingId ? 'Editar Membro' : 'Novo Cadastro'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-red-500 font-bold">FECHAR</button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-6">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-2"><Users size={14} /> Dados Pessoais</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Foto do Membro</label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                                            <div className="col-span-2">
                                                <div className="flex items-center gap-2">
                                                    <input onChange={handleFileChange} accept="image/*" type="file" id="member-photo" className="hidden" />
                                                    <label htmlFor="member-photo" className="px-3 py-2 bg-white border rounded-lg cursor-pointer text-sm hover:bg-gray-50">Escolher Arquivo</label>
                                                    <span className="text-xs text-gray-500">ou cole um link abaixo</span>
                                                    {photoUploading && <Loader2 className="animate-spin text-blue-600" size={18} />}
                                                </div>
                                                <div className="mt-3">
                                                    <input type="text" value={formData.photoUrl} onChange={e => setFormData({ ...formData, photoUrl: e.target.value })} className="w-full p-3 border rounded-lg bg-white" placeholder="https://... (opcional)" />
                                                </div>
                                            </div>
                                            <div className="col-span-1">
                                                <div className="w-24 h-24 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                                                    {photoPreview ? (
                                                        <img src={photoPreview} className="w-full h-full object-cover" />
                                                    ) : formData.photoUrl ? (
                                                        <img src={getCachedImage(formData.photoUrl) || getDirectImageUrl(formData.photoUrl)} referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).onerror = null; (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName)}&background=e5e7eb&color=9ca3af`; }} />
                                                    ) : (
                                                        <Users className="text-gray-400" size={28} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nome Completo</label>
                                        <input required type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full p-3 border rounded-lg bg-white" />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">E-mail</label>
                                        <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full p-3 border rounded-lg bg-white" />
                                        {editingId && formData.email && (
                                            <div className="flex items-center gap-2 mt-1 text-[10px] text-amber-600 font-bold">
                                                <AlertTriangle size={12} /> Atenção: Mudar o e-mail não altera o login.
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Telefone</label>
                                        <div className="flex gap-2">
                                            <select value={phoneCountry} onChange={e => handlePhoneChange(e.target.value, localPhone)} className="p-3 border rounded-lg bg-white w-[110px]">
                                                <option value="+55">🇧🇷 +55</option>
                                                <option value="+244">🇦🇴 +244</option>
                                            </select>
                                            <input type="text" value={localPhone} onChange={e => handlePhoneChange(phoneCountry, e.target.value)} placeholder={phoneCountry === '+55' ? '(99) 99999-9999' : '999 999 999'} maxLength={15} className="w-full p-3 border rounded-lg bg-white" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sexo</label>
                                        <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="w-full p-3 border rounded-lg bg-white"><option value="male">Masculino</option><option value="female">Feminino</option></select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estado Civil</label>
                                        <div className="relative"><Heart className="absolute left-3 top-3 text-pink-400" size={16} /><select value={formData.maritalStatus} onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })} className="w-full pl-10 p-3 border rounded-lg bg-white appearance-none"><option value="single">Solteiro(a)</option><option value="married">Casado(a)</option><option value="divorced">Divorciado(a)</option><option value="widowed">Viúvo(a)</option></select></div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nascimento</label>
                                        <input type="date" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} className="w-full p-3 border rounded-lg bg-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200"><h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-2"><Building2 size={14} /> Dados Eclesiásticos</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cargo</label>
    <select
        value={formData.role}
        onChange={e => setFormData({ ...formData, role: e.target.value })}
        className="w-full p-3 border rounded-lg bg-white"
    >
        <option value="visitor">Visitante / Convertido</option>
        <option value="member">Membro</option>
        <option value="deacon">Diácono</option>
        <option value="leader">Líder</option>
        <option value="secretary">Secretaria</option>
        
        {userRole === 'admin' && (
            <>
                <option value="treasurer">Tesouraria</option>
                <option value="administrator">Admin Tesouraria</option>
                <option value="admin">Pastor (Admin)</option>
            </>
        )}
    </select>
    {userRole !== 'admin' && <div className="text-[10px] text-slate-500 mt-1 font-medium">Cargos de Alta Liderança são restritos ao Pastor.</div>}
</div>                                <div>
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full p-3 border rounded-lg bg-white">
        <option value="active">Ativo</option><option value="inactive">Inativo</option><option value="disciplined">Subdisciplina/Afastado</option><option value="transferred">Transferido</option><option value="excluded">Excluído</option>
    </select>
</div><div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Data Batismo</label><input type="date" value={formData.baptismDate} onChange={e => setFormData({ ...formData, baptismDate: e.target.value })} className="w-full p-3 border rounded-lg bg-white" /></div><div className="flex items-end"><div className="w-full bg-white p-3 rounded-lg border border-amber-200 flex items-center gap-3 cursor-pointer hover:bg-amber-100" onClick={() => setFormData({ ...formData, isTither: !formData.isTither })}><div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.isTither ? 'bg-amber-500 border-amber-500' : 'border-gray-300'}`}>{formData.isTither && <HandCoins size={12} className="text-white" />}</div><span className="text-sm font-semibold text-slate-700">É Dizimista?</span></div></div></div></div>

                            {userRole === 'admin' && (
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 animate-in fade-in">
                                    <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <ShieldCheck size={14} /> Permissões de Acesso (Login)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div
                                            onClick={() => togglePermission('secretary')}
                                            className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition ${formData.permissions.includes('secretary') ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
                                        >
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.permissions.includes('secretary') ? 'bg-white' : 'bg-gray-100 border-gray-300'}`}>
                                                {formData.permissions.includes('secretary') && <div className="w-3 h-3 bg-blue-600 rounded-sm" />}
                                            </div>
                                            <div>
                                                <span className="block text-xs font-bold uppercase">Secretaria</span>
                                                <span className={`text-[10px] ${formData.permissions.includes('secretary') ? 'text-blue-200' : 'text-gray-400'}`}>Acessa e edita membros</span>
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => togglePermission('financial')}
                                            className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition ${formData.permissions.includes('financial') ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
                                        >
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.permissions.includes('financial') ? 'bg-white' : 'bg-gray-100 border-gray-300'}`}>
                                                {formData.permissions.includes('financial') && <div className="w-3 h-3 bg-blue-600 rounded-sm" />}
                                            </div>
                                            <div>
                                                <span className="block text-xs font-bold uppercase">Tesouraria</span>
                                                <span className={`text-[10px] ${formData.permissions.includes('financial') ? 'text-blue-200' : 'text-gray-400'}`}>Acessa dízimos e ofertas</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-2"><Briefcase size={14} /> Ministérios & Departamentos</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {ministryOptions.map(dept => (
                                        <div
                                            key={dept.id}
                                            onClick={() => toggleMinistry(dept.id!)}
                                            className={`p-2 rounded-md border text-xs font-bold cursor-pointer transition flex items-center gap-2 ${formData.selectedMinistries.includes(dept.id!) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
                                        >
                                            <div className={`w-3 h-3 rounded-full border ${formData.selectedMinistries.includes(dept.id!) ? 'bg-white border-white' : 'bg-transparent border-gray-300'}`}></div>
                                            {dept.name}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-2"><MapPin size={14} /> Endereço</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2"><input placeholder="Rua / Avenida" value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} className="w-full p-3 border rounded-lg bg-white" /></div>
                                    <div><input placeholder="Cidade" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full p-3 border rounded-lg bg-white" /></div>
                                    <div><input placeholder="Estado/Província" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} className="w-full p-3 border rounded-lg bg-white" /></div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-slate-100">Cancelar</button>
                                <button type="submit" disabled={loading} className="px-6 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200">{loading ? 'Salvando...' : 'Salvar Dados'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAccessModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                        <div className="text-center mb-6"><div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4"><Lock size={32} /></div><h2 className="text-xl font-bold">Criar Acesso</h2></div>
                        <form onSubmit={handleCreateAccess} className="space-y-4">
                            <input type="text" disabled value={selectedMemberForAccess?.email || selectedMemberForAccess?.phone || ''} className="w-full p-3 border rounded-lg bg-slate-100 text-slate-500" />
                            <input type="text" required minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3 border rounded-lg" placeholder="Nova Senha (mín. 8 caracteres)" />
                            <div className="text-xs text-slate-500 p-2 bg-slate-50 rounded-md">
                                A senha deve conter letras maiúsculas, minúsculas e números.
                            </div>
                            <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowAccessModal(false)} className="flex-1 py-3 border rounded-lg">Cancelar</button><button type="submit" disabled={creatingAccess} className="flex-1 py-3 bg-yellow-500 text-white rounded-lg font-bold">Confirmar</button></div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}