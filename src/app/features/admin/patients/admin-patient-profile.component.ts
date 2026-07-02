import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PatientResponse } from '../../../core/models';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-admin-patient-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="profile-page">
      <div class="profile-topbar">
        <button mat-stroked-button routerLink="/admin/patients">
          <mat-icon>arrow_back</mat-icon>
          Back to patients
        </button>
      </div>

      @if (loading()) {
        <div class="profile-state">
          <mat-spinner diameter="44" />
        </div>
      } @else {
        @if (patient(); as currentPatient) {
          <div class="profile-grid">
            <mat-card class="profile-card profile-card--hero">
              <mat-card-content>
                <div class="profile-hero">
                  <img [src]="getPatientImage(currentPatient)" [alt]="currentPatient.firstName + ' ' + currentPatient.lastName">
                  <div class="profile-hero__copy">
                    <span class="badge badge--gray">{{ currentPatient.bloodType || 'No blood type' }}</span>
                    <h1>{{ currentPatient.firstName }} {{ currentPatient.lastName }}</h1>
                    <p>{{ currentPatient.email }}</p>
                    <div class="profile-hero__meta">
                      <span><mat-icon>cake</mat-icon>{{ currentPatient.birthDate || 'Unknown' }}</span>
                      <span><mat-icon>badge</mat-icon>{{ currentPatient.maskedSocialSecurityNumber || currentPatient.socialSecurityNumber || 'N/A' }}</span>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <div class="summary-grid">
              <mat-card class="summary-card">
                <mat-card-content>
                  <span>Appointments</span>
                  <strong>{{ currentPatient.totalAppointments ?? 0 }}</strong>
                </mat-card-content>
              </mat-card>
              <mat-card class="summary-card">
                <mat-card-content>
                  <span>Prescriptions</span>
                  <strong>{{ currentPatient.totalPrescriptions ?? 0 }}</strong>
                </mat-card-content>
              </mat-card>
              <mat-card class="summary-card">
                <mat-card-content>
                  <span>Status</span>
                  <strong>{{ currentPatient.isActive ? 'Active' : 'Archived' }}</strong>
                </mat-card-content>
              </mat-card>
            </div>

            <mat-card class="profile-card">
              <mat-card-content>
                <div class="section-title">
                  <h2>Patient summary</h2>
                  <button
                    mat-flat-button
                    [color]="currentPatient.isActive ? 'warn' : 'primary'"
                    (click)="toggleArchive(currentPatient)"
                  >
                    <mat-icon>{{ currentPatient.isActive ? 'archive' : 'unarchive' }}</mat-icon>
                    {{ currentPatient.isActive ? 'Archive patient' : 'Unarchive patient' }}
                  </button>
                </div>
                <mat-divider />
                <div class="info-grid">
                  <div class="info-row">
                    <span>Full name</span>
                    <strong>{{ currentPatient.firstName }} {{ currentPatient.lastName }}</strong>
                  </div>
                  <div class="info-row">
                    <span>Email</span>
                    <strong>{{ currentPatient.email }}</strong>
                  </div>
                  <div class="info-row">
                    <span>Birth date</span>
                    <strong>{{ currentPatient.birthDate || 'Unknown' }}</strong>
                  </div>
                  <div class="info-row">
                    <span>Blood type</span>
                    <strong>{{ currentPatient.bloodType || 'Not provided' }}</strong>
                  </div>
                  <div class="info-row">
                    <span>Social security number</span>
                    <strong>{{ currentPatient.maskedSocialSecurityNumber || currentPatient.socialSecurityNumber || 'Not provided' }}</strong>
                  </div>
                  <div class="info-row">
                    <span>Account status</span>
                    <strong>{{ currentPatient.isActive ? 'Active' : 'Archived' }}</strong>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        } @else {
          <div class="profile-state profile-state--empty">
            <mat-icon>person_off</mat-icon>
            <h2>Patient not found</h2>
            <p>This patient profile is currently unavailable.</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .profile-page { padding: 28px; }
    .profile-topbar { margin-bottom: 18px; }
    .profile-grid { display: grid; gap: 16px; }
    .profile-card { border-radius: 8px; }
    .profile-card--hero { overflow: hidden; }
    .profile-hero {
      display: grid;
      grid-template-columns: 220px minmax(0, 1fr);
      gap: 20px;
      align-items: center;
    }
    .profile-hero img {
      width: 100%;
      aspect-ratio: 1 / 1;
      object-fit: cover;
      border-radius: 8px;
      background: #eef5ff;
    }
    .profile-hero__copy h1 {
      margin: 10px 0 8px;
      font-size: 30px;
      line-height: 1.1;
      color: var(--color-text-1);
      font-weight: 700;
    }
    .profile-hero__copy p {
      color: var(--color-text-2);
      font-size: 14px;
      margin-bottom: 14px;
    }
    .profile-hero__meta {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      color: var(--color-text-2);
      font-size: 13px;
    }
    .profile-hero__meta span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .profile-hero__meta mat-icon {
      width: 16px;
      height: 16px;
      font-size: 16px;
      color: var(--color-primary);
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }
    .summary-card mat-card-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .summary-card span {
      font-size: 13px;
      color: var(--color-text-2);
    }
    .summary-card strong {
      font-size: 24px;
      font-weight: 700;
      color: var(--color-text-1);
    }
    .section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
    }
    .section-title h2 {
      font-size: 20px;
      color: var(--color-text-1);
      font-weight: 700;
    }
    mat-divider { margin-bottom: 18px; }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }
    .info-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 14px 16px;
      border-radius: 8px;
      border: 1px solid var(--color-border);
      background: #f9fbff;
    }
    .info-row span {
      font-size: 12px;
      color: var(--color-text-2);
    }
    .info-row strong {
      font-size: 14px;
      color: var(--color-text-1);
      line-height: 1.5;
    }
    .profile-state {
      min-height: 55vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .profile-state--empty {
      flex-direction: column;
      gap: 10px;
      text-align: center;
    }
    .profile-state--empty mat-icon {
      width: 42px;
      height: 42px;
      font-size: 42px;
      color: var(--color-text-3);
    }
    @media (max-width: 900px) {
      .profile-page { padding: 20px; }
      .profile-hero,
      .summary-grid,
      .info-grid { grid-template-columns: 1fr; }
      .section-title {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `],
})
export class AdminPatientProfileComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly userService = inject(UserService);

  readonly loading = signal(true);
  readonly patient = signal<PatientResponse | null>(null);

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const patientId = params.get('patientId');
          if (!patientId) {
            this.loading.set(false);
            return of(null);
          }

          this.loading.set(true);
          return forkJoin({
            profile: this.userService.getPatientProfile(patientId),
            summary: this.userService.getPatientSummary(patientId),
          }).pipe(
            catchError(() => of(null)),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.patient.set(result ? { ...result.profile, ...result.summary } : null);
      });
  }

  toggleArchive(patient: PatientResponse): void {
    const request$ = patient.isActive
      ? this.userService.archivePatient(patient.id)
      : this.userService.unarchivePatient(patient.id);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((updatedPatient) => {
      this.patient.set(updatedPatient);
    });
  }

  getPatientImage(patient: PatientResponse): string {
    const name = encodeURIComponent(`${patient.firstName} ${patient.lastName}`);
    return `https://placehold.co/720x720/f4f8ff/2563eb?text=${name}`;
  }
}
