export type ChurchPlan = 'free' | 'basic' | 'premium';

export interface Church {
  id?: string;
  name: string;
  slug: string; // ex: 'igreja-batista-central' (usado na URL ou ID interno)
  document?: string; // CNPJ
  
  // Contato do responsável (Pastor ou Admin da Igreja)
  adminEmail: string;
  phone?: string;

  // Dados do SaaS
  plan: ChurchPlan;
  active: boolean; // Se false, ninguém dessa igreja consegue logar (bloqueio)
  maxMembers: number; // Limite do plano
  
  createdAt: any;
}