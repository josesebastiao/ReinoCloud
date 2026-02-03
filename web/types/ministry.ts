export interface Ministry {
  id?: string;
  name: string;
  description?: string;
  churchId: string;
  leaderId?: string | null; // <--- ADICIONE ESTA LINHA
}