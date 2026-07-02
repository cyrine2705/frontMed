import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
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
  private readonly api = inject(API_URL);

  private readonly _publicDoctors = signal<DoctorResponse[]>([]);
  private readonly _adminDoctors = signal<DoctorResponse[]>([]);
  private readonly _patients = signal<PatientResponse[]>([]);
  private readonly _selectedDoctor = signal<DoctorResponse | null>(null);
  private readonly _selectedPatient = signal<PatientResponse | null>(null);

  readonly publicDoctors = this._publicDoctors.asReadonly();
  readonly adminDoctors = this._adminDoctors.asReadonly();
  readonly patients = this._patients.asReadonly();
  readonly selectedDoctor = this._selectedDoctor.asReadonly();
  readonly selectedPatient = this._selectedPatient.asReadonly();

  getPublicDoctors(search?: string, specialty?: string): Observable<DoctorResponse[]> {
    return this.http
      .get<DoctorResponse[]>(`${this.api}/v1/public/doctors`, {
        params: this.buildDoctorQueryParams(search, specialty),
      })
      .pipe(tap((doctors) => this._publicDoctors.set(doctors)));
  }

  getPublicDoctorById(doctorId: string): Observable<DoctorResponse> {
    return this.http
      .get<DoctorResponse>(`${this.api}/v1/public/doctors/${doctorId}`)
      .pipe(tap((doctor) => this._selectedDoctor.set(doctor)));
  }

  getAll(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.api}/v1/users`);
  }

  getById(userId: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.api}/v1/users/${userId}`);
  }

  createDoctor(body: CreateDoctorRequest): Observable<DoctorResponse> {
    return this.http
      .post<DoctorResponse>(`${this.api}/v1/admin/doctors`, this.normalizeDoctorPayload(body))
      .pipe(tap((doctor) => this.upsertDoctorState(doctor)));
  }

  getDoctors(): Observable<DoctorResponse[]> {
    return this.http
      .get<DoctorResponse[]>(`${this.api}/v1/admin/doctors`)
      .pipe(tap((doctors) => this._adminDoctors.set(doctors)));
  }

  getDoctorById(doctorId: string): Observable<DoctorResponse> {
    return this.http
      .get<DoctorResponse>(`${this.api}/v1/admin/doctors/${doctorId}`)
      .pipe(tap((doctor) => this._selectedDoctor.set(doctor)));
  }

  getDoctorProfile(doctorId: string): Observable<DoctorResponse> {
    return this.http
      .get<DoctorResponse>(`${this.api}/v1/admin/doctors/${doctorId}/profile`)
      .pipe(tap((doctor) => this._selectedDoctor.set(doctor)));
  }

  getDoctorSummary(doctorId: string): Observable<DoctorResponse> {
    return this.http
      .get<DoctorResponse>(`${this.api}/v1/admin/doctors/${doctorId}/summary`)
      .pipe(tap((doctor) => this._selectedDoctor.set(doctor)));
  }

  updateDoctor(doctorId: string, body: Partial<CreateDoctorRequest>): Observable<DoctorResponse> {
    return this.http
      .put<DoctorResponse>(`${this.api}/v1/admin/doctors/${doctorId}`, this.normalizeDoctorPayload(body))
      .pipe(tap((doctor) => this.upsertDoctorState(doctor)));
  }

  deleteDoctor(doctorId: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/v1/admin/doctors/${doctorId}`).pipe(
      tap(() => {
        this._adminDoctors.update((doctors) => doctors.filter((doctor) => doctor.id !== doctorId));
        this._selectedDoctor.update((doctor) => (doctor?.id === doctorId ? null : doctor));
      })
    );
  }

  getPatients(): Observable<PatientResponse[]> {
    return this.http
      .get<PatientResponse[]>(`${this.api}/v1/admin/patients`)
      .pipe(tap((patients) => this._patients.set(patients)));
  }

  getPatientById(patientId: string): Observable<PatientResponse> {
    return this.http
      .get<PatientResponse>(`${this.api}/v1/admin/patients/${patientId}`)
      .pipe(tap((patient) => this._selectedPatient.set(patient)));
  }

  getPatientProfile(patientId: string): Observable<PatientResponse> {
    return this.http
      .get<PatientResponse>(`${this.api}/v1/admin/patients/${patientId}/profile`)
      .pipe(tap((patient) => this._selectedPatient.set(patient)));
  }

  getPatientSummary(patientId: string): Observable<PatientResponse> {
    return this.http
      .get<PatientResponse>(`${this.api}/v1/admin/patients/${patientId}/summary`)
      .pipe(tap((patient) => this._selectedPatient.set(patient)));
  }

  archivePatient(patientId: string): Observable<PatientResponse> {
    return this.http
      .patch<PatientResponse>(`${this.api}/v1/admin/patients/${patientId}/archive`, {})
      .pipe(tap((patient) => this.upsertPatientState(patient)));
  }

  unarchivePatient(patientId: string): Observable<PatientResponse> {
    return this.http
      .patch<PatientResponse>(`${this.api}/v1/admin/patients/${patientId}/unarchive`, {})
      .pipe(tap((patient) => this.upsertPatientState(patient)));
  }

  private buildDoctorQueryParams(search?: string, specialty?: string): HttpParams {
    let params = new HttpParams();
    const normalizedSearch = this.cleanOptionalString(search);
    const normalizedSpecialty = this.cleanOptionalString(specialty);

    if (normalizedSearch) {
      params = params.set('search', normalizedSearch);
    }

    if (normalizedSpecialty) {
      params = params.set('specialty', normalizedSpecialty);
    }

    return params;
  }

  private normalizeDoctorPayload(body: Partial<CreateDoctorRequest>): Partial<CreateDoctorRequest> {
    return {
      firstName: this.cleanOptionalString(body.firstName),
      lastName: this.cleanOptionalString(body.lastName),
      email: this.cleanOptionalString(body.email),
      specialty: this.cleanOptionalString(body.specialty),
      medicalLicenseNumber: this.cleanOptionalString(body.medicalLicenseNumber),
      phoneNumber: this.cleanOptionalString(body.phoneNumber),
      clinicAddress: this.cleanOptionalString(body.clinicAddress),
      password: this.cleanOptionalString(body.password),
    };
  }

  private upsertDoctorState(doctor: DoctorResponse): void {
    this._adminDoctors.update((doctors) => this.replaceById(doctors, doctor));
    this._publicDoctors.update((doctors) => this.replaceById(doctors, doctor));
    this._selectedDoctor.set(doctor);
  }

  private upsertPatientState(patient: PatientResponse): void {
    this._patients.update((patients) => this.replaceById(patients, patient));
    this._selectedPatient.set(patient);
  }

  private replaceById<T extends { id: string }>(items: T[], nextItem: T): T[] {
    const itemExists = items.some((item) => item.id === nextItem.id);
    if (!itemExists) {
      return [nextItem, ...items];
    }

    return items.map((item) => (item.id === nextItem.id ? nextItem : item));
  }

  private cleanOptionalString(value?: string): string | undefined {
    const trimmedValue = value?.trim();
    return trimmedValue ? trimmedValue : undefined;
  }
}
