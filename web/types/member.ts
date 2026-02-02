export interface Member {
  id?: string;
  churchId: string | null;
  fullName: string;
  email?: string;
  phone?: string;
  document?: string;     // CPF ou Identidade
  birthDate?: string;    // Data de nascimento
  baptismDate?: string;  // Data de batismo
  photoUrl?: string;
  
  gender: string | null;        // 'male' | 'female'
  maritalStatus: string | null; // 'single', 'married', etc.
  
  role: string;          // 'member', 'leader', 'secretary', 'treasurer', 'admin'
  status: string;        // 'active', 'inactive'
  
  isTither?: boolean;    // É dizimista?
  
  // Endereço
  address?: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };

  ministries?: string[]; // IDs dos ministérios
  
  // --- [NOVO] Adicione esta linha aqui: ---
  permissions?: string[]; // Lista de permissões extras (ex: ['financial', 'secretary'])
  
  createdAt?: string;
}