export interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  type?: string;
  resourceType?: string;
  course?: string;
  branch?: string;
  college?: string;
  university?: string;
  fileName?: string;
  fileSize?: number | string;
  fileUrl: string;
  storagePath?: string;
  storageProvider?: 'firebase' | 'supabase';
  uploaderUid?: string;
  uploadedBy?: string;
  uploaderName?: string;
  createdAt: string;
  uploadedAt?: string;
  updatedAt?: string;
  slug?: string;
  likedBy?: string[];
  savedBy?: string[];
  description?: string;
  savedAt?: string;
  lastOpenedAt?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  college?: string;
  course?: string;
  branch?: string;
  createdAt?: string;
  lastLogin?: string;
  avatar?: string;
}

export interface SearchFilters {
  category: string;
  course: string;
  univ: string;
  year: string;
}

export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt?: string;
}

export interface AktuSubject {
  name: string;
  credit: number;
}
