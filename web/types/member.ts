export interface Member {
  id?: string;
  fullName: string;
  email: string;
  churchId: string;
  role: 'admin' | 'pastor' | 'leader' | 'member' | 'treasurer' | 'secretary';
  status: 'active' | 'inactive';
  
  // --- NOVO CAMPO ---
  gender?: 'male' | 'female';
  // ------------------

  searchKeywords?: string[];
  createdAt?: any;
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