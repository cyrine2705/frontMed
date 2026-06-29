import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AppointmentService } from '../../../core/services/appointment.service';
import { PrescriptionService } from '../../../core/services/prescription.service';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentResponse, PrescriptionResponse } from '../../../core/models';
import { fromLocalDateTimeString } from '../../../core/utils/datetime.util';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <div class="page">
      <header class="page__header">
        <h1>Dashboard</h1>
        <p>Welcome, {{ auth.currentUser()?.firstName }}</p>
      </header>

      <div class="dash-grid">
        <!-- Upcoming appointments -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Upcoming appointments</mat-card-title>
            <a mat-button routerLink="/patient/appointments">View all</a>
          </mat-card-header>
          <mat-card-content>
            @if (upcoming().length === 0) {
              <p class="empty-msg">No upcoming appointments.</p>
            }
            @for (appt of upcoming(); track appt.id) {
              <div class="appt-row">
                <div class="appt-row__date-block">
                  <span class="appt-row__day">{{ appt.dateTime | date:'d' }}</span>
                  <span class="appt-row__month">{{ appt.dateTime | date:'MMM' }}</span>
                </div>
                <div class="appt-row__body">
                  <span class="appt-row__reason">{{ appt.reason }}</span>
                  <span class="appt-row__time">{{ formatTime(appt.dateTime) }}</span>
                </div>
                <span class="badge badge--blue">SCHEDULED</span>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Recent prescriptions -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Recent prescriptions</mat-card-title>
            <a mat-button routerLink="/patient/prescriptions">View all</a>
          </mat-card-header>
          <mat-card-content>
            @if (recentRx().length === 0) {
              <p class="empty-msg">No prescriptions yet.</p>
            }
            @for (rx of recentRx(); track rx.id) {
              <div class="rx-row">
                <mat-icon class="rx-row__icon">medication</mat-icon>
                <div class="rx-row__body">
                  <span class="rx-row__count">{{ rx.prescriptionLines.length }} medication(s)</span>
                  <span class="rx-row__date">{{ rx.createdAt | date:'MMM d, yyyy' }}</span>
                </div>
              </div>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dash-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;

      @media (max-width: 900px) { grid-template-columns: 1fr; }
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

      &__date-block {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(37,99,235,.08);
        border-radius: var(--radius-md);
        padding: 4px 10px;
        min-width: 44px;
      }

      &__day {
        font-size: 18px;
        font-weight: 700;
        color: var(--color-primary);
        line-height: 1;
      }

      &__month {
        font-size: 10px;
        font-weight: 600;
        color: var(--color-primary);
        text-transform: uppercase;
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

      &__time {
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
        color: var(--color-primary);
      }

      &__body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      &__count {
        font-size: 13px;
        font-weight: 500;
        color: var(--color-text-1);
      }

      &__date {
        font-size: 12px;
        color: var(--color-text-3);
      }
    }
  `],
})
export class PatientDashboardComponent implements OnInit {
  protected readonly auth  = inject(AuthService);
  private readonly apptSvc = inject(AppointmentService);
  private readonly rxSvc   = inject(PrescriptionService);

  private readonly allAppts = signal<AppointmentResponse[]>([]);
  private readonly allRx    = signal<PrescriptionResponse[]>([]);

  readonly upcoming = computed(() =>
    this.allAppts()
      .filter(a => a.status === 'SCHEDULED' && fromLocalDateTimeString(a.dateTime) > new Date())
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
      .slice(0, 5)
  );

  readonly recentRx = computed(() => this.allRx().slice(0, 5));

  ngOnInit(): void {
    const patientId = this.auth.currentUser()!.id;
    this.apptSvc.getByPatient(patientId).subscribe(list => this.allAppts.set(list));
    this.rxSvc.getByPatient(patientId).subscribe(list => this.allRx.set(list));
  }

  formatTime(dateTime: string): string {
    const d = fromLocalDateTimeString(dateTime);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
}
