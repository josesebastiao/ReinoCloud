export interface Ministry {
  id?: string;
  name: string;
  description?: string;
  churchId: string;
  leaderId?: string; // Futuramente vamos vincular quem é o líder
  createdAt?: any;
}