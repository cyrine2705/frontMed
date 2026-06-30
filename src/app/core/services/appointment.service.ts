import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_URL } from '../tokens/api.token';
import {
  AppointmentResponse,
  AppointmentStatus,
  AppointmentStatusUpdateRequest,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
} from '../models';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly api  = inject(API_URL);
  private readonly base = `${this.api}/v1/appointments`;
  private readonly legacyDurationMinutes = 30;

  create(body: CreateAppointmentRequest): Observable<AppointmentResponse> {
    return this.http
      .post<AppointmentResponse>(this.base, this.toAppointmentPayload(body))
      .pipe(map(appointment => this.normalizeAppointment(appointment)));
  }

  getAll(): Observable<AppointmentResponse[]> {
    return this.http
      .get<AppointmentResponse[]>(this.base)
      .pipe(map(appointments => appointments.map(appointment => this.normalizeAppointment(appointment))));
  }

  getById(id: string): Observable<AppointmentResponse> {
    return this.http
      .get<AppointmentResponse>(`${this.base}/${id}`)
      .pipe(map(appointment => this.normalizeAppointment(appointment)));
  }

  getByDoctor(doctorId: string): Observable<AppointmentResponse[]> {
    return this.http
      .get<AppointmentResponse[]>(`${this.base}/doctor/${doctorId}`)
      .pipe(map(appointments => appointments.map(appointment => this.normalizeAppointment(appointment))));
  }

  getByDoctorRange(doctorId: string, startDateTime: string, endDateTime: string): Observable<AppointmentResponse[]> {
    const params = new HttpParams()
      .set('start', this.toLocalDateTimeString(startDateTime))
      .set('end', this.toLocalDateTimeString(endDateTime));

    return this.http
      .get<AppointmentResponse[]>(`${this.base}/doctor/${doctorId}`, { params })
      .pipe(map(appointments => appointments.map(appointment => this.normalizeAppointment(appointment))));
  }

  getByPatient(patientId: string): Observable<AppointmentResponse[]> {
    return this.http
      .get<AppointmentResponse[]>(`${this.base}/patient/${patientId}`)
      .pipe(map(appointments => appointments.map(appointment => this.normalizeAppointment(appointment))));
  }

  update(id: string, body: UpdateAppointmentRequest): Observable<AppointmentResponse> {
    return this.http
      .put<AppointmentResponse>(`${this.base}/${id}`, this.toAppointmentPayload(body))
      .pipe(map(appointment => this.normalizeAppointment(appointment)));
  }

  updateStatus(id: string, status: AppointmentStatus): Observable<AppointmentResponse> {
    const body: AppointmentStatusUpdateRequest = { status };
    return this.http
      .patch<AppointmentResponse>(`${this.base}/${id}/status`, body)
      .pipe(map(appointment => this.normalizeAppointment(appointment)));
  }

  cancel(id: string): Observable<AppointmentResponse> {
    return this.updateStatus(id, 'CANCELED');
  }

  complete(id: string): Observable<AppointmentResponse> {
    return this.updateStatus(id, 'COMPLETED');
  }

  private normalizeAppointment(appointment: AppointmentResponse): AppointmentResponse {
    const startDateTime = appointment.startDateTime ?? appointment.dateTime ?? '';
    const endDateTime = appointment.endDateTime ?? appointment.dateTime ?? '';

    return {
      ...appointment,
      startDateTime,
      endDateTime,
      dateTime: startDateTime,
    };
  }

  private toAppointmentPayload(body: CreateAppointmentRequest | UpdateAppointmentRequest): Record<string, unknown> {
    const rawStartDateTime = body.startDateTime ?? body.dateTime;
    const rawEndDateTime = body.endDateTime ?? this.addMinutes(rawStartDateTime, this.legacyDurationMinutes);
    const { dateTime, ...rest } = body;

    return {
      ...rest,
      startDateTime: rawStartDateTime ? this.toLocalDateTimeString(rawStartDateTime) : undefined,
      endDateTime: rawEndDateTime ? this.toLocalDateTimeString(rawEndDateTime) : undefined,
    };
  }

  private addMinutes(value: string | undefined, minutes: number): string | undefined {
    if (!value) {
      return undefined;
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    parsedDate.setMinutes(parsedDate.getMinutes() + minutes);
    return this.formatLocalDate(parsedDate);
  }

  private toLocalDateTimeString(value: string): string {
    const localDateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;
    if (localDateTimePattern.test(value)) {
      return value.length === 16 ? `${value}:00` : value;
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return this.formatLocalDate(parsedDate);
  }

  private formatLocalDate(value: Date): string {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    const hours = `${value.getHours()}`.padStart(2, '0');
    const minutes = `${value.getMinutes()}`.padStart(2, '0');
    const seconds = `${value.getSeconds()}`.padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }
}
