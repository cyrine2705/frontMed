// ── Auth ──────────────────────────────────────────────────────────────────────
export type UserRole = 'ADMIN' | 'DOCTOR' | 'PATIENT';

export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  isActive: boolean;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  user: UserResponse;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterPatientRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  birthDate: string;
  socialSecurityNumber: string;
  bloodType: string;
}

export interface RegisterAdminRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// ── Doctor ────────────────────────────────────────────────────────────────────
export interface DoctorResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialty: string;
  medicalLicenseNumber: string;
  phoneNumber?: string;
  clinicAddress?: string;
  createdAt: string;
  isActive: boolean;
}

export interface CreateDoctorRequest {
  firstName: string;
  lastName: string;
  email: string;
  specialty: string;
  medicalLicenseNumber: string;
  phoneNumber?: string;
  clinicAddress?: string;
  password?: string;
}

// ── Patient ───────────────────────────────────────────────────────────────────
export interface PatientResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  socialSecurityNumber: string;
  bloodType: string;
  createdAt: string;
  isActive: boolean;
}

// ── Appointment ───────────────────────────────────────────────────────────────
export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELED';

export interface AppointmentResponse {
  id: string;
  doctorId: string;
  patientId: string;
  dateTime: string;
  reason: string;
  status: AppointmentStatus;
  recipientEmail?: string;
  createdAt: string;
  doctor?: DoctorResponse;
  patient?: PatientResponse;
}

export interface CreateAppointmentRequest {
  doctorId: string;
  patientId: string;
  dateTime: string;
  reason: string;
  recipientEmail?: string;
}

export interface UpdateAppointmentRequest {
  doctorId?: string;
  patientId?: string;
  dateTime?: string;
  reason?: string;
  recipientEmail?: string;
}

// ── Medication ────────────────────────────────────────────────────────────────
export interface MedicationResponse {
  id: string;
  name: string;
  category: string;
  description?: string;
  laboratory?: string;
  imageUrl?: string;
}

export interface CreateMedicationRequest {
  name: string;
  category: string;
  description?: string;
  laboratory?: string;
  imageUrl?: string;
}

// ── Prescription ──────────────────────────────────────────────────────────────
export interface PrescriptionLineRequest {
  medicationId: string;
  dosage: string;
  duration: string;
}

export interface PrescriptionLineResponse {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  duration: string;
}

export interface PrescriptionResponse {
  id: string;
  doctorId: string;
  patientId: string;
  doctorNotes?: string;
  recipientEmail?: string;
  createdAt: string;
  prescriptionLines: PrescriptionLineResponse[];
  doctor?: DoctorResponse;
  patient?: PatientResponse;
}

export interface CreatePrescriptionRequest {
  doctorId: string;
  patientId: string;
  doctorNotes?: string;
  recipientEmail?: string;
  prescriptionLines: PrescriptionLineRequest[];
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export interface ChatRequest {
  message: string;
  doctorId: string;
}

export interface ChatResponse {
  reply: string;
}

// ── Admin stats (derived on frontend) ────────────────────────────────────────
export interface AdminStats {
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
}
