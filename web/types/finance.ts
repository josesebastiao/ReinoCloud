export interface Transaction {
  id?: string;
  churchId: string;
  description: string;       // Ex: Conta de Luz, Dízimo do José
  amount: number;            // Valor (em Kz ou R$)
  type: 'income' | 'expense'; // Entrada ou Saída
  category: string;          // Dízimo, Oferta, Manutenção, Eventos
  date: string;              // Data do pagamento
  memberId?: string;         // Se for dízimo, vincula ao membro
  createdAt?: any;
}