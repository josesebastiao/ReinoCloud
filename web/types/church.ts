export interface Church {
  id?: string;
  name: string;
  active: boolean;
  createdAt?: any;
  
  // Configurações salvas (Moeda, etc)
  settings?: {
    currency: 'BRL' | 'AOA';
  };

  // --- AQUI ESTÁ A CORREÇÃO ---
  // Adicionamos estes campos para o admin/page.tsx parar de reclamar
  ownerId?: string; 
  plan?: string;    
}