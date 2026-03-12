"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChurch } from "../../contexts/ChurchContext";
import { memberService } from "../../services/memberService";
import { generalScaleService } from "../../services/generalScaleService";
import { notificationService } from "../../services/notificationService";
import { Member } from "../../types/member";
import { db } from "../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDirectImageUrl } from "../../utils/imageHelper";

import {
    FileText, Printer, Search, FileBadge, ArrowRightLeft,
    User, X, Building2, Loader2, ShieldCheck, CalendarRange, Plus, Trash2, Save, Clock, Baby, ScrollText, Droplets, Network
} from "lucide-react";

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
    const { churchId, churchName, logoUrl, signatureUrl, userRole, hasPermission, loading: authLoading } = useChurch();

    const [members, setMembers] = useState<Member[]>([]);
    const [savedScales, setSavedScales] = useState<any[]>([]);

    // ESTADOS DE DADOS DA IGREJA
    const [customTexts, setCustomTexts] = useState({ recommendation: "", transfer: "" });
    const [churchCity, setChurchCity] = useState("Cidade");

    const [loading, setLoading] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savingOrganogram, setSavingOrganogram] = useState(false);

    const [selectedDoc, setSelectedDoc] = useState<'recommendation' | 'transfer' | 'scale' | 'certificate' | 'baptism' | 'organogram' | null>(null);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [search, setSearch] = useState("");
    const [obs, setObs] = useState("");

    const [scaleData, setScaleData] = useState({
        title: `ESCALA DE ${new Date().toLocaleString('pt-BR', { month: 'long' }).toUpperCase()} / ${new Date().getFullYear()}`,
        theme: "",
        text: "",
        rows: [] as ScaleRow[]
    });

    const [organogramData, setOrganogramData] = useState({
        president: "", vice: "", secretary: "", treasurer: "",
        deacons: "", youth: "", women: "", men: "", kids: "", worship: ""
    });

    useEffect(() => {
        if (!authLoading) {
            if (userRole !== 'admin' && !hasPermission('secretary')) {
                router.push('/');
            }
        }
    }, [authLoading, userRole, hasPermission, router]);

    useEffect(() => {
        if (churchId) {
            loadMembers();
            loadChurchData();
            if (selectedDoc === 'scale') loadHistory();
        }
    }, [churchId, selectedDoc]);

    const loadMembers = async () => {
        if (!churchId) return;
        setLoading(true);
        try {
            const list = await memberService.listByChurch(churchId);
            setMembers(list);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const loadChurchData = async () => {
        if (!churchId) return;
        try {
            const docRef = doc(db, "churches", churchId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCustomTexts({
                    recommendation: data.textRecommendation || "",
                    transfer: data.textTransfer || ""
                });
                if (data.city) {
                    setChurchCity(data.city);
                }
                if (data.organogram) {
                    setOrganogramData(data.organogram);
                }
            }
        } catch (e) { console.error(e); }
    };

    const loadHistory = async () => {
        if (!churchId) return;
        const history = await generalScaleService.listByChurch(churchId);
        setSavedScales(history);
    };

    const filteredMembers = members.filter(m => m.fullName.toLowerCase().includes(search.toLowerCase()));

    // --- FUNÇÕES DA ESCALA ---
    const findMemberByText = (text: string) => {
        if(!text) return null;
        const lower = text.toLowerCase().trim();
        return members.find(m => {
            const fullName = m.fullName.toLowerCase().trim();
            const firstName = fullName.split(' ')[0];
            return lower.includes(fullName) || fullName.includes(lower) || lower === firstName;
        });
    };

    const handleSaveScale = async () => {
        if (!churchId) return;
        if (scaleData.rows.length === 0) return alert("Adicione pelo menos uma linha na escala.");
        setSaving(true);
        try {
            await generalScaleService.create({ churchId, ...scaleData });
            
            // Disparar notificações para escala geral
            try {
               const now = new Date().toISOString();
               const promises: any[] = [];
               scaleData.rows.forEach(row => {
                  const dateStr = row.date.includes('-') ? row.date.split('-').reverse().join('/') : row.date;
                  const roles = [
                      { role: 'Dirigente', name: row.leader },
                      { role: 'Pregador', name: row.preacher },
                      { role: 'Louvor', name: row.music }
                  ];
                  roles.forEach(r => {
                      if(r.name) {
                          const member = findMemberByText(r.name);
                          if(member && member.id) {
                              promises.push(
                                  notificationService.create({
                                      memberId: member.id,
                                      churchId,
                                      title: "Escala Geral!",
                                      message: `Você foi escalado(a) em '${scaleData.title}' como ${r.role} no dia ${dateStr}.`,
                                      type: 'scale',
                                      read: false,
                                      createdAt: now
                                  })
                              );
                          }
                      }
                  });
               });
               await Promise.all(promises);
            } catch (err) {
               console.error("Erro notificando membros na escala geral: ", err);
            }

            alert("Escala salva no histórico e membros notificados!");
            loadHistory();
        } catch (error) { console.error(error); alert("Erro ao salvar."); }
        finally { setSaving(false); }
    };

    const loadFromHistory = (scale: any) => {
        if (confirm("Carregar esta escala? Os dados atuais serão substituídos.")) {
            setScaleData({
                title: scale.title, theme: scale.theme, text: scale.text, rows: scale.rows
            });
        }
    };

    const deleteFromHistory = async (e: any, id: string) => {
        e.stopPropagation();
        if (confirm("Excluir esta escala do histórico?")) {
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

    // --- FUNÇÕES DO ORGANOGRAMA ---
    const handleSaveOrganogram = async () => {
        if (!churchId) return;
        setSavingOrganogram(true);
        try {
            const docRef = doc(db, "churches", churchId);
            await updateDoc(docRef, {
                organogram: organogramData
            });
            alert("Organograma salvo com sucesso!");
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar organograma.");
        } finally {
            setSavingOrganogram(false);
        }
    };

    // --- IMPRESSÃO ---
    const handlePrint = async () => {
        // 1. PERGUNTA OS DADOS PRIMEIRO (SE FOR CERTIDÃO DE CRIANÇA)
        let fatherName = "_____________________________";
        let motherName = "_____________________________";

        if (selectedDoc === 'certificate') {
            fatherName = prompt("Nome do Pai (Deixe em branco se não houver):") || "_____________________________";
            motherName = prompt("Nome da Mãe (Deixe em branco se não houver):") || "_____________________________";
        }

        setPrinting(true);

        // Pega links diretos
        const directLogo = getDirectImageUrl(logoUrl);
        const directSignature = getDirectImageUrl(signatureUrl);

        // Configura a janela
        // Se for certificado de criança OU batismo, largura maior para paisagem
        const isLandscape = selectedDoc === 'certificate' || selectedDoc === 'baptism';
        const width = isLandscape ? 1123 : 900;
        const height = isLandscape ? 794 : 1000;

        const printWindow = window.open('', '', `width=${width},height=${height}`);
        if (!printWindow) { setPrinting(false); return alert("Permita pop-ups!"); }

        let docContent = "";
        let htmlContent = "";
        const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

        // --- CASO 1: ESCALA ---
        if (selectedDoc === 'scale') {
            const rowsHtml = scaleData.rows.map(row => {
                let dateDisplay = row.date;
                try {
                    if (row.date.includes('-')) {
                        const d = new Date(row.date);
                        dateDisplay = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                    }
                } catch (e) { }
                return `<tr><td style="font-weight:bold;text-align:center;">${dateDisplay}</td><td>${row.event}</td><td>${row.leader}</td><td>${row.music}</td><td>${row.preacher}</td><td style="font-size:11px;color:#444;">${row.obs}</td></tr>`;
            }).join('');

            docContent = `
            <div class="header">${directLogo ? `<img src="${directLogo}" class="logo" />` : ''}<h2 style="margin:0;text-transform:uppercase;font-size:24px;font-weight:900;">${churchName}</h2><h3 style="margin:5px 0 20px 0;text-transform:uppercase;font-size:18px;border-bottom:2px solid #000;display:inline-block;padding-bottom:5px;">${scaleData.title}</h3></div>
            <div style="margin:0 0 20px 0;text-align:left;font-size:14px;">${scaleData.theme ? `<p style="margin:5px 0;"><strong>TEMA DO MÊS:</strong> ${scaleData.theme}</p>` : ''}${scaleData.text ? `<p style="margin:5px 0;"><strong>TEXTO BASE:</strong> <em>${scaleData.text}</em></p>` : ''}</div>
            <table><thead><tr><th style="width:80px;">DATA</th><th>CULTO</th><th>DIRIGENTE</th><th>LOUVOR</th><th>PREGADOR</th><th>OBS / TEXTO</th></tr></thead><tbody>${rowsHtml}</tbody></table>
            <div style="margin-top:40px;font-size:12px;text-align:left;"><p style="font-weight:bold;text-decoration:underline;">Observações Importantes:</p><ul style="margin-top:5px;"><li>Em caso de indisponibilidade, o escalado deve comunicar a liderança com antecedência.</li><li>Não é permitida a troca de escala sem autorização prévia.</li></ul></div>
        `;

            htmlContent = `<html><head><title>Escala</title><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:'Times New Roman';padding:40px;text-align:center}table{width:100%;border-collapse:collapse;margin-top:10px}td,th{border:1px solid #000;padding:6px;font-size:13px}th{background:#f0f0f0}.logo{max-height:80px} .close-btn { position: fixed; top: 15px; left: 15px; z-index: 9999; background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 50px; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.3); cursor: pointer; text-decoration: none; font-size: 14px; } @media print { .close-btn { display: none; } }</style></head><body><button onclick="window.close()" class="close-btn">← FECHAR</button>${docContent}<script>setTimeout(()=>window.print(),1000)</script></body></html>`;

            // --- CASO 2: CERTIDÃO DE CRIANÇA E BATISMO (PAISAGEM) ---
        } else if (selectedDoc === 'certificate' || selectedDoc === 'baptism') {
            if (!selectedMember) return;

            // Formata a data de batismo com segurança (se existir)
            const baptismDateText = selectedMember.baptismDate
                ? selectedMember.baptismDate.split('-').reverse().join('/')
                : "___/___/____";

            htmlContent = `
          <html>
            <head>
              <title>${selectedDoc === 'certificate' ? 'Certidão de Apresentação' : 'Certificado de Batismo'} - ${selectedMember.fullName}</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:wght@400;700&display=swap');
                
                /* FORÇA MODO PAISAGEM NA IMPRESSÃO */
                @page { size: A4 landscape; margin: 0; }
                
                body { margin: 0; padding: 0; font-family: 'Playfair Display', serif; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .certificate-container { width: 100%; height: 100vh; display: flex; justify-content: center; align-items: center; background-color: #fff; padding: 20px; box-sizing: border-box; }
                .border-outer { width: 100%; height: 100%; border: 2px solid #d4af37; padding: 5px; position: relative; }
                .border-inner { width: 100%; height: 100%; border: 1px solid #d4af37; display: flex; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(250,248,240,1) 100%); position: relative; }
                .corner { position: absolute; width: 40px; height: 40px; border-color: #d4af37; border-style: double; }
                .tl { top: 10px; left: 10px; border-width: 4px 0 0 4px; }
                .tr { top: 10px; right: 10px; border-width: 4px 4px 0 0; }
                .bl { bottom: 10px; left: 10px; border-width: 0 0 4px 4px; }
                .br { bottom: 10px; right: 10px; border-width: 0 4px 4px 0; }
                .logo { height: 60px; margin-bottom: 10px; object-fit: contain; }
                .church-header { font-size: 18px; font-weight: bold; text-transform: uppercase; color: #333; letter-spacing: 2px; text-align:center; }
                .cert-title { font-family: 'Great Vibes', cursive; font-size: 60px; color: #d4af37; margin: 5px 0 20px 0; line-height: 1; text-align:center; }
                .content-text { font-size: 16px; color: #555; text-align: center; max-width: 90%; line-height: 1.6; margin-bottom: 30px; }
                .child-name { font-size: 28px; font-weight: bold; color: #000; border-bottom: 1px solid #ddd; padding: 0 10px; display: inline-block; margin: 0 5px; }
                .parents-block { display: flex; justify-content: center; gap: 20px; width: 90%; margin-bottom: 30px; flex-wrap: wrap; }
                .parent-line { flex: 1; text-align: center; min-width: 200px; }
                .parent-name { font-size: 18px; font-weight: bold; border-bottom: 1px solid #999; padding-bottom: 5px; display: block; }
                .parent-label { font-size: 10px; text-transform: uppercase; color: #777; margin-top: 5px; letter-spacing: 1px; }
                .footer-row { display: flex; justify-content: space-between; width: 90%; margin-top: auto; padding-bottom: 30px; }
                .signature { text-align: center; position: relative; width: 40%; }
                .sig-line { width: 100%; border-bottom: 1px solid #333; margin-bottom: 5px; margin-top: 5px; }
                .sig-text { font-size: 12px; font-weight: bold; text-transform: uppercase; }
                .sig-img { position: absolute; bottom: 25px; left: 0; right: 0; margin: auto; height: 50px; object-fit: contain; }
                .date-place { font-size: 14px; font-style: italic; color: #555; margin-top: 10px; }

                /* BOTÃO FLUTUANTE */
                .close-btn {
                    position: fixed; top: 15px; left: 15px; z-index: 9999;
                    background: #ef4444; color: white; border: none;
                    padding: 10px 20px; border-radius: 50px; font-weight: bold;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.3); cursor: pointer;
                    text-decoration: none; font-size: 14px;
                }
                @media print { .close-btn { display: none; } }
              </style>
            </head>
            <body>
              <button onclick="window.close()" class="close-btn">← FECHAR</button>
              <div class="certificate-container">
                <div class="border-outer">
                  <div class="border-inner">
                    <div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>
                    ${directLogo ? `<img src="${directLogo}" class="logo" />` : ''}
                    <div class="church-header">${churchName}</div>
                    
                    ${selectedDoc === 'certificate' ? `
                        <div class="cert-title">Certificado de Apresentação</div>
                        <div class="content-text">
                          Certificamos que a criança<br/><span class="child-name">${selectedMember.fullName}</span><br/>
                          foi apresentada ao Senhor e dedicada a Deus, conforme os princípios cristãos, em cerimônia realizada nesta igreja.
                        </div>
                        <div class="parents-block">
                            <div class="parent-line"><span class="parent-name">${fatherName}</span><div class="parent-label">Pai</div></div>
                            <div class="parent-line"><span class="parent-name">${motherName}</span><div class="parent-label">Mãe</div></div>
                        </div>
                    ` : `
                        <div class="cert-title">Certificado de Batismo</div>
                        <div class="content-text" style="margin-bottom: 60px;">
                          Certificamos com alegria que<br/><span class="child-name">${selectedMember.fullName}</span><br/>
                          desceu às águas batismais no dia <strong>${baptismDateText}</strong>, em pública profissão de fé e <br/>obediência à ordem de Nosso Senhor e Salvador Jesus Cristo.
                        </div>
                    `}
                    
                    <div class="date-place">${churchCity}, ${today}</div>

                    <div class="footer-row">
                        <div class="signature"><div style="height:40px"></div><div class="sig-line"></div><div class="sig-text">Secretaria</div></div>
                        <div class="signature">
                           ${directSignature ? `<img src="${directSignature}" class="sig-img" />` : ''}
                           <div style="height:40px"></div><div class="sig-line"></div><div class="sig-text">Pastor Presidente</div>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
              <script>setTimeout(function(){ window.print(); }, 1500);</script>
            </body>
          </html>
        `;

            // --- CASO 3: CARTAS (RECOMENDAÇÃO E TRANSFERÊNCIA) ---
        } else if (selectedDoc === 'recommendation' || selectedDoc === 'transfer') {
            if (!selectedMember) {
                setPrinting(false);
                return;
            }

            let bodyText = "";

            if (selectedDoc === 'recommendation') {
                if (customTexts.recommendation && customTexts.recommendation.trim() !== "") {
                    bodyText = customTexts.recommendation.replace(/{nome}/gi, `<strong>${selectedMember.fullName.toUpperCase()}</strong>`).replace(/\[nome\]/gi, `<strong>${selectedMember.fullName.toUpperCase()}</strong>`);
                } else {
                    bodyText = `Recomendamos aos amados irmãos em Cristo o portador(a) desta, o(a) irmão(ã) <strong>${selectedMember.fullName.toUpperCase()}</strong>, membro desta igreja em plena comunhão, não constando nada, até a presente data, que desabone sua conduta cristã.`;
                }
            } else {
                if (customTexts.transfer && customTexts.transfer.trim() !== "") {
                    bodyText = customTexts.transfer.replace(/{nome}/gi, `<strong>${selectedMember.fullName.toUpperCase()}</strong>`).replace(/\[nome\]/gi, `<strong>${selectedMember.fullName.toUpperCase()}</strong>`);
                } else {
                    bodyText = `Recomendamos aos amados irmãos em Cristo o portador(a) desta, o(a) irmão(ã) <strong>${selectedMember.fullName.toUpperCase()}</strong>, membro desta igreja em plena comunhão. Solicitamos que o(a) mesmo(a) seja recebido(a) como membro dessa amada igreja, cessando assim suas responsabilidades conosco.`;
                }
            }

            docContent = `
          <div class="header">
            ${directLogo ? `<img src="${directLogo}" class="logo" />` : ''}
            <div style="font-size: 22px; font-weight: bold; text-transform: uppercase;">${churchName}</div>
          </div>
          
          <h2 style="text-transform: uppercase; margin-top: 40px; text-decoration: underline;">${selectedDoc === 'recommendation' ? 'CARTA DE RECOMENDAÇÃO' : 'CARTA DE TRANSFERÊNCIA'}</h2>
          
          <div class="content">
            <p>${bodyText}</p>
            ${obs ? `<p><strong>Observação:</strong> ${obs}</p>` : ''}
            <p style="margin-top: 20px;">Sem mais para o momento, subscrevemo-nos em Cristo.</p>
          </div>
          
          <p style="text-align: right; margin-top: 60px;">${churchCity}, ${today}</p>
        `;

            htmlContent = `
          <html>
            <head>
              <title>Carta - ${churchName}</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: 'Times New Roman', serif; padding: 40px; text-align: center; color: #000; margin: 0; }
                .header { margin-bottom: 20px; padding-bottom: 10px; }
                .logo { max-width: 100px; max-height: 100px; object-fit: contain; margin: 0 auto 10px; display: block; }
                .content { font-size: 18px; line-height: 1.6; text-align: justify; margin: 40px 0; min-height: 200px; }
                .footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 40px; width: 100%; box-sizing: border-box; }
                .signature-block { width: 40%; text-align: center; display: flex; flex-direction: column; align-items: center; position: relative; }
                .signature-line { width: 100%; border-top: 1px solid #000; padding-top: 5px; font-weight: bold; font-size: 14px; margin-top: 5px; }
                .signature-img { height: 70px; object-fit: contain; display: block; margin-bottom: -15px; z-index: 10; }
                .signature-placeholder { height: 70px; width: 100%; }
                .meta { font-size: 10px; color: #999; margin-top: 60px; text-align: center; width: 100%; }
                .close-btn { position: fixed; top: 15px; left: 15px; z-index: 9999; background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 50px; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.3); cursor: pointer; text-decoration: none; font-size: 14px; }
                @media print { .no-print { display: none !important; } .close-btn { display: none; } @page { margin: 2cm; size: A4; } body { padding: 0; } }
              </style>
            </head>
            <body>
              <button onclick="window.close()" class="close-btn no-print">← FECHAR</button>
              ${docContent}
              <div class="footer">
                <div class="signature-block">
                    ${directSignature ? `<img src="${directSignature}" class="signature-img" />` : '<div class="signature-placeholder"></div>'}
                    <div class="signature-line">Pastor / Responsável</div>
                </div>
                <div class="signature-block"><div class="signature-placeholder"></div><div class="signature-line">Secretaria</div></div>
              </div>
              <div class="meta">Gerado digitalmente pelo sistema ReinoCloud</div>
              <script>setTimeout(function() { window.print(); }, 1500);</script>
            </body>
          </html>
        `;
        }

        // --- CASO 4: ORGANOGRAMA ---
        if (selectedDoc === 'organogram') {
            htmlContent = `
            <html>
                <head>
                    <title>Organograma - ${churchName}</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; text-align: center; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        * { box-sizing: border-box; }
                        /* ESTRUTURA DA ÁRVORE (CSS TREE) */
                        .tree ul { padding-top: 20px; position: relative; transition: all 0.5s; display: flex; justify-content: center; }
                        .tree li { float: left; text-align: center; list-style-type: none; position: relative; padding: 20px 5px 0 5px; transition: all 0.5s; }
                        .tree li::before, .tree li::after{ content: ''; position: absolute; top: 0; right: 50%; border-top: 2px solid #ccc; width: 50%; height: 20px; }
                        .tree li::after{ right: auto; left: 50%; border-left: 2px solid #ccc; }
                        .tree li:only-child::after, .tree li:only-child::before { display: none; }
                        .tree li:only-child{ padding-top: 0;}
                        .tree li:first-child::before, .tree li:last-child::after{ border: 0 none; }
                        .tree li:last-child::before{ border-right: 2px solid #ccc; border-radius: 0 5px 0 0; }
                        .tree li:first-child::after{ border-radius: 5px 0 0 0; }
                        .tree ul ul::before{ content: ''; position: absolute; top: 0; left: 50%; border-left: 2px solid #ccc; width: 0; height: 20px; margin-left: -1px; }
                        .tree li a { border: 2px solid #ccc; padding: 10px 15px; text-decoration: none; color: #333; font-size: 14px; display: inline-block; border-radius: 8px; background: white; min-width: 140px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                        .tree li a .role { font-weight: bold; margin-bottom: 5px; font-size: 11px; color: #666; text-transform: uppercase; }
                        .tree li a .name { font-weight: 800; font-size: 14px; color: #1e3a8a; }
                        
                        /* CORES POR NÍVEL */
                        .tree li a.lvl1 { border-color: #1e3a8a; background: #eff6ff; }
                        .tree li a.lvl1 .role { color: #1d4ed8; }
                        .tree li a.lvl2 { border-color: #3b82f6; background: #e0f2fe; }
                        .tree li a.lvl3 { border-color: #10b981; background: #ecfdf5; }
                        .tree li a.lvl3 .name { color: #065f46; }
                        .tree li a.lvl4 { border-color: #ede9fe; background: #fff; }
                        .tree li a.lvl4 .name { color: #4338ca; }

                        .header { margin-bottom: 40px; }
                        .logo { height: 60px; margin-bottom: 10px; }
                        h1 { color: #1e3a8a; margin: 0; text-transform: uppercase; font-size: 22px; }
                        p { margin-top: 5px; color: #666; font-size: 12px; }
                        
                        .close-btn { position: fixed; top: 15px; left: 15px; z-index: 9999; background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 50px; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.3); cursor: pointer; text-decoration: none; font-size: 14px; }
                        @media print { .close-btn { display: none; } @page { size: A4 landscape; margin: 1cm; } }
                        .center-tree { display: block; margin-top: 20px; width: 100%; overflow-x: auto; padding-bottom: 20px; }
                    </style>
                </head>
                <body>
                    <button onclick="window.close()" class="close-btn">← FECHAR</button>
                    <div class="header">
                        ${directLogo ? `<img src="${directLogo}" class="logo" />` : ''}
                        <h1>${churchName}</h1>
                        <p>ORGANOGRAMA DA IGREJA • ${today}</p>
                    </div>
                    
                    <div class="center-tree">
                        <div class="tree">
                            <ul>
                                <li>
                                    <a href="#" class="lvl1">
                                        <div class="role">Pastor Presidente</div>
                                        <div class="name">${organogramData.president || '-'}</div>
                                    </a>
                                    <ul>
                                        <li>
                                            <a href="#" class="lvl2">
                                                <div class="role">Vice-Presidente</div>
                                                <div class="name">${organogramData.vice || '-'}</div>
                                            </a>
                                            <ul>
                                                <li>
                                                    <a href="#" class="lvl3">
                                                        <div class="role">Administração</div>
                                                        <div class="name">Finanças & Secretaria</div>
                                                    </a>
                                                    <ul>
                                                        <li>
                                                            <a href="#" class="lvl4">
                                                                <div class="role">Secretaria</div>
                                                                <div class="name">${organogramData.secretary || '-'}</div>
                                                            </a>
                                                        </li>
                                                        <li>
                                                            <a href="#" class="lvl4">
                                                                <div class="role">Tesouraria</div>
                                                                <div class="name">${organogramData.treasurer || '-'}</div>
                                                            </a>
                                                        </li>
                                                    </ul>
                                                </li>
                                                <li>
                                                    <a href="#" class="lvl3">
                                                        <div class="role">Corpo Diaconal</div>
                                                        <div class="name">${organogramData.deacons || '-'}</div>
                                                    </a>
                                                </li>
                                                <li>
                                                    <a href="#" class="lvl3">
                                                        <div class="role">Departamentos</div>
                                                        <div class="name">Ministérios & Lideranças</div>
                                                    </a>
                                                    <ul>
                                                        <li>
                                                            <a href="#" class="lvl4"><div class="role">Louvor</div><div class="name">${organogramData.worship || '-'}</div></a>
                                                        </li>
                                                        <li>
                                                            <a href="#" class="lvl4"><div class="role">Jovens</div><div class="name">${organogramData.youth || '-'}</div></a>
                                                        </li>
                                                        <li>
                                                            <a href="#" class="lvl4"><div class="role">Mulheres</div><div class="name">${organogramData.women || '-'}</div></a>
                                                        </li>
                                                        <li>
                                                            <a href="#" class="lvl4"><div class="role">Homens</div><div class="name">${organogramData.men || '-'}</div></a>
                                                        </li>
                                                        <li>
                                                            <a href="#" class="lvl4"><div class="role">Infantil</div><div class="name">${organogramData.kids || '-'}</div></a>
                                                        </li>
                                                    </ul>
                                                </li>
                                            </ul>
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <script>setTimeout(function() { window.print(); }, 1500);</script>
                </body>
            </html>
        `;
        }

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setPrinting(false);
    };

    if (authLoading) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><Loader2 className="animate-spin text-blue-600" /></div>;
    if (userRole !== 'admin' && !hasPermission('secretary')) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            <datalist id="members-list">{members.map(m => <option key={m.id} value={m.fullName} />)}</datalist>

            <div className="bg-[#1D4ED8] pt-10 pb-24 px-8 shadow-sm">
                <div className="max-w-6xl mx-auto"><h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3"><FileText className="text-blue-300" /> Serviços & Documentos</h1><p className="text-blue-100 text-lg opacity-90">Emissão de cartas, certificados e escalas oficiais.</p></div>
            </div>

            <div className="max-w-6xl mx-auto px-4 md:px-0 -mt-16">
                {!selectedDoc ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4">
                        <div onClick={() => { setSelectedDoc('recommendation'); setSelectedMember(null); }} className="bg-white p-4 md:p-5 rounded-3xl shadow-xl cursor-pointer border-2 border-transparent hover:border-blue-200 transition hover:-translate-y-1"><div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3"><FileBadge size={20} /></div><h3 className="text-sm md:text-base font-bold text-gray-800 leading-tight">Recomendação</h3><p className="hidden md:block text-xs text-gray-500 mt-1">Para membros visitantes.</p></div>
                        <div onClick={() => { setSelectedDoc('transfer'); setSelectedMember(null); }} className="bg-white p-4 md:p-5 rounded-3xl shadow-xl cursor-pointer border-2 border-transparent hover:border-orange-200 transition hover:-translate-y-1"><div className="w-10 h-10 md:w-12 md:h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-3"><ArrowRightLeft size={20} /></div><h3 className="text-sm md:text-base font-bold text-gray-800 leading-tight">Transferência</h3><p className="hidden md:block text-xs text-gray-500 mt-1">Mudança definitiva.</p></div>
                        <div onClick={() => { setSelectedDoc('certificate'); setSelectedMember(null); }} className="bg-white p-4 md:p-5 rounded-3xl shadow-xl cursor-pointer border-2 border-transparent hover:border-purple-200 transition hover:-translate-y-1"><div className="w-10 h-10 md:w-12 md:h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-3"><Baby size={20} /></div><h3 className="text-sm md:text-base font-bold text-gray-800 leading-tight">Certidão Criança</h3><p className="hidden md:block text-xs text-gray-500 mt-1">Apresentação de bebê.</p></div>
                        <div onClick={() => { setSelectedDoc('baptism'); setSelectedMember(null); }} className="bg-white p-4 md:p-5 rounded-3xl shadow-xl cursor-pointer border-2 border-transparent hover:border-cyan-200 transition hover:-translate-y-1"><div className="w-10 h-10 md:w-12 md:h-12 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center mb-3"><Droplets size={20} /></div><h3 className="text-sm md:text-base font-bold text-gray-800 leading-tight">Certidão Batismo</h3><p className="hidden md:block text-xs text-gray-500 mt-1">Comprovação de águas.</p></div>
                        <div onClick={() => { setSelectedDoc('scale'); }} className="bg-white p-4 md:p-5 rounded-3xl shadow-xl cursor-pointer border-2 border-transparent hover:border-green-200 transition hover:-translate-y-1"><div className="w-10 h-10 md:w-12 md:h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-3"><CalendarRange size={20} /></div><h3 className="text-sm md:text-base font-bold text-gray-800 leading-tight">Gerador Escalas</h3><p className="hidden md:block text-xs text-gray-500 mt-1">Cultos e louvor.</p></div>
                        <div onClick={() => { setSelectedDoc('organogram'); }} className="bg-white p-4 md:p-5 rounded-3xl shadow-xl cursor-pointer border-2 border-transparent hover:border-pink-200 transition hover:-translate-y-1"><div className="w-10 h-10 md:w-12 md:h-12 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center mb-3"><Network size={20} /></div><h3 className="text-sm md:text-base font-bold text-gray-800 leading-tight">Organograma</h3><p className="hidden md:block text-xs text-gray-500 mt-1">Estrutura da Igreja.</p></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4 overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                            <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                                {selectedDoc === 'organogram' ? <Network className="text-pink-600" /> : selectedDoc === 'scale' ? <CalendarRange className="text-green-600" /> : selectedDoc === 'certificate' ? <ScrollText className="text-purple-600" /> : selectedDoc === 'baptism' ? <Droplets className="text-cyan-600" /> : <FileBadge className="text-blue-500" />}
                                {selectedDoc === 'organogram' ? 'Organograma' : selectedDoc === 'scale' ? 'Gerador de Escala' : selectedDoc === 'certificate' ? 'Emitir Certidão' : selectedDoc === 'baptism' ? 'Certificado de Batismo' : 'Emitir Carta'}
                            </h2>
                            <button onClick={() => setSelectedDoc(null)} className="text-gray-500 hover:text-red-500 font-bold text-sm bg-white border border-gray-200 hover:bg-red-50 px-3 py-2 rounded-lg flex items-center gap-1 transition"><X size={16} /> FECHAR</button>
                        </div>

                        {selectedDoc === 'scale' ? (
                            // --- MODO ESCALA ---
                            <div className="flex flex-col lg:flex-row h-[800px]">
                                <div className="w-full lg:w-72 bg-gray-50 border-r border-gray-100 flex flex-col">
                                    <div className="p-4 border-b border-gray-100 font-bold text-xs text-gray-400 uppercase flex items-center gap-2"><Clock size={14} /> Histórico de Escalas</div>
                                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                        {savedScales.length === 0 ? (<p className="text-xs text-gray-400 text-center py-4">Nenhuma escala salva.</p>) : (savedScales.map(scale => (<div key={scale.id} onClick={() => loadFromHistory(scale)} className="group p-3 rounded-xl hover:bg-white hover:shadow-sm cursor-pointer border border-transparent hover:border-gray-200 transition"><div className="flex justify-between items-start"><h4 className="text-sm font-bold text-gray-700 line-clamp-2">{scale.title}</h4><button onClick={(e) => deleteFromHistory(e, scale.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button></div><p className="text-[10px] text-gray-400 mt-1">{new Date(scale.createdAt).toLocaleDateString('pt-BR')}</p></div>)))}
                                    </div>
                                </div>
                                <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
                                    <div className="flex justify-end gap-2 mb-6">
                                        <button onClick={handleSaveScale} disabled={saving} className="bg-white border border-green-200 text-green-700 hover:bg-green-50 px-4 py-2 rounded-xl font-bold shadow-sm transition flex items-center gap-2">{saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Salvar</button>
                                        <button onClick={handlePrint} disabled={printing} className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold shadow hover:bg-green-700 transition flex items-center gap-2">{printing ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />} Imprimir PDF</button>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Título</label><input type="text" value={scaleData.title} onChange={e => setScaleData({ ...scaleData, title: e.target.value })} className="w-full p-2 border rounded-lg mt-1" /></div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Tema</label><input type="text" value={scaleData.theme} onChange={e => setScaleData({ ...scaleData, theme: e.target.value })} className="w-full p-2 border rounded-lg mt-1" /></div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Texto Base</label><input type="text" value={scaleData.text} onChange={e => setScaleData({ ...scaleData, text: e.target.value })} className="w-full p-2 border rounded-lg mt-1" /></div>
                                    </div>
                                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                                        <table className="w-full text-left border-collapse min-w-[800px]">
                                            <thead><tr className="bg-gray-100 text-gray-600 text-xs uppercase"><th className="p-3 border-b">Data</th><th className="p-3 border-b">Evento</th><th className="p-3 border-b">Dirigente</th><th className="p-3 border-b">Pregador</th><th className="p-3 border-b">Louvor</th><th className="p-3 border-b">Obs</th><th className="p-3 border-b w-10"></th></tr></thead>
                                            <tbody className="divide-y divide-gray-100">{scaleData.rows.map((row, idx) => (<tr key={idx} className="group hover:bg-gray-50"><td className="p-2"><input type="date" value={row.date} onChange={e => updateScaleRow(idx, 'date', e.target.value)} className="w-full p-2 border rounded bg-transparent focus:bg-white" /></td><td className="p-2"><input type="text" value={row.event} onChange={e => updateScaleRow(idx, 'event', e.target.value)} className="w-full p-2 border rounded bg-transparent focus:bg-white" /></td><td className="p-2"><input type="text" list="members-list" value={row.leader} onChange={e => updateScaleRow(idx, 'leader', e.target.value)} className="w-full p-2 border rounded bg-transparent focus:bg-white" /></td><td className="p-2"><input type="text" list="members-list" value={row.preacher} onChange={e => updateScaleRow(idx, 'preacher', e.target.value)} className="w-full p-2 border rounded bg-transparent focus:bg-white" /></td><td className="p-2"><input type="text" value={row.music} onChange={e => updateScaleRow(idx, 'music', e.target.value)} className="w-full p-2 border rounded bg-transparent focus:bg-white" /></td><td className="p-2"><input type="text" value={row.obs} onChange={e => updateScaleRow(idx, 'obs', e.target.value)} className="w-full p-2 border rounded bg-transparent focus:bg-white" /></td><td className="p-2 text-center"><button onClick={() => removeScaleRow(idx)} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button></td></tr>))}</tbody>
                                        </table>
                                    </div>
                                    <button onClick={addScaleRow} className="w-full py-3 mt-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition flex items-center justify-center gap-2"><Plus size={20} /> Adicionar Linha</button>
                                </div>
                            </div>
                        ) : selectedDoc === 'organogram' ? (
                            // --- MODO ORGANOGRAMA ---
                            <div className="p-6 md:p-8">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">Estrutura da Igreja</h3>
                                        <p className="text-sm text-gray-500 mt-1 max-w-lg">
                                            Preencha os nomes dos líderes nas respectivas áreas. Ao clicar em Imprimir, o sistema gerará a árvore (mapa visual) formatada em paisagem.
                                        </p>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto shrink-0 flex-col sm:flex-row">
                                        <button onClick={handleSaveOrganogram} disabled={savingOrganogram} className="bg-white border border-pink-200 text-pink-700 hover:bg-pink-50 px-6 py-3 rounded-xl font-bold shadow-sm transition flex items-center justify-center gap-2">
                                            {savingOrganogram ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Salvar Dados
                                        </button>
                                        <button onClick={handlePrint} disabled={printing} className="bg-pink-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-pink-200 hover:bg-pink-700 transition flex items-center gap-2 justify-center">
                                            {printing ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />} Imprimir Organograma
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                    {/* Pastores */}
                                    <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm col-span-1 md:col-span-2 lg:col-span-3">
                                        <h4 className="text-xs font-bold text-blue-600 uppercase mb-3 border-b pb-2">Liderança Principal</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label className="text-[10px] uppercase font-bold text-gray-500">Pastor Presidente</label><input type="text" list="members-list" placeholder="Ex: Pr. João" value={organogramData.president} onChange={e => setOrganogramData({ ...organogramData, president: e.target.value })} className="w-full p-2.5 bg-gray-50 border rounded-lg mt-1" /></div>
                                            <div><label className="text-[10px] uppercase font-bold text-gray-500">Vice-Presidente / Co-Pastor</label><input type="text" list="members-list" value={organogramData.vice} onChange={e => setOrganogramData({ ...organogramData, vice: e.target.value })} className="w-full p-2.5 bg-gray-50 border rounded-lg mt-1" /></div>
                                        </div>
                                    </div>

                                    {/* Administração */}
                                    <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
                                        <h4 className="text-xs font-bold text-purple-600 uppercase mb-3 border-b pb-2">Administração</h4>
                                        <div className="space-y-3">
                                            <div><label className="text-[10px] uppercase font-bold text-gray-500">Secretaria</label><input type="text" list="members-list" value={organogramData.secretary} onChange={e => setOrganogramData({ ...organogramData, secretary: e.target.value })} className="w-full p-2.5 bg-gray-50 border rounded-lg mt-1" /></div>
                                            <div><label className="text-[10px] uppercase font-bold text-gray-500">Tesouraria</label><input type="text" list="members-list" value={organogramData.treasurer} onChange={e => setOrganogramData({ ...organogramData, treasurer: e.target.value })} className="w-full p-2.5 bg-gray-50 border rounded-lg mt-1" /></div>
                                        </div>
                                    </div>

                                    {/* Diaconato e Geral */}
                                    <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm">
                                        <h4 className="text-xs font-bold text-green-600 uppercase mb-3 border-b pb-2">Apoio Pastoral</h4>
                                        <div className="space-y-3">
                                            <div><label className="text-[10px] uppercase font-bold text-gray-500">Líder dos Diáconos</label><input type="text" list="members-list" value={organogramData.deacons} onChange={e => setOrganogramData({ ...organogramData, deacons: e.target.value })} className="w-full p-2.5 bg-gray-50 border rounded-lg mt-1" /></div>
                                            <div><label className="text-[10px] uppercase font-bold text-gray-500">Líder de Louvor</label><input type="text" list="members-list" value={organogramData.worship} onChange={e => setOrganogramData({ ...organogramData, worship: e.target.value })} className="w-full p-2.5 bg-gray-50 border rounded-lg mt-1" /></div>
                                        </div>
                                    </div>

                                    {/* Departamentos */}
                                    <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm md:col-span-2 lg:col-span-1">
                                        <h4 className="text-xs font-bold text-orange-600 uppercase mb-3 border-b pb-2">Departamentos</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                                            <div><label className="text-[10px] uppercase font-bold text-gray-500">Jovens</label><input type="text" list="members-list" value={organogramData.youth} onChange={e => setOrganogramData({ ...organogramData, youth: e.target.value })} className="w-full p-2.5 bg-gray-50 border rounded-lg mt-1" /></div>
                                            <div><label className="text-[10px] uppercase font-bold text-gray-500">Mulheres</label><input type="text" list="members-list" value={organogramData.women} onChange={e => setOrganogramData({ ...organogramData, women: e.target.value })} className="w-full p-2.5 bg-gray-50 border rounded-lg mt-1" /></div>
                                            <div><label className="text-[10px] uppercase font-bold text-gray-500">Homens / Senhores</label><input type="text" list="members-list" value={organogramData.men} onChange={e => setOrganogramData({ ...organogramData, men: e.target.value })} className="w-full p-2.5 bg-gray-50 border rounded-lg mt-1" /></div>
                                            <div><label className="text-[10px] uppercase font-bold text-gray-500">Infantil</label><input type="text" list="members-list" value={organogramData.kids} onChange={e => setOrganogramData({ ...organogramData, kids: e.target.value })} className="w-full p-2.5 bg-gray-50 border rounded-lg mt-1" /></div>
                                        </div>
                                    </div>
                                </div>

                                {/* PREVIEW VISUAL */}
                                <div className="mt-8">
                                    <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Network size={18} className="text-pink-600" /> Pré-visualização do Organograma
                                    </h4>
                                    <div className="bg-white border text-center border-gray-200 rounded-3xl p-6 overflow-x-auto custom-scrollbar shadow-inner min-h-[400px]">
                                        <style dangerouslySetInnerHTML={{
                                            __html: `
                                            .preview-tree ul { padding-top: 20px; position: relative; transition: all 0.5s; display: flex; justify-content: center; margin: 0; padding-left: 0; }
                                            .preview-tree li { float: left; text-align: center; list-style-type: none; position: relative; padding: 20px 10px 0 10px; transition: all 0.5s; }
                                            .preview-tree li::before, .preview-tree li::after{ content: ''; position: absolute; top: 0; right: 50%; border-top: 2px solid #cbd5e1; width: 50%; height: 20px; }
                                            .preview-tree li::after{ right: auto; left: 50%; border-left: 2px solid #cbd5e1; }
                                            .preview-tree li:only-child::after, .preview-tree li:only-child::before { display: none; }
                                            .preview-tree li:only-child{ padding-top: 0;}
                                            .preview-tree li:first-child::before, .preview-tree li:last-child::after{ border: 0 none; }
                                            .preview-tree li:last-child::before{ border-right: 2px solid #cbd5e1; border-radius: 0 5px 0 0; }
                                            .preview-tree li:first-child::after{ border-radius: 5px 0 0 0; }
                                            .preview-tree ul ul::before{ content: ''; position: absolute; top: 0; left: 50%; border-left: 2px solid #cbd5e1; width: 0; height: 20px; margin-left: -1px; }
                                            .preview-tree li .node-card { border: 2px solid #e2e8f0; padding: 10px 20px; text-decoration: none; color: #333; font-size: 14px; display: inline-block; border-radius: 12px; background: white; min-width: 150px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); transition: all 0.2s;}
                                            .preview-tree li .node-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
                                            .preview-tree li .node-card .role { font-weight: bold; margin-bottom: 5px; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;}
                                            .preview-tree li .node-card .name { font-weight: 800; font-size: 14px; color: #1e293b; }
                                            
                                            .preview-tree li .node-card.lvl1 { border-color: #1d4ed8; background: #eff6ff; }
                                            .preview-tree li .node-card.lvl1 .role { color: #1e3a8a; }
                                            .preview-tree li .node-card.lvl2 { border-color: #3b82f6; background: #f0f9ff; }
                                            .preview-tree li .node-card.lvl3 { border-color: #10b981; background: #ecfdf5; }
                                            .preview-tree li .node-card.lvl3 .name { color: #064e3b; }
                                            .preview-tree li .node-card.lvl4 { border-color: #e2e8f0; background: #ffffff; border-style: dashed; }
                                            .preview-tree li .node-card.lvl4 .name { color: #4338ca; }
                                        `}} />

                                        <div className="preview-tree inline-block mt-4">
                                            <ul>
                                                <li>
                                                    <div className="node-card lvl1">
                                                        <div className="role">Pastor Presidente</div>
                                                        <div className="name">{organogramData.president || 'Não informado'}</div>
                                                    </div>
                                                    <ul>
                                                        <li>
                                                            <div className="node-card lvl2">
                                                                <div className="role">Vice-Presidente</div>
                                                                <div className="name">{organogramData.vice || 'Não informado'}</div>
                                                            </div>
                                                            <ul>
                                                                <li>
                                                                    <div className="node-card lvl3">
                                                                        <div className="role">Administração</div>
                                                                        <div className="name">Secretaria & Finanças</div>
                                                                    </div>
                                                                    <ul>
                                                                        <li>
                                                                            <div className="node-card lvl4">
                                                                                <div className="role">Secretaria</div>
                                                                                <div className="name">{organogramData.secretary || '-'}</div>
                                                                            </div>
                                                                        </li>
                                                                        <li>
                                                                            <div className="node-card lvl4">
                                                                                <div className="role">Tesouraria</div>
                                                                                <div className="name">{organogramData.treasurer || '-'}</div>
                                                                            </div>
                                                                        </li>
                                                                    </ul>
                                                                </li>
                                                                <li>
                                                                    <div className="node-card lvl3">
                                                                        <div className="role">Corpo Diaconal</div>
                                                                        <div className="name">{organogramData.deacons || 'Líder dos Diáconos'}</div>
                                                                    </div>
                                                                </li>
                                                                <li>
                                                                    <div className="node-card lvl3">
                                                                        <div className="role">Departamentos</div>
                                                                        <div className="name">Ministérios</div>
                                                                    </div>
                                                                    <ul>
                                                                        <li>
                                                                            <div className="node-card lvl4"><div className="role">Louvor</div><div className="name">{organogramData.worship || '-'}</div></div>
                                                                        </li>
                                                                        <li>
                                                                            <div className="node-card lvl4"><div className="role">Jovens</div><div className="name">{organogramData.youth || '-'}</div></div>
                                                                        </li>
                                                                        <li>
                                                                            <div className="node-card lvl4"><div className="role">Mulheres</div><div className="name">{organogramData.women || '-'}</div></div>
                                                                        </li>
                                                                        <li>
                                                                            <div className="node-card lvl4"><div className="role">Homens</div><div className="name">{organogramData.men || '-'}</div></div>
                                                                        </li>
                                                                        <li>
                                                                            <div className="node-card lvl4"><div className="role">Infantil</div><div className="name">{organogramData.kids || '-'}</div></div>
                                                                        </li>
                                                                    </ul>
                                                                </li>
                                                            </ul>
                                                        </li>
                                                    </ul>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // --- MODO DOCUMENTOS ---
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                                <div className={`${selectedMember ? 'hidden md:block' : 'block'}`}>
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Selecione o Membro</label>
                                    <div className="relative mb-4"><Search className="absolute left-3 top-3 text-gray-400" size={20} /><input type="text" placeholder="Buscar membro..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 p-3 border rounded-xl bg-gray-50 focus:bg-white transition outline-none focus:ring-2 ring-blue-100" /></div>
                                    <div className="h-64 overflow-y-auto border rounded-xl p-2 custom-scrollbar bg-gray-50">{loading ? <div className="p-4 text-center"><Loader2 className="animate-spin inline" /></div> : filteredMembers.map(m => (<div key={m.id} onClick={() => setSelectedMember(m)} className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition mb-1 ${selectedMember?.id === m.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white hover:shadow-sm text-gray-700'}`}><div className={`p-2 rounded-full ${selectedMember?.id === m.id ? 'bg-white/20' : 'bg-gray-200'}`}><User size={16} /></div><span className="font-bold text-sm">{m.fullName}</span></div>))}</div>
                                </div>
                                <div className={`flex flex-col h-full ${!selectedMember ? 'hidden md:flex' : 'flex'}`}>
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 flex justify-between items-center"><span>Pré-visualização</span>{selectedMember && <button onClick={() => setSelectedMember(null)} className="md:hidden text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-lg text-xs">← Voltar</button>}</label>
                                    <div className="flex-1 bg-gray-100 rounded-xl p-4 md:p-6 border border-gray-200 flex flex-col items-center">
                                        {selectedMember ? (
                                            <div className="bg-white p-6 shadow-md w-full max-w-sm mx-auto rounded-lg text-center animate-in zoom-in border border-gray-200">
                                                <div className="flex justify-center mb-3">{logoUrl ? <img src={getDirectImageUrl(logoUrl)} alt="Logo" className="h-16 w-16 object-contain" /> : <Building2 size={32} className="text-gray-400" />}</div>
                                                <h3 className="text-sm font-bold text-gray-800 uppercase border-b pb-2 mb-3">{churchName}</h3>
                                                <div className="bg-blue-50 text-blue-800 p-2 rounded-lg mb-4 text-sm font-bold">{selectedMember.fullName}</div>

                                                <p className="text-xs text-gray-500 font-bold uppercase mb-4">
                                                    {selectedDoc === 'recommendation' ? 'CARTA DE RECOMENDAÇÃO' : selectedDoc === 'transfer' ? 'CARTA DE TRANSFERÊNCIA' : selectedDoc === 'baptism' ? 'CERTIFICADO DE BATISMO' : 'CERTIDÃO DE APRESENTAÇÃO'}
                                                </p>

                                                {selectedDoc !== 'certificate' && selectedDoc !== 'baptism' && (
                                                    <textarea placeholder="Observação extra (ex: mudou-se para Lisboa)" value={obs} onChange={e => setObs(e.target.value)} className="w-full p-2 border rounded-lg text-xs mb-4 bg-gray-50 resize-none outline-none focus:ring-1 ring-blue-300" rows={3} />
                                                )}

                                                <button onClick={handlePrint} disabled={printing} className="w-full bg-gray-900 text-white px-4 py-3 rounded-xl font-bold hover:bg-black transition shadow-lg flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-wait">
                                                    {printing ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />} {printing ? "Gerando..." : "Imprimir"}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center py-20 text-gray-400"><ShieldCheck size={40} className="mx-auto mb-2 opacity-20" /><p className="text-sm">Selecione um membro.</p></div>
                                        )}
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