import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_URL } from '../tokens/api.token';
import {
  DoctorResponse,
  PatientResponse,
  ProfileRole,
  UserProfileResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_URL);

  private readonly _doctorProfile = signal<DoctorResponse | null>(null);
  private readonly _patientProfile = signal<PatientResponse | null>(null);

  readonly doctorProfile = this._doctorProfile.asReadonly();
  readonly patientProfile = this._patientProfile.asReadonly();

  getUserProfile(role: ProfileRole, userId: string): Observable<UserProfileResponse> {
    return role === 'DOCTOR'
      ? this.getDoctorProfile(userId)
      : this.getPatientProfile(userId);
  }

  getDoctorProfile(doctorId: string): Observable<DoctorResponse> {
    return this.http
      .get<DoctorResponse>(`${this.api}/v1/profile/doctors/${doctorId}`)
      .pipe(tap((doctor) => this._doctorProfile.set(doctor)));
  }

  getPatientProfile(patientId: string): Observable<PatientResponse> {
    return this.http
      .get<PatientResponse>(`${this.api}/v1/profile/patients/${patientId}`)
      .pipe(tap((patient) => this._patientProfile.set(patient)));
  }

  uploadProfileImage(
    role: ProfileRole,
    userId: string,
    imageFile: File
  ): Observable<UserProfileResponse> {
    return role === 'DOCTOR'
      ? this.uploadDoctorProfileImage(userId, imageFile)
      : this.uploadPatientProfileImage(userId, imageFile);
  }

  uploadDoctorProfileImage(doctorId: string, imageFile: File): Observable<DoctorResponse> {
    return this.http
      .post<DoctorResponse>(
        `${this.api}/v1/profile/doctors/${doctorId}/image`,
        this.buildImagePayload(imageFile)
      )
      .pipe(tap((doctor) => this._doctorProfile.set(doctor)));
  }

  uploadPatientProfileImage(patientId: string, imageFile: File): Observable<PatientResponse> {
    return this.http
      .post<PatientResponse>(
        `${this.api}/v1/profile/patients/${patientId}/image`,
        this.buildImagePayload(imageFile)
      )
      .pipe(tap((patient) => this._patientProfile.set(patient)));
  }

  clearProfiles(): void {
    this._doctorProfile.set(null);
    this._patientProfile.set(null);
  }

  private buildImagePayload(imageFile: File): FormData {
    const formData = new FormData();
    formData.append('image', imageFile);
    return formData;
  }
}
