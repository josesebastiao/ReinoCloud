export interface Transaction {
  id?: string;
  churchId: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  
  // NOVOS CAMPOS DETALHADOS
  category: string;        // Ex: "Dízimo", "Oferta", "Bazar", "Aluguel"
  memberId?: string;       // ID do membro (Opcional, só para Dízimos)
  memberName?: string;     // Nome do membro (Para facilitar a leitura)
  
  createdAt?: any;
}