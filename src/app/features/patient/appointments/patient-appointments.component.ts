import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';
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
        <h1>Appointments</h1>
        <p>Your scheduled and past appointments</p>
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
              {{ a.doctor ? 'Dr. ' + a.doctor.lastName : a.doctorId }}
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
export class PatientAppointmentsComponent implements OnInit {
  private readonly apptSvc = inject(AppointmentService);
  private readonly auth    = inject(AuthService);

  readonly columns      = ['dateTime', 'doctor', 'reason', 'status'];
  readonly appointments = signal<AppointmentResponse[]>([]);
  readonly loading      = signal(false);

  ngOnInit(): void {
    this.loading.set(true);
    const patientId = this.auth.currentUser()!.id;
    this.apptSvc.getByPatient(patientId).subscribe({
      next: (list) => {
        this.appointments.set(
          list.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
        );
        this.loading.set(false);
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
}
