"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { memberService } from "../../services/memberService";
import { churchService } from "../../services/churchService";
import { Member } from "../../types/member";
import { 
  Gift, Calendar, MessageCircle, Phone, ArrowLeft, Search 
} from "lucide-react";

export default function BirthdaysPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1); // 1 = Janeiro
  const [churchName, setChurchName] = useState("Minha Igreja");

  const MONTHS = [
    { value: 1, label: "Janeiro" }, { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" }, { value: 4, label: "Abril" },
    { value: 5, label: "Maio" }, { value: 6, label: "Junho" },
    { value: 7, label: "Julho" }, { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" }, { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" }, { value: 12, label: "Dezembro" }
  ];

  useEffect(() => {
    const id = localStorage.getItem("churchId");
    if (!id) { router.push("/login"); return; }
    
    // Busca nome da igreja e membros
    churchService.getSettings(id).then(settings => {
        if(settings?.docs?.churchName) setChurchName(settings.docs.churchName);
    });

    memberService.listByChurch(id).then(lista => {
        setMembers(lista);
        setLoading(false);
    });
  }, []);

  // --- LÓGICA DE FILTRO ---
  const birthdaysList = members.filter(m => {
      if (!m.birthDate) return false;
      const [ano, mes, dia] = m.birthDate.split('-').map(Number);
      return mes === currentMonth;
  }).sort((a, b) => {
      const diaA = parseInt(a.birthDate!.split('-')[2]);
      const diaB = parseInt(b.birthDate!.split('-')[2]);
      return diaA - diaB; // Ordena por dia (1, 2, 3...)
  });

  // --- FUNÇÃO WHATSAPP ---
  const sendCongratulation = (member: Member) => {
      if (!member.phone) return alert("Este membro não tem telefone cadastrado.");
      
      // Limpa o telefone (deixa só números)
      const cleanPhone = member.phone.replace(/\D/g, '');
      
      // Texto da mensagem
      const text = `A Paz do Senhor, *${member.fullName.split(' ')[0]}*! 🎉\n\nPassando aqui em nome da *${churchName}* para te desejar um Feliz Aniversário! Que Deus continue te abençoando grandemente.\n\nFelicidades! 🎂🙏`;
      
      const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent || "",
      );
      if (isMobile) {
        window.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
  };

  // --- CÁLCULO IDADE ---
  const getAge = (dateString: string) => {
      const today = new Date();
      const birthDate = new Date(dateString);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      // Ajuste simples para o ano atual
      return age; 
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pb-24">
      
      {/* HEADER */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center gap-2 text-gray-500 cursor-pointer hover:text-blue-600 mb-4" onClick={() => router.push('/')}>
            <ArrowLeft size={20}/> Voltar para o Início
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Gift className="text-pink-500"/> Aniversariantes
                </h1>
                <p className="text-gray-500">Não deixe ninguém passar em branco!</p>
            </div>
            
            {/* SELETOR DE MÊS */}
            <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex items-center">
                <button onClick={() => setCurrentMonth(prev => prev === 1 ? 12 : prev - 1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">←</button>
                <select 
                    value={currentMonth} 
                    onChange={(e) => setCurrentMonth(Number(e.target.value))}
                    className="bg-transparent font-bold text-gray-800 text-center w-32 outline-none appearance-none cursor-pointer"
                >
                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <button onClick={() => setCurrentMonth(prev => prev === 12 ? 1 : prev + 1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">→</button>
            </div>
        </div>
      </div>

      {/* LISTA DE ANIVERSARIANTES */}
      <div className="max-w-4xl mx-auto">
          {loading ? (
              <p className="text-center text-gray-400 mt-10">Carregando festeiros...</p>
          ) : birthdaysList.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                  <Gift size={48} className="text-gray-300 mx-auto mb-4"/>
                  <p className="text-gray-500">Nenhum aniversariante em <span className="font-bold">{MONTHS[currentMonth-1].label}</span>.</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {birthdaysList.map(member => {
                      const [ano, mes, dia] = member.birthDate!.split('-');
                      const isToday = new Date().getDate() === Number(dia) && (new Date().getMonth() + 1) === currentMonth;

                      return (
                          <div key={member.id} className={`bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between group transition hover:shadow-md ${isToday ? 'border-pink-500 ring-1 ring-pink-500 bg-pink-50' : 'border-gray-100'}`}>
                              
                              <div className="flex items-center gap-4">
                                  <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-bold text-sm ${isToday ? 'bg-pink-500 text-white shadow-lg shadow-pink-200' : 'bg-gray-100 text-gray-600'}`}>
                                      <span className="text-lg leading-none">{dia}</span>
                                      <span className="text-[10px] uppercase leading-none mt-0.5">{MONTHS[currentMonth-1].label.slice(0,3)}</span>
                                  </div>
                                  
                                  <div>
                                      <h3 className="font-bold text-gray-800">{member.fullName}</h3>
                                      <p className="text-xs text-gray-500 flex items-center gap-2">
                                          {isToday && <span className="text-pink-600 font-bold animate-pulse">🎉 É HOJE!</span>}
                                          <span>• Vai fazer {new Date().getFullYear() - Number(ano)} anos</span>
                                      </p>
                                  </div>
                              </div>

                              <button 
                                onClick={() => sendCongratulation(member)}
                                className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-500 hover:text-white transition shadow-sm"
                                title="Enviar Parabéns no WhatsApp"
                              >
                                  <MessageCircle size={20} />
                              </button>

                          </div>
                      );
                  })}
              </div>
          )}
      </div>

    </div>
  );
}