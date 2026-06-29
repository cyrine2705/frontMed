import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../tokens/api.token';
import {
  AppointmentResponse,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
} from '../models';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly api  = inject(API_URL);
  private readonly base = `${this.api}/v1/appointments`;

  create(body: CreateAppointmentRequest): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(this.base, body);
  }

  getAll(): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>(this.base);
  }

  getById(id: string): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(`${this.base}/${id}`);
  }

  getByDoctor(doctorId: string): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>(`${this.base}/doctor/${doctorId}`);
  }

  getByPatient(patientId: string): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>(`${this.base}/patient/${patientId}`);
  }

  update(id: string, body: UpdateAppointmentRequest): Observable<AppointmentResponse> {
    return this.http.put<AppointmentResponse>(`${this.base}/${id}`, body);
  }

  cancel(id: string): Observable<AppointmentResponse> {
    return this.http.patch<AppointmentResponse>(`${this.base}/${id}/cancel`, {});
  }

  complete(id: string): Observable<AppointmentResponse> {
    return this.http.patch<AppointmentResponse>(`${this.base}/${id}/complete`, {});
  }
}
