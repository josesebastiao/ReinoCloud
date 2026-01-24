export interface Scale {
  id?: string;
  ministryId: string;
  date: string;       // Data do evento (ex: 2023-10-20)
  title: string;      // Ex: Culto da Manhã, Culto de Santa Ceia
  description?: string;
  members: string[];  // Lista de IDs dos membros escalados
}