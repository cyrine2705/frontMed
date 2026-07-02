import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { API_URL } from '../tokens/api.token';
import {
  CreateMedicationRequest,
  MedicationAutocompleteResponse,
  MedicationResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class MedicationService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_URL);

  private readonly adminBase = `${this.api}/v1/admin/medications`;
  private readonly base = `${this.api}/v1/medications`;
  private readonly publicBase = `${this.api}/v1/public/medications`;
  private readonly publicCatalogBase = `${this.publicBase}/catalog`;
  private readonly autocompleteBase = `${this.base}/autocomplete`;

  private readonly _publicCatalog = signal<MedicationResponse[]>([]);
  private readonly _adminCatalog = signal<MedicationResponse[]>([]);
  private readonly _selectedMedication = signal<MedicationResponse | null>(null);

  readonly publicCatalog = this._publicCatalog.asReadonly();
  readonly adminCatalog = this._adminCatalog.asReadonly();
  readonly selectedMedication = this._selectedMedication.asReadonly();

  getPublicCatalog(search?: string): Observable<MedicationResponse[]> {
    return this.http
      .get<MedicationResponse[]>(this.publicCatalogBase, {
        params: this.buildOptionalParams('search', search),
      })
      .pipe(
        map((medications) => medications.map((medication) => this.normalizeMedication(medication))),
        tap((medications) => this._publicCatalog.set(medications))
      );
  }

  searchPublic(query: string): Observable<MedicationResponse[]> {
    return this.getPublicCatalog(query);
  }

  getAllPublic(): Observable<MedicationResponse[]> {
    return this.getPublicCatalog();
  }

  getPublicById(id: string): Observable<MedicationResponse> {
    return this.http
      .get<MedicationResponse>(`${this.publicCatalogBase}/${id}`)
      .pipe(
        map((medication) => this.normalizeMedication(medication)),
        tap((medication) => this._selectedMedication.set(medication))
      );
  }

  autocomplete(query: string): Observable<MedicationAutocompleteResponse[]> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return of([]);
    }

    return this.http.get<MedicationAutocompleteResponse[]>(this.autocompleteBase, {
      params: new HttpParams().set('query', trimmedQuery),
    });
  }

  getAdminCatalog(): Observable<MedicationResponse[]> {
    return this.http
      .get<MedicationResponse[]>(this.adminBase)
      .pipe(
        map((medications) => medications.map((medication) => this.normalizeMedication(medication))),
        tap((medications) => this._adminCatalog.set(medications))
      );
  }

  getAdminById(id: string): Observable<MedicationResponse> {
    return this.http
      .get<MedicationResponse>(`${this.adminBase}/${id}`)
      .pipe(
        map((medication) => this.normalizeMedication(medication)),
        tap((medication) => this._selectedMedication.set(medication))
      );
  }

  createAdmin(body: CreateMedicationRequest, imageFile?: File | null): Observable<MedicationResponse> {
    return this.http
      .post<MedicationResponse>(this.adminBase, this.buildMedicationFormData(body, imageFile))
      .pipe(
        map((medication) => this.normalizeMedication(medication)),
        tap((medication) => this.upsertAdminMedication(medication))
      );
  }

  updateAdmin(id: string, body: CreateMedicationRequest, imageFile?: File | null): Observable<MedicationResponse> {
    return this.http
      .put<MedicationResponse>(`${this.adminBase}/${id}`, this.buildMedicationFormData(body, imageFile))
      .pipe(
        map((medication) => this.normalizeMedication(medication)),
        tap((medication) => this.upsertAdminMedication(medication))
      );
  }

  deleteAdmin(id: string): Observable<void> {
    return this.http.delete<void>(`${this.adminBase}/${id}`).pipe(
      tap(() => {
        this._adminCatalog.update((medications) => medications.filter((medication) => medication.id !== id));
        this._selectedMedication.update((medication) => (medication?.id === id ? null : medication));
      })
    );
  }

  search(query: string): Observable<MedicationResponse[]> {
    return this.http
      .get<MedicationResponse[]>(`${this.base}/search`, { params: this.buildOptionalParams('query', query) })
      .pipe(map((medications) => medications.map((medication) => this.normalizeMedication(medication))));
  }

  getAll(): Observable<MedicationResponse[]> {
    return this.http
      .get<MedicationResponse[]>(this.base)
      .pipe(map((medications) => medications.map((medication) => this.normalizeMedication(medication))));
  }

  getById(id: string): Observable<MedicationResponse> {
    return this.http
      .get<MedicationResponse>(`${this.base}/${id}`)
      .pipe(map((medication) => this.normalizeMedication(medication)));
  }

  create(body: CreateMedicationRequest): Observable<MedicationResponse> {
    return this.http
      .post<MedicationResponse>(this.base, this.toMedicationPayload(body))
      .pipe(map((medication) => this.normalizeMedication(medication)));
  }

  update(id: string, body: CreateMedicationRequest): Observable<MedicationResponse> {
    return this.http
      .put<MedicationResponse>(`${this.base}/${id}`, this.toMedicationPayload(body))
      .pipe(map((medication) => this.normalizeMedication(medication)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  private buildMedicationFormData(body: CreateMedicationRequest, imageFile?: File | null): FormData {
    const formData = new FormData();
    const medicationPayload = this.toMedicationPayload(body);

    formData.append(
      'medication',
      new Blob([JSON.stringify(medicationPayload)], { type: 'application/json' })
    );

    if (imageFile) {
      formData.append('image', imageFile);
    }

    return formData;
  }

  private toMedicationPayload(body: CreateMedicationRequest): CreateMedicationRequest {
    return {
      name: body.name.trim(),
      category: body.category.trim(),
      laboratory: this.cleanOptionalString(body.laboratory),
      description: this.cleanOptionalString(body.description),
      imageUrl: this.cleanOptionalString(body.imageUrl),
    };
  }

  private buildOptionalParams(key: string, value?: string): HttpParams {
    const trimmedValue = value?.trim();
    return trimmedValue ? new HttpParams().set(key, trimmedValue) : new HttpParams();
  }

  private cleanOptionalString(value?: string): string | undefined {
    const trimmedValue = value?.trim();
    return trimmedValue ? trimmedValue : undefined;
  }

  private normalizeMedication(medication: MedicationResponse): MedicationResponse {
    const sourceImageUrl = medication.sourceImageUrl ?? medication.imageUrl;

    return {
      ...medication,
      sourceImageUrl,
      imageUrl: this.resolveUrl(sourceImageUrl),
    };
  }

  private upsertAdminMedication(medication: MedicationResponse): void {
    this._adminCatalog.update((medications) => this.replaceById(medications, medication));
    this._publicCatalog.update((medications) => this.replaceById(medications, medication));
    this._selectedMedication.set(medication);
  }

  private replaceById<T extends { id: string }>(items: T[], nextItem: T): T[] {
    const itemExists = items.some((item) => item.id === nextItem.id);
    if (!itemExists) {
      return [nextItem, ...items];
    }

    return items.map((item) => (item.id === nextItem.id ? nextItem : item));
  }

  private resolveUrl(url?: string): string | undefined {
    if (!url) {
      return undefined;
    }

    try {
      return new URL(url, this.api.endsWith('/') ? this.api : `${this.api}/`).toString();
    } catch {
      return url;
    }
  }
}
