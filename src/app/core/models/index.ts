export type UserRole = 'ADMIN' | 'DOCTOR' | 'PATIENT';
export type ProfileRole = 'DOCTOR' | 'PATIENT';

export interface UserResponse {
  id: string;
  functionalId?: string;
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

export interface DoctorResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: UserRole;
  specialty: string;
  medicalLicenseNumber: string;
  phoneNumber?: string;
  clinicAddress?: string;
  createdAt: string;
  isActive: boolean;
  profileImageUrl?: string;
  totalAppointments?: number;
  totalPrescriptions?: number;
  activePatientsCount?: number;
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

export interface PatientResponse {
  id: string;
  functionalId?: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: UserRole;
  birthDate: string;
  socialSecurityNumber?: string;
  maskedSocialSecurityNumber?: string;
  bloodType: string;
  createdAt: string;
  isActive: boolean;
  profileImageUrl?: string;
  totalAppointments?: number;
  totalPrescriptions?: number;
}

export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELED';

export interface AppointmentResponse {
  id: string;
  doctorId: string;
  patientId: string;
  startDateTime: string;
  endDateTime: string;
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
  startDateTime?: string;
  endDateTime?: string;
  dateTime?: string;
  reason: string;
  recipientEmail?: string;
}

export interface UpdateAppointmentRequest {
  doctorId?: string;
  patientId?: string;
  startDateTime?: string;
  endDateTime?: string;
  dateTime?: string;
  reason?: string;
  recipientEmail?: string;
}

export interface AppointmentStatusUpdateRequest {
  status: AppointmentStatus;
}

export interface MedicationResponse {
  id: string;
  name: string;
  category: string;
  laboratory?: string;
  description?: string;
  sourceImageUrl?: string;
  imageUrl?: string;
}

export interface MedicationAutocompleteResponse {
  id: string;
  name: string;
  category: string;
}

export interface CreateMedicationRequest {
  name: string;
  category: string;
  laboratory?: string;
  description?: string;
  imageUrl?: string;
}

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
  doctor?: PrescriptionDoctorMetadata;
  patient?: PrescriptionPatientMetadata;
}

export interface PrescriptionDoctorMetadata {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialty?: string;
  phoneNumber?: string;
  clinicAddress?: string;
  medicalLicenseNumber?: string;
  profileImageUrl?: string;
}

export interface PrescriptionPatientMetadata {
  id: string;
  functionalId?: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate?: string;
  socialSecurityNumber?: string;
  bloodType?: string;
  profileImageUrl?: string;
}

export interface PrescriptionDetailsResponse extends PrescriptionResponse {}

export interface CreatePrescriptionRequest {
  doctorId: string;
  patientId: string;
  doctorNotes?: string;
  recipientEmail?: string;
  prescriptionLines: PrescriptionLineRequest[];
}

export interface UpdatePrescriptionRequest extends CreatePrescriptionRequest {}

export type UserProfileResponse = DoctorResponse | PatientResponse;

export interface ChatRequest {
  message: string;
  doctorId: string;
}

export interface ChatResponse {
  reply: string;
}

export interface AdminStats {
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
}
