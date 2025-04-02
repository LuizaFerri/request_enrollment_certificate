export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  course?: string;
}

export interface VerifyEnrollmentResponse {
  isEnrolled: boolean;
  studentInfo: {
    id: number;
    name: string;
    fullName: string;
    email: string;
    course: string;
    cpf: string;
    rg: string;
    phone: string;
  } | null;
  error?: string;
}

export interface Turma {
  id: number;
  name: string;
  course: string;
  enrollment_id: number;
  duracao_meses: number;
  periodo: string;
  data_inicio: Date;
}

export interface DocumentStatus {
  isApproved: boolean;
  hasPending: boolean;
  hasRejected: boolean;
  missingDocs: string[];
  pendingDocs: string[];
  rejectedDocs: string[];
}

export interface CheckDocumentsResponse {
  canRequest: boolean;
  documentStatus: DocumentStatus;
  error?: string;
}

export interface CertificateRequestData {
  studentId: number;
  email: string;
  turmaId: number;
  fullName: string;
  phoneNumber: string;
  rg: string;
  cpf: string;
  purpose: string;
  courseModality: 'formacao' | 'especializacao';
  additionalNotes?: string;
  course: string;
  turma: string;
  requestDate: Date;
  turmaInfo: {
    periodo: string;
    data_inicio: Date;
    duracao_meses: number;
  };
}

export interface CertificateRequest {
  studentId: number;
  email: string;
  turmaId: number;
  requestDate: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
} 