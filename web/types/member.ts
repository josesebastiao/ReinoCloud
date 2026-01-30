export interface Member {
  id?: string;
  fullName: string;
  churchId: string;
  
  // Contato
  email?: string;
  phone?: string;
  
  // Pessoal
  document?: string;
  birthDate?: string;
  gender?: string;
  maritalStatus?: string; // <--- O erro some ao adicionar esta linha
  photoUrl?: string;      // <--- E esta linha
  
  // Eclesiástico
  baptismDate?: string;
  role?: string;
  status?: string;
  entryDate?: string;
  isTither?: boolean;
  
  // Grupos e Ministérios/Departamentos
  ministries?: string[];
  departments?: string[]; // Mantemos por compatibilidade se necessário
  
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