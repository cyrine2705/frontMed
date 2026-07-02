import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';
import { AppointmentResponse } from '../../../core/models';
import { fromLocalDateTimeString } from '../../../core/utils/datetime.util';

@Component({
  selector: 'app-patient-appointments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule, MatTableModule],
  template: `
    <div class="page">
      <header class="page__header">
        <div>
          <h1>Appointments</h1>
          <p>Your scheduled and past appointments</p>
        </div>

        @if (patientReference()) {
          <div class="identity-chip">
            <mat-icon>badge</mat-icon>
            <span>Patient ID</span>
            <strong>{{ patientReference() }}</strong>
          </div>
        }
      </header>

      <mat-card class="table-card">
        <table mat-table [dataSource]="appointments()">
          <ng-container matColumnDef="dateTime">
            <th mat-header-cell *matHeaderCellDef>Date & time</th>
            <td mat-cell *matCellDef="let a">{{ formatDateTime(a.dateTime) }}</td>
          </ng-container>

          <ng-container matColumnDef="doctor">
            <th mat-header-cell *matHeaderCellDef>Doctor</th>
            <td mat-cell *matCellDef="let a">
              <div class="doctor-cell">
                <span class="doctor-cell__name">{{ formatDoctorName(a) }}</span>
                @if (a.doctor?.specialty) {
                  <span class="doctor-cell__meta">{{ a.doctor?.specialty }}</span>
                }
              </div>
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

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>

        @if (appointments().length === 0 && !loading()) {
          <div class="table-empty">No appointments found.</div>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .table-card {
      overflow: hidden;
      table { width: 100%; }
    }

    .page__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }

    .identity-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border-radius: 999px;
      padding: 10px 14px;
      background: rgba(37, 99, 235, 0.08);
      border: 1px solid rgba(37, 99, 235, 0.16);
      color: var(--color-primary);
      font-size: 12px;
      white-space: nowrap;

      mat-icon {
        width: 16px;
        height: 16px;
        font-size: 16px;
      }

      strong {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.04em;
      }
    }

    .table-empty {
      padding: 32px;
      text-align: center;
      color: var(--color-text-3);
      font-size: 14px;
    }

    .doctor-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .doctor-cell__name {
      color: var(--color-text-1);
      font-weight: 500;
    }

    .doctor-cell__meta {
      color: var(--color-text-3);
      font-size: 12px;
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
export class PatientAppointmentsComponent implements OnInit {
  private readonly apptSvc = inject(AppointmentService);
  private readonly auth    = inject(AuthService);
  private readonly profileService = inject(ProfileService);

  readonly columns      = ['dateTime', 'doctor', 'reason', 'status'];
  readonly appointments = signal<AppointmentResponse[]>([]);
  readonly loading      = signal(false);
  readonly patientProfile = this.profileService.patientProfile;
  readonly patientReference = computed(
    () => this.patientProfile()?.functionalId ?? this.patientProfile()?.id ?? this.auth.currentUser()?.id ?? ''
  );

  ngOnInit(): void {
    const currentUser = this.auth.currentUser();
    if (!currentUser) {
      return;
    }

    this.loading.set(true);
    this.profileService.getPatientProfile(currentUser.id).subscribe({
      next: (patient) => {
        const patientReference = patient.functionalId ?? patient.id;
        this.apptSvc.getByPatient(patientReference).subscribe({
          next: (list) => {
            this.appointments.set(
              list.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
            );
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }

  formatDateTime(s: string): string {
    const d = fromLocalDateTimeString(s);
    return (
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    );
  }

  formatDoctorName(appointment: AppointmentResponse): string {
    if (appointment.doctor) {
      return `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`;
    }

    return appointment.doctorId;
  }
}
