export interface Member {
  id?: string;
  fullName: string;
  churchId: string;
  
  // Campos Opcionais
  role?: string;
  status?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  document?: string;
  baptismDate?: string;
  photoUrl?: string;
  entryDate?: string;
  
  // --- A CORREÇÃO MÁGICA ---
  // Aceita string (texto simples) OU objeto (complexo) OU any
  // Isso resolve o conflito de tipos de uma vez por todas.
  address?: string | any; 
  
  city?: string;
  ministries?: string[];
  leadershipId?: string;
  
  // Campos extras de legado
  searchKeywords?: string[];
  createdAt?: any;
  gender?: 'male' | 'female' | string;

  isTither?: boolean;
}