export interface Member {
  id?: string;
  fullName: string; // Nome é obrigatório
  churchId: string; // ID da igreja é obrigatório
  
  // Tudo abaixo virou opcional (?) para evitar erro de build
  // se o cadastro estiver incompleto no banco de dados.
  
  email?: string; 
  role?: 'admin' | 'pastor' | 'leader' | 'member' | 'treasurer' | 'secretary' | string;
  status?: 'active' | 'inactive' | string;
  
  gender?: 'male' | 'female';
  searchKeywords?: string[];
  createdAt?: any;
  
  phone?: string;
  document?: string;
  birthDate?: string;
  baptismDate?: string;
  
  // Endereço também opcional
  address?: {
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  
  ministries?: string[];
  leadershipId?: string; 
}