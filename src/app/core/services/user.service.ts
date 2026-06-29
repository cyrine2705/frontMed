import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../tokens/api.token';
import {
  CreateDoctorRequest,
  DoctorResponse,
  PatientResponse,
  UserResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly api  = inject(API_URL);

  // ── Public ────────────────────────────────────────────────────────────────
  getPublicDoctors(): Observable<DoctorResponse[]> {
    return this.http.get<DoctorResponse[]>(`${this.api}/v1/public/doctors`);
  }

  // ── General users ──────────────────────────────────────────────────────────
  getAll(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.api}/v1/users`);
  }

  getById(userId: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.api}/v1/users/${userId}`);
  }

  // ── Doctors (admin) ────────────────────────────────────────────────────────
  createDoctor(body: CreateDoctorRequest): Observable<DoctorResponse> {
    return this.http.post<DoctorResponse>(`${this.api}/v1/admin/doctors`, body);
  }

  getDoctors(): Observable<DoctorResponse[]> {
    return this.http.get<DoctorResponse[]>(`${this.api}/v1/admin/doctors`);
  }

  getDoctorById(doctorId: string): Observable<DoctorResponse> {
    return this.http.get<DoctorResponse>(`${this.api}/v1/admin/doctors/${doctorId}`);
  }

  updateDoctor(doctorId: string, body: Partial<CreateDoctorRequest>): Observable<DoctorResponse> {
    return this.http.put<DoctorResponse>(`${this.api}/v1/admin/doctors/${doctorId}`, body);
  }

  deleteDoctor(doctorId: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/v1/admin/doctors/${doctorId}`);
  }

  // ── Patients (admin) ────────────────────────────────────────────────────────
  getPatients(): Observable<PatientResponse[]> {
    return this.http.get<PatientResponse[]>(`${this.api}/v1/admin/patients`);
  }

  getPatientById(patientId: string): Observable<PatientResponse> {
    return this.http.get<PatientResponse>(`${this.api}/v1/admin/patients/${patientId}`);
  }

  archivePatient(patientId: string): Observable<PatientResponse> {
    return this.http.patch<PatientResponse>(`${this.api}/v1/admin/patients/${patientId}/archive`, {});
  }
}
