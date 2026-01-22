export type MemberStatus = 'active' | 'inactive' | 'disciplined' | 'moved';
export type MemberRole = 'visitor' | 'member' | 'leader' | 'pastor' | 'admin';

export interface Member {
  id?: string;
  fullName: string;
  searchKeywords: string[];
  photoUrl?: string;
  email: string;
  phone: string;
  address: {
    street: string;
    district: string;
    city: string;
    state: string;
    zipCode: string;
  };
  birthDate: string;
  gender: 'M' | 'F';
  maritalStatus: string;
  profession?: string;
  role: MemberRole;
  status: MemberStatus;
  baptismDate?: string;
  conversionDate?: string;
  ministries: string[];
  churchId: string;
  createdAt: any;
}