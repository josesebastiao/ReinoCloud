export interface Member {
  id?: string;
  fullName: string;
  email: string;
  churchId: string;
  
  // ADICIONADO: 'secretary'
  role: 'admin' | 'pastor' | 'leader' | 'member' | 'treasurer' | 'secretary';
  
  status: 'active' | 'inactive';
  searchKeywords?: string[];
  createdAt?: any;

  // Seus campos personalizados
  phone: string;
  document: string;
  birthDate: string;
  baptismDate: string;
  
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  
  ministries: string[];
  leadershipId?: string; 
}