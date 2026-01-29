// ... imports (mantenha os mesmos)
import { useChurch } from "../contexts/ChurchContext";

export default function Dashboard() {
  const { churchId, churchName, userName, userRole } = useChurch(); // <--- Pegue o userRole
  // ... lógica igual ...

  // Função auxiliar para verificar permissão
  const canSee = (role: string) => {
      // Admin vê tudo
      if (userRole === 'admin') return true;
      // Tesoureiro vê Financeiro, mas não vê Membros/Secretaria
      if (userRole === 'treasurer') return role === 'treasurer';
      // Secretaria vê Membros, mas não vê Financeiro
      if (userRole === 'secretary') return role === 'secretary';
      return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      {/* ... Cabeçalho igual ... */}

      <div className="max-w-6xl mx-auto px-4 -mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        
        {/* CARD 1: MEMBRESIA (Só Admin e Secretaria veem) */}
        {(userRole === 'admin' || userRole === 'secretary') && (
            <div className="bg-white p-6 rounded-3xl ...">
                {/* ... conteúdo do card Membresia ... */}
            </div>
        )}

        {/* CARD 2: CAIXA (Só Admin e Tesoureiro veem) */}
        {(userRole === 'admin' || userRole === 'treasurer') && (
            <div className="bg-white p-6 rounded-3xl ...">
                 {/* ... conteúdo do card Caixa ... */}
            </div>
        )}

        {/* CARD 3: AGENDA (Todos veem) */}
        <div className="bg-white p-6 rounded-3xl ...">
             {/* ... conteúdo do card Agenda ... */}
        </div>

      </div>
    </div>
  );
}