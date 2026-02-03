"use client";
import { useState, useEffect } from "react";
import { useChurch } from "../contexts/ChurchContext";
import { postService, Post } from "../services/postService";
import { memberService } from "../services/memberService";
import { generalScaleService } from "../services/generalScaleService";
import { 
  Megaphone, Calendar, Gift, BookOpen, Clock, User, Bell 
} from "lucide-react";

export function MemberDashboard() {
  const { churchId, user } = useChurch();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [myScales, setMyScales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (churchId && user?.email) {
        loadData();
    }
  }, [churchId, user]);

  const loadData = async () => {
    // --- CORREÇÃO: Garante que o ID existe antes de buscar ---
    if (!churchId) return;

    setLoading(true);
    try {
        // 1. Carregar Mural
        const allPosts = await postService.listByChurch(churchId);
        setPosts(allPosts);

        // 2. Carregar Aniversariantes
        const members = await memberService.listByChurch(churchId);
        const currentMonth = new Date().getMonth();
        const bdays = members.filter(m => {
            if(!m.birthDate) return false;
            const parts = m.birthDate.split('-');
            const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            return d.getMonth() === currentMonth;
        }).sort((a, b) => parseInt(a.birthDate!.split('-')[2]) - parseInt(b.birthDate!.split('-')[2]));
        setBirthdays(bdays);

        // 3. MINHA ESCALA (A Mágica!)
        const me = members.find(m => m.email === user?.email);
        if (me) {
            const scalesFound: any[] = [];

            // A. Escala Geral
            const generalScales = await generalScaleService.listByChurch(churchId);
            
            // Lógica: Varrer escalas procurando o nome do membro
            generalScales.forEach((scale: any) => {
                scale.rows.forEach((row: any) => {
                    if (row.leader.includes(me.fullName) || row.preacher.includes(me.fullName) || row.music.includes(me.fullName)) {
                        scalesFound.push({
                            date: row.date,
                            event: row.event,
                            role: "Escala Geral",
                            obs: `${row.leader === me.fullName ? 'Dirigente' : ''} ${row.preacher === me.fullName ? 'Pregador' : ''} ${row.music === me.fullName ? 'Louvor' : ''}`
                        });
                    }
                });
            });

            // Ordenar escalas por data
            scalesFound.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setMyScales(scalesFound.filter(s => new Date(s.date) >= new Date())); // Só futuras
        }

    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Carregando novidades...</div>;

  const notices = posts.filter(p => p.type === 'notice' || p.type === 'event');
  const devotionals = posts.filter(p => p.type === 'devotional');

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* CABEÇALHO APP */}
      <div className="bg-blue-600 pt-8 pb-16 px-6 rounded-b-[40px] shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 flex justify-between items-center">
              <div>
                  <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Bem-vindo</p>
                  <h1 className="text-2xl font-bold text-white">Olá, {user?.displayName || "Irmão(ã)"} 👋</h1>
              </div>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white relative">
                  <Bell size={20}/>
                  {notices.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-blue-600"></span>}
              </div>
          </div>
      </div>

      <div className="px-6 -mt-8 relative z-20 space-y-6">
          
          {/* CARD: PRÓXIMA ESCALA (SE HOUVER) */}
          {myScales.length > 0 && (
              <div className="bg-white p-5 rounded-3xl shadow-xl shadow-blue-900/5 border border-blue-100 flex items-center gap-4 animate-in slide-in-from-bottom-4">
                  <div className="bg-orange-100 text-orange-600 w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0">
                      <span className="text-lg font-bold leading-none">{new Date(myScales[0].date).getDate()}</span>
                      <span className="text-[9px] uppercase font-bold">{new Date(myScales[0].date).toLocaleDateString('pt-BR', {month:'short'}).replace('.','')}</span>
                  </div>
                  <div>
                      <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-0.5">Você foi escalado!</p>
                      <h3 className="font-bold text-gray-800 text-sm">{myScales[0].event}</h3>
                      <p className="text-xs text-gray-500">{myScales[0].obs || "Participe!"}</p>
                  </div>
              </div>
          )}

          {/* DEVOCIONAL DO DIA */}
          {devotionals.length > 0 && (
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
                  <BookOpen className="absolute -bottom-4 -right-4 text-white/10 w-32 h-32"/>
                  <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold uppercase mb-3 inline-block">Palavra Pastoral</span>
                  <h3 className="text-xl font-bold mb-2">{devotionals[0].title}</h3>
                  <p className="text-sm text-purple-100 line-clamp-3 leading-relaxed">{devotionals[0].content}</p>
                  <button className="mt-4 text-xs font-bold bg-white text-purple-600 px-4 py-2 rounded-lg shadow-sm hover:bg-purple-50 transition">Ler Tudo</button>
              </div>
          )}

          {/* MURAL DE AVISOS */}
          <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Megaphone size={18} className="text-blue-600"/> Mural da Igreja
              </h2>
              <div className="space-y-3">
                  {notices.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4 italic">Nenhum aviso por enquanto.</p>
                  ) : notices.map(notice => (
                      <div key={notice.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${notice.type === 'event' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {notice.type === 'event' ? 'Evento' : 'Aviso'}
                              </span>
                              <span className="text-[10px] text-gray-400">{new Date(notice.date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <h3 className="font-bold text-gray-800 text-sm mb-1">{notice.title}</h3>
                          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{notice.content}</p>
                      </div>
                  ))}
              </div>
          </div>

          {/* ANIVERSARIANTES */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Gift size={18} className="text-pink-500"/> Aniversariantes <span className="text-xs font-normal text-gray-400">({new Date().toLocaleString('pt-BR', {month:'long'})})</span>
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {birthdays.length === 0 ? (
                      <p className="text-gray-400 text-xs italic w-full text-center">Ninguém faz aniversário este mês.</p>
                  ) : birthdays.map(m => (
                      <div key={m.id} className="min-w-[80px] flex flex-col items-center text-center">
                          <div className="w-12 h-12 rounded-full bg-gray-100 mb-2 overflow-hidden border-2 border-white shadow-sm">
                              {m.photoUrl ? <img src={m.photoUrl} className="w-full h-full object-cover"/> : <User className="w-full h-full p-2 text-gray-300"/>}
                          </div>
                          <p className="text-xs font-bold text-gray-700 truncate w-full">{m.fullName.split(' ')[0]}</p>
                          <p className="text-[10px] text-pink-500 font-bold">{m.birthDate.split('-')[2]}</p>
                      </div>
                  ))}
              </div>
          </div>

      </div>
    </div>
  );
}