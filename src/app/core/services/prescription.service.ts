import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../tokens/api.token';
import { CreatePrescriptionRequest, PrescriptionResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class PrescriptionService {
  private readonly http = inject(HttpClient);
  private readonly api  = inject(API_URL);
  private readonly base = `${this.api}/v1/prescriptions`;

  create(body: CreatePrescriptionRequest): Observable<PrescriptionResponse> {
    return this.http.post<PrescriptionResponse>(this.base, body);
  }

  getAll(): Observable<PrescriptionResponse[]> {
    return this.http.get<PrescriptionResponse[]>(this.base);
  }

  getByDoctor(doctorId: string): Observable<PrescriptionResponse[]> {
    return this.http.get<PrescriptionResponse[]>(`${this.base}/doctor/${doctorId}`);
  }

  getByPatient(patientId: string): Observable<PrescriptionResponse[]> {
    return this.http.get<PrescriptionResponse[]>(`${this.base}/patient/${patientId}`);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
