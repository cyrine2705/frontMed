import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppointmentService } from '../../../core/services/appointment.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentResponse, PatientResponse } from '../../../core/models';
import { toLocalDateTimeString, todayDate } from '../../../core/utils/datetime.util';

@Component({
  selector: 'app-doctor-appointments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, DatePipe,
    MatButtonModule, MatCardModule, MatDatepickerModule,
    MatFormFieldModule, MatIconModule, MatInputModule,
    MatTableModule, MatTooltipModule,
  ],
  template: `
    <div class="page">
      <header class="page__header">
        <div class="page__header-row">
          <div>
            <h1>Appointments</h1>
            <p>Schedule and manage patient appointments</p>
          </div>
          <button mat-flat-button color="primary" (click)="showForm.set(!showForm())">
            <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon>
            {{ showForm() ? 'Cancel' : 'New appointment' }}
          </button>
        </div>
      </header>

      @if (showForm()) {
        <mat-card class="form-card">
          <mat-card-content>
            <h2 class="form-section-title">New appointment</h2>
            <form [formGroup]="form" (ngSubmit)="submit()" class="appt-form">

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Patient ID</mat-label>
                <input matInput formControlName="patientId"
                       placeholder="Enter patient UUID">
                @if (form.get('patientId')?.invalid && form.get('patientId')?.touched) {
                  <mat-error>Required</mat-error>
                }
              </mat-form-field>

              <div class="appt-form__row">
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>Date</mat-label>
                  <input matInput [matDatepicker]="picker"
                         formControlName="date" [min]="minDate">
                  <mat-datepicker-toggle matIconSuffix [for]="picker" />
                  <mat-datepicker #picker />
                  @if (form.get('date')?.invalid && form.get('date')?.touched) {
                    <mat-error>Future date required</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>Time</mat-label>
                  <input matInput type="time" formControlName="time">
                  @if (form.get('time')?.invalid && form.get('time')?.touched) {
                    <mat-error>Required</mat-error>
                  }
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Reason</mat-label>
                <input matInput formControlName="reason">
                @if (form.get('reason')?.invalid && form.get('reason')?.touched) {
                  <mat-error>Required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Notification email (optional)</mat-label>
                <input matInput type="email" formControlName="recipientEmail">
              </mat-form-field>

              @if (formError()) {
                <div class="form-error">{{ formError() }}</div>
              }

              <div class="appt-form__actions">
                <button mat-stroked-button type="button" (click)="showForm.set(false)">Cancel</button>
                <button mat-flat-button color="primary" type="submit" [disabled]="saving()">
                  {{ saving() ? 'Scheduling…' : 'Schedule' }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      <mat-card class="table-card">
        <table mat-table [dataSource]="appointments()">
          <ng-container matColumnDef="dateTime">
            <th mat-header-cell *matHeaderCellDef>Date & time</th>
            <td mat-cell *matCellDef="let a">
              {{ formatDateTime(a.dateTime) }}
            </td>
          </ng-container>

          <ng-container matColumnDef="patient">
            <th mat-header-cell *matHeaderCellDef>Patient</th>
            <td mat-cell *matCellDef="let a">
              {{ a.patient ? a.patient.firstName + ' ' + a.patient.lastName : a.patientId }}
            </td>
          </ng-container>

          <ng-container matColumnDef="reason">
            <th mat-header-cell *matHeaderCellDef>Reason</th>
            <td mat-cell *matCellDef="let a">{{ a.reason }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let a">
              <span class="badge"
                    [class.badge--blue]="a.status === 'SCHEDULED'"
                    [class.badge--green]="a.status === 'COMPLETED'"
                    [class.badge--red]="a.status === 'CANCELED'">
                {{ a.status }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let a">
              @if (a.status === 'SCHEDULED') {
                <button mat-icon-button color="primary"
                        matTooltip="Complete"
                        (click)="complete(a.id)">
                  <mat-icon>check_circle</mat-icon>
                </button>
                <button mat-icon-button color="warn"
                        matTooltip="Cancel"
                        (click)="cancel(a.id)">
                  <mat-icon>cancel</mat-icon>
                </button>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>

        @if (appointments().length === 0 && !loading()) {
          <div class="table-empty">No appointments yet.</div>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .page__header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .form-card {
      margin-bottom: 16px;
    }

    .form-section-title {
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--color-text-1);
    }

    .appt-form {
      display: flex;
      flex-direction: column;
      gap: 12px;

      &__row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      &__actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 4px;
      }
    }

    .form-error {
      background: #fee2e2;
      color: var(--color-danger);
      border-radius: var(--radius-md);
      padding: 10px 14px;
      font-size: 13px;
    }

    .table-card {
      overflow: hidden;
      table { width: 100%; }
    }

    .table-empty {
      padding: 32px;
      text-align: center;
      color: var(--color-text-3);
      font-size: 14px;
    }

    th.mat-mdc-header-cell, td.mat-mdc-cell {
      padding: 12px 16px !important;
      font-size: 13px;
    }

    th.mat-mdc-header-cell {
      color: var(--color-text-2);
      font-weight: 600;
    }
  `],
})
export class DoctorAppointmentsComponent implements OnInit {
  private readonly fb      = inject(FormBuilder);
  private readonly apptSvc = inject(AppointmentService);
  private readonly auth    = inject(AuthService);

  readonly columns      = ['dateTime', 'patient', 'reason', 'status', 'actions'];
  readonly appointments = signal<AppointmentResponse[]>([]);
  readonly showForm     = signal(false);
  readonly loading      = signal(false);
  readonly saving       = signal(false);
  readonly formError    = signal('');
  readonly minDate      = todayDate();

  readonly form = this.fb.nonNullable.group({
    patientId:      ['', Validators.required],
    date:           [null as Date | null, Validators.required],
    time:           ['08:00', Validators.required],
    reason:         ['', Validators.required],
    recipientEmail: [''],
  });

  ngOnInit(): void {
    this.loadAppointments();
  }

  private loadAppointments(): void {
    this.loading.set(true);
    const doctorId = this.auth.currentUser()!.id;
    this.apptSvc.getByDoctor(doctorId).subscribe({
      next: (list) => {
        this.appointments.set(list.sort((a, b) =>
          new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
        ));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.formError.set('');

    const raw = this.form.getRawValue();
    const dateTime = toLocalDateTimeString(raw.date!, raw.time);

    this.apptSvc.create({
      doctorId:       this.auth.currentUser()!.id,
      patientId:      raw.patientId,
      dateTime,
      reason:         raw.reason,
      recipientEmail: raw.recipientEmail || undefined,
    }).subscribe({
      next: (a) => {
        this.appointments.update(list => [a, ...list]);
        this.form.reset({ time: '08:00' });
        this.showForm.set(false);
        this.saving.set(false);
      },
      error: (err) => {
        this.formError.set(err.error?.message ?? 'Failed to schedule appointment.');
        this.saving.set(false);
      },
    });
  }

  complete(id: string): void {
    this.apptSvc.complete(id).subscribe({
      next: (updated) =>
        this.appointments.update(list => list.map(a => a.id === id ? updated : a)),
    });
  }

  cancel(id: string): void {
    this.apptSvc.cancel(id).subscribe({
      next: (updated) =>
        this.appointments.update(list => list.map(a => a.id === id ? updated : a)),
    });
  }

  formatDateTime(s: string): string {
    const d = new Date(s);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
           ' ' +
           d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
}
