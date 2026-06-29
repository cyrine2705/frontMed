import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../core/services/user.service';
import { AppointmentService } from '../../../core/services/appointment.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule],
  template: `
    <div class="page">
      <header class="page__header">
        <h1>Dashboard</h1>
        <p>Platform overview</p>
      </header>

      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-card__icon stat-card__icon--blue">
              <mat-icon>medical_services</mat-icon>
            </div>
            <div class="stat-card__body">
              <span class="stat-card__value">{{ stats().doctors }}</span>
              <span class="stat-card__label">Total Doctors</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-card__icon stat-card__icon--green">
              <mat-icon>people</mat-icon>
            </div>
            <div class="stat-card__body">
              <span class="stat-card__value">{{ stats().patients }}</span>
              <span class="stat-card__label">Total Patients</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-card__icon stat-card__icon--purple">
              <mat-icon>calendar_today</mat-icon>
            </div>
            <div class="stat-card__body">
              <span class="stat-card__value">{{ stats().appointments }}</span>
              <span class="stat-card__label">Total Appointments</span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
    }

    .stat-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px !important;
    }

    .stat-card__icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon { font-size: 24px; width: 24px; height: 24px; color: white; }

      &--blue   { background: var(--color-primary); }
      &--green  { background: var(--color-success); }
      &--purple { background: #7c3aed; }
    }

    .stat-card__body {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .stat-card__value {
      font-size: 28px;
      font-weight: 700;
      color: var(--color-text-1);
      line-height: 1;
    }

    .stat-card__label {
      font-size: 13px;
      color: var(--color-text-2);
    }
  `],
})
export class AdminDashboardComponent implements OnInit {
  private readonly userSvc  = inject(UserService);
  private readonly apptSvc  = inject(AppointmentService);

  readonly stats = signal({ doctors: 0, patients: 0, appointments: 0 });

  ngOnInit(): void {
    forkJoin({
      doctors:      this.userSvc.getDoctors(),
      patients:     this.userSvc.getPatients(),
      appointments: this.apptSvc.getAll(),
    }).subscribe({
      next: ({ doctors, patients, appointments }) => {
        this.stats.set({
          doctors:      doctors.length,
          patients:     patients.length,
          appointments: appointments.length,
        });
      },
    });
  }
}
