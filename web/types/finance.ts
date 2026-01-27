export interface Transaction {
  id?: string;
  churchId: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  createdAt?: any;
}