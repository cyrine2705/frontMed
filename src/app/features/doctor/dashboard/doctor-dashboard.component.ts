import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AppointmentService } from '../../../core/services/appointment.service';
import { PrescriptionService } from '../../../core/services/prescription.service';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentResponse, PrescriptionResponse } from '../../../core/models';
import { fromLocalDateTimeString } from '../../../core/utils/datetime.util';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="page">
      <header class="page__header">
        <h1>Dashboard</h1>
        <p>Welcome back, Dr. {{ auth.currentUser()?.lastName }}</p>
      </header>

      <!-- Summary counts -->
      <div class="stats-row">
        <div class="stat-chip">
          <span class="stat-chip__value">{{ todayCount() }}</span>
          <span class="stat-chip__label">Appointments today</span>
        </div>
        <div class="stat-chip">
          <span class="stat-chip__value">{{ scheduledCount() }}</span>
          <span class="stat-chip__label">Upcoming</span>
        </div>
        <div class="stat-chip">
          <span class="stat-chip__value">{{ rxCount() }}</span>
          <span class="stat-chip__label">Prescriptions issued</span>
        </div>
      </div>

      <div class="dash-grid">
        <!-- Today's appointments -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Today's appointments</mat-card-title>
            <a mat-button routerLink="/doctor/appointments">View all</a>
          </mat-card-header>
          <mat-card-content>
            @if (todayAppointments().length === 0) {
              <p class="empty-msg">No appointments scheduled for today.</p>
            }
            @for (appt of todayAppointments(); track appt.id) {
              <div class="appt-row">
                <div class="appt-row__time">
                  {{ formatTime(appt.dateTime) }}
                </div>
                <div class="appt-row__body">
                  <span class="appt-row__reason">{{ appt.reason }}</span>
                  <span class="appt-row__patient">Patient ID: {{ appt.patientId }}</span>
                </div>
                <span class="badge"
                      [class.badge--blue]="appt.status === 'SCHEDULED'"
                      [class.badge--green]="appt.status === 'COMPLETED'"
                      [class.badge--red]="appt.status === 'CANCELED'">
                  {{ appt.status }}
                </span>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Recent prescriptions -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Recent prescriptions</mat-card-title>
            <a mat-button routerLink="/doctor/prescriptions">View all</a>
          </mat-card-header>
          <mat-card-content>
            @if (recentRx().length === 0) {
              <p class="empty-msg">No prescriptions issued yet.</p>
            }
            @for (rx of recentRx(); track rx.id) {
              <div class="rx-row">
                <mat-icon class="rx-row__icon">medication</mat-icon>
                <div class="rx-row__body">
                  <span class="rx-row__patient">Patient ID: {{ rx.patientId }}</span>
                  <span class="rx-row__lines">
                    {{ rx.prescriptionLines.length }} medication(s)
                  </span>
                </div>
                <span class="rx-row__date">
                  {{ rx.createdAt | date:'MMM d' }}
                </span>
              </div>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .stats-row {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }

    .stat-chip {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 12px 20px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 140px;
      box-shadow: var(--shadow-card);

      &__value {
        font-size: 24px;
        font-weight: 700;
        color: var(--color-primary);
        line-height: 1;
      }

      &__label {
        font-size: 12px;
        color: var(--color-text-2);
      }
    }

    .dash-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;

      @media (max-width: 900px) {
        grid-template-columns: 1fr;
      }
    }

    mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 16px 0;

      mat-card-title { font-size: 14px; font-weight: 600; }
    }

    mat-card-content { padding: 12px 16px 16px !important; }

    .empty-msg {
      color: var(--color-text-3);
      font-size: 13px;
      padding: 8px 0;
    }

    .appt-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid var(--color-border);

      &:last-child { border-bottom: none; }

      &__time {
        font-size: 13px;
        font-weight: 600;
        color: var(--color-primary);
        min-width: 50px;
      }

      &__body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      &__reason {
        font-size: 13px;
        font-weight: 500;
        color: var(--color-text-1);
      }

      &__patient {
        font-size: 12px;
        color: var(--color-text-3);
      }
    }

    .rx-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid var(--color-border);

      &:last-child { border-bottom: none; }

      &__icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: var(--color-text-3);
      }

      &__body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      &__patient {
        font-size: 13px;
        font-weight: 500;
        color: var(--color-text-1);
      }

      &__lines {
        font-size: 12px;
        color: var(--color-text-3);
      }

      &__date {
        font-size: 12px;
        color: var(--color-text-3);
      }
    }
  `],
})
export class DoctorDashboardComponent implements OnInit {
  protected readonly auth    = inject(AuthService);
  private readonly apptSvc   = inject(AppointmentService);
  private readonly rxSvc     = inject(PrescriptionService);

  private readonly allAppts = signal<AppointmentResponse[]>([]);
  private readonly allRx    = signal<PrescriptionResponse[]>([]);

  readonly todayAppointments = computed(() => {
    const today = new Date().toDateString();
    return this.allAppts().filter(a =>
      fromLocalDateTimeString(a.dateTime).toDateString() === today
    );
  });

  readonly recentRx = computed(() => this.allRx().slice(0, 5));

  readonly todayCount = computed(() => this.todayAppointments().length);
  readonly scheduledCount = computed(() =>
    this.allAppts().filter(a => a.status === 'SCHEDULED').length
  );
  readonly rxCount = computed(() => this.allRx().length);

  ngOnInit(): void {
    const doctorId = this.auth.currentUser()!.id;
    this.apptSvc.getByDoctor(doctorId).subscribe(list => this.allAppts.set(list));
    this.rxSvc.getByDoctor(doctorId).subscribe(list => this.allRx.set(list));
  }

  formatTime(dateTime: string): string {
    const d = fromLocalDateTimeString(dateTime);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
}
