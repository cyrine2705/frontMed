import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { API_URL } from '../tokens/api.token';
import {
  CreatePrescriptionRequest,
  PrescriptionLineResponse,
  PrescriptionResponse,
  UpdatePrescriptionRequest,
} from '../models';

interface RawPrescriptionLineResponse {
  id?: string;
  medicationId: string;
  medicationName?: string;
  dosage: string;
  duration: string;
}

interface RawPrescriptionResponse extends Omit<PrescriptionResponse, 'prescriptionLines'> {
  prescriptionLines?: RawPrescriptionLineResponse[];
}

@Injectable({ providedIn: 'root' })
export class PrescriptionService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_URL);
  private readonly base = `${this.api}/v1/prescriptions`;

  private readonly _doctorPrescriptions = signal<PrescriptionResponse[]>([]);
  private readonly _patientPrescriptions = signal<PrescriptionResponse[]>([]);
  private readonly _selectedPrescription = signal<PrescriptionResponse | null>(null);

  readonly doctorPrescriptions = this._doctorPrescriptions.asReadonly();
  readonly patientPrescriptions = this._patientPrescriptions.asReadonly();
  readonly selectedPrescription = this._selectedPrescription.asReadonly();

  create(body: CreatePrescriptionRequest): Observable<PrescriptionResponse> {
    return this.http
      .post<RawPrescriptionResponse>(this.base, this.toPrescriptionPayload(body))
      .pipe(
        map((prescription) => this.normalizePrescription(prescription)),
        tap((prescription) => this.upsertPrescriptionState(prescription))
      );
  }

  update(id: string, body: UpdatePrescriptionRequest): Observable<PrescriptionResponse> {
    return this.http
      .put<RawPrescriptionResponse>(`${this.base}/${id}`, this.toPrescriptionPayload(body))
      .pipe(
        map((prescription) => this.normalizePrescription(prescription)),
        tap((prescription) => this.upsertPrescriptionState(prescription))
      );
  }

  getAll(): Observable<PrescriptionResponse[]> {
    return this.http
      .get<RawPrescriptionResponse[]>(this.base)
      .pipe(map((prescriptions) => prescriptions.map((prescription) => this.normalizePrescription(prescription))));
  }

  getById(id: string): Observable<PrescriptionResponse> {
    return this.http
      .get<RawPrescriptionResponse>(`${this.base}/${id}`)
      .pipe(
        map((prescription) => this.normalizePrescription(prescription)),
        tap((prescription) => this._selectedPrescription.set(prescription))
      );
  }

  getDetails(id: string): Observable<PrescriptionResponse> {
    return this.http
      .get<RawPrescriptionResponse>(`${this.base}/${id}/details`)
      .pipe(
        map((prescription) => this.normalizePrescription(prescription)),
        tap((prescription) => this._selectedPrescription.set(prescription))
      );
  }

  getByDoctor(doctorId: string): Observable<PrescriptionResponse[]> {
    return this.http
      .get<RawPrescriptionResponse[]>(`${this.base}/doctor/${doctorId}`)
      .pipe(
        map((prescriptions) => prescriptions.map((prescription) => this.normalizePrescription(prescription))),
        tap((prescriptions) => this._doctorPrescriptions.set(prescriptions))
      );
  }

  getByPatient(patientId: string): Observable<PrescriptionResponse[]> {
    return this.http
      .get<RawPrescriptionResponse[]>(`${this.base}/patient/${patientId}`)
      .pipe(
        map((prescriptions) => prescriptions.map((prescription) => this.normalizePrescription(prescription))),
        tap((prescriptions) => this._patientPrescriptions.set(prescriptions))
      );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      tap(() => {
        this._doctorPrescriptions.update((prescriptions) =>
          prescriptions.filter((prescription) => prescription.id !== id)
        );
        this._patientPrescriptions.update((prescriptions) =>
          prescriptions.filter((prescription) => prescription.id !== id)
        );
        this._selectedPrescription.update((prescription) => (prescription?.id === id ? null : prescription));
      })
    );
  }

  private toPrescriptionPayload(
    body: CreatePrescriptionRequest | UpdatePrescriptionRequest
  ): CreatePrescriptionRequest | UpdatePrescriptionRequest {
    return {
      doctorId: body.doctorId.trim(),
      patientId: body.patientId.trim(),
      doctorNotes: this.cleanOptionalString(body.doctorNotes),
      recipientEmail: this.cleanOptionalString(body.recipientEmail),
      prescriptionLines: body.prescriptionLines.map((line) => ({
        medicationId: line.medicationId.trim(),
        dosage: line.dosage.trim(),
        duration: line.duration.trim(),
      })),
    };
  }

  private normalizePrescription(prescription: RawPrescriptionResponse): PrescriptionResponse {
    return {
      ...prescription,
      doctorNotes: this.cleanOptionalString(prescription.doctorNotes),
      recipientEmail: this.cleanOptionalString(prescription.recipientEmail),
      prescriptionLines: (prescription.prescriptionLines ?? []).map((line, index) =>
        this.normalizePrescriptionLine(prescription.id, line, index)
      ),
    };
  }

  private normalizePrescriptionLine(
    prescriptionId: string,
    line: RawPrescriptionLineResponse,
    index: number
  ): PrescriptionLineResponse {
    return {
      id: line.id ?? `${prescriptionId}-${index}-${line.medicationId}`,
      medicationId: line.medicationId,
      medicationName: this.cleanOptionalString(line.medicationName) ?? line.medicationId,
      dosage: line.dosage,
      duration: line.duration,
    };
  }

  private upsertPrescriptionState(prescription: PrescriptionResponse): void {
    this._doctorPrescriptions.update((prescriptions) => this.replaceById(prescriptions, prescription));
    this._patientPrescriptions.update((prescriptions) => this.replaceById(prescriptions, prescription));
    this._selectedPrescription.set(prescription);
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
