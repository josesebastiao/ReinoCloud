export interface Member {
  id?: string;
  fullName: string;
  email: string;
  churchId: string;
  role: 'admin' | 'pastor' | 'leader' | 'member';
  status: 'active' | 'inactive';
  searchKeywords?: string[]; // Para a busca funcionar
  createdAt?: any;

  // --- NOVOS CAMPOS ---
  phone: string;     // Telefone / WhatsApp
  document: string;  // CPF ou Bilhete de Identidade
  birthDate: string; // Data de Nascimento
  baptismDate: string; // Data de Batismo
  
  // Endereço
  address: {
    street: string;
    number: string;
    neighborhood: string; // Bairro
    city: string;
    state: string; // Estado ou Província
    zipCode: string; // CEP (Opcional para Angola)
  };
  
  ministries: string[]; // Ministérios que participa
}