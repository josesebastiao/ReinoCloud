export interface Member {
  id?: string;
  churchId: string;
  fullName: string;
  
  // Contato
  email?: string;
  phone?: string;
  
  // Pessoal
  document?: string;
  birthDate?: string;
  gender?: string;
  maritalStatus?: string; // <--- O erro no build acontece pela falta desta linha
  photoUrl?: string;      // <--- Adicione esta também para garantir
  
  // Eclesiástico
  baptismDate?: string;
  role?: string;
  status?: string;
  entryDate?: string;
  isTither?: boolean;
  
  // Grupos e Ministérios
  ministries?: string[];
  departments?: string[]; // Mantemos para compatibilidade
  
  // Endereço Completo
  address?: {
      street: string;
      number: string;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
  };
}