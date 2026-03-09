export interface Transaction {
  id?: string;
  churchId: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;

  // CORREÇÃO: Adicionei "| null" para permitir valores vazios
  category: string;
  memberId?: string | null;
  memberName?: string | null;
  isFixed?: boolean;

  createdAt?: any;
}