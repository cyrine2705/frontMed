import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../tokens/api.token';
import { CreateMedicationRequest, MedicationResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class MedicationService {
  private readonly http = inject(HttpClient);
  private readonly api  = inject(API_URL);

  searchPublic(query: string): Observable<MedicationResponse[]> {
    return this.http.get<MedicationResponse[]>(`${this.api}/v1/public/medications/search`, {
      params: { query },
    });
  }

  getAllPublic(): Observable<MedicationResponse[]> {
    return this.http.get<MedicationResponse[]>(`${this.api}/v1/public/medications`);
  }

  search(query: string): Observable<MedicationResponse[]> {
    return this.http.get<MedicationResponse[]>(`${this.api}/v1/medications/search`, {
      params: { query },
    });
  }

  getAll(): Observable<MedicationResponse[]> {
    return this.http.get<MedicationResponse[]>(`${this.api}/v1/medications`);
  }

  create(body: CreateMedicationRequest): Observable<MedicationResponse> {
    return this.http.post<MedicationResponse>(`${this.api}/v1/medications`, body);
  }

  update(id: string, body: CreateMedicationRequest): Observable<MedicationResponse> {
    return this.http.put<MedicationResponse>(`${this.api}/v1/medications/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/v1/medications/${id}`);
  }
}
