export interface Member {
  id?: string;
  fullName: string;
  email: string;
  churchId: string;
  
  // Adicionei 'treasurer' aqui para podermos dar acesso à tesouraria depois
  role: 'admin' | 'pastor' | 'leader' | 'member' | 'treasurer';
  
  status: 'active' | 'inactive';
  searchKeywords?: string[]; // Para a busca funcionar
  createdAt?: any;

  // --- SEUS CAMPOS (MANTIDOS) ---
  phone: string;     // Telefone / WhatsApp
  document: string;  // CPF ou Bilhete de Identidade
  birthDate: string; // Data de Nascimento
  baptismDate: string; // Data de Batismo
  
  // Endereço (Objeto Aninhado)
  address: {
    street: string;
    number: string;
    neighborhood: string; // Bairro
    city: string;
    state: string; // Estado ou Província
    zipCode: string; // CEP (Opcional para Angola)
  };
  
  ministries: string[]; // IDs dos Ministérios que participa (como integrante)
  
  // --- NOVO CAMPO PARA A SEGURANÇA ---
  // Se o role for 'leader', aqui vai o ID do ministério que ele chefia
  leadershipId?: string; 
}