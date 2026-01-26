export interface Event {
  id?: string;
  churchId: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type: 'culto' | 'reuniao' | 'visita' | 'evento';
  location?: string; // Ex: Templo, Casa do Irmão João...
  createdAt?: any;
}