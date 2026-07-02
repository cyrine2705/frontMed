import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, finalize, of, switchMap } from 'rxjs';
import { DoctorResponse } from '../../../core/models';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-doctor-detail',
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
    <div class="detail-page">
      <div class="detail-topbar">
        <button mat-stroked-button routerLink="/doctors">
          <mat-icon>arrow_back</mat-icon>
          Back to directory
        </button>
      </div>

      @if (loading()) {
        <div class="detail-state">
          <mat-spinner diameter="44" />
        </div>
      } @else {
        @if (doctor(); as currentDoctor) {
          <div class="detail-layout">
            <mat-card class="detail-media-card">
              <img
                class="detail-media-card__image"
                [src]="getDoctorImage(currentDoctor)"
                [alt]="currentDoctor.firstName + ' ' + currentDoctor.lastName"
              >
            </mat-card>

            <mat-card class="detail-content-card">
              <mat-card-content>
                <div class="detail-content-card__meta">
                  <span class="badge badge--blue">{{ currentDoctor.specialty }}</span>
                  <span class="detail-content-card__status" [class.is-inactive]="!currentDoctor.isActive">
                    {{ currentDoctor.isActive ? 'Available' : 'Inactive' }}
                  </span>
                </div>

                <h1>Dr. {{ currentDoctor.firstName }} {{ currentDoctor.lastName }}</h1>

                <p class="detail-content-card__intro">
                  Clinical profile prepared for visitors, patients, and care coordination teams.
                </p>

                <div class="metric-grid">
                  <div class="metric-card">
                    <span class="metric-card__label">Appointments</span>
                    <strong>{{ currentDoctor.totalAppointments ?? 0 }}</strong>
                  </div>
                  <div class="metric-card">
                    <span class="metric-card__label">Prescriptions</span>
                    <strong>{{ currentDoctor.totalPrescriptions ?? 0 }}</strong>
                  </div>
                  <div class="metric-card">
                    <span class="metric-card__label">Active patients</span>
                    <strong>{{ currentDoctor.activePatientsCount ?? 0 }}</strong>
                  </div>
                </div>

                <mat-divider />

                <div class="detail-list">
                  <div class="detail-list__item">
                    <mat-icon>mail</mat-icon>
                    <div>
                      <span>Email</span>
                      <strong>{{ currentDoctor.email }}</strong>
                    </div>
                  </div>

                  @if (currentDoctor.phoneNumber) {
                    <div class="detail-list__item">
                      <mat-icon>call</mat-icon>
                      <div>
                        <span>Phone</span>
                        <strong>{{ currentDoctor.phoneNumber }}</strong>
                      </div>
                    </div>
                  }

                  @if (currentDoctor.clinicAddress) {
                    <div class="detail-list__item">
                      <mat-icon>location_on</mat-icon>
                      <div>
                        <span>Clinic address</span>
                        <strong>{{ currentDoctor.clinicAddress }}</strong>
                      </div>
                    </div>
                  }

                  <div class="detail-list__item">
                    <mat-icon>verified</mat-icon>
                    <div>
                      <span>License</span>
                      <strong>{{ currentDoctor.medicalLicenseNumber }}</strong>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        } @else {
          <div class="detail-state detail-state--empty">
            <mat-icon>person_off</mat-icon>
            <h2>Doctor not found</h2>
            <p>The requested doctor profile is unavailable right now.</p>
            <button mat-flat-button color="primary" routerLink="/doctors">Browse directory</button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(180deg, #f6f9fd 0%, #f9fbfe 100%);
    }

    .detail-page {
      max-width: 1320px;
      margin: 0 auto;
      padding: 28px 32px 40px;
    }

    .detail-topbar {
      margin-bottom: 18px;
    }

    .detail-layout {
      display: grid;
      grid-template-columns: minmax(340px, 480px) minmax(0, 1fr);
      gap: 20px;
      align-items: start;
    }

    .detail-media-card {
      overflow: hidden;
    }

    .detail-media-card__image {
      width: 100%;
      aspect-ratio: 4 / 3;
      object-fit: cover;
      display: block;
      background: #eef5ff;
    }

    .detail-content-card__meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 14px;
    }

    .detail-content-card__status {
      font-size: 13px;
      color: #15803d;
      font-weight: 600;
    }

    .detail-content-card__status.is-inactive {
      color: var(--color-danger);
    }

    .detail-content-card h1 {
      font-size: 34px;
      line-height: 1.1;
      font-weight: 700;
      color: var(--color-text-1);
      margin-bottom: 12px;
    }

    .detail-content-card__intro {
      color: var(--color-text-2);
      font-size: 14px;
      line-height: 1.65;
      margin-bottom: 18px;
    }

    .metric-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 18px;
    }

    .metric-card {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 14px 16px;
      background: #f9fbff;
    }

    .metric-card__label {
      display: block;
      font-size: 12px;
      color: var(--color-text-2);
      margin-bottom: 6px;
    }

    .metric-card strong {
      font-size: 24px;
      color: var(--color-text-1);
      font-weight: 700;
    }

    .detail-content-card mat-divider {
      margin: 18px 0;
    }

    .detail-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .detail-list__item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 14px 16px;
    }

    .detail-list__item mat-icon {
      color: var(--color-primary);
    }

    .detail-list__item span {
      display: block;
      font-size: 12px;
      color: var(--color-text-2);
      margin-bottom: 4px;
    }

    .detail-list__item strong {
      color: var(--color-text-1);
      font-size: 14px;
      line-height: 1.5;
    }

    .detail-state {
      min-height: 60vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .detail-state--empty {
      flex-direction: column;
      gap: 12px;
      text-align: center;
    }

    .detail-state--empty mat-icon {
      width: 44px;
      height: 44px;
      font-size: 44px;
      color: var(--color-text-3);
    }

    .detail-state--empty h2 {
      font-size: 24px;
      color: var(--color-text-1);
      font-weight: 700;
    }

    .detail-state--empty p {
      font-size: 14px;
      color: var(--color-text-2);
      margin-bottom: 4px;
    }

    @media (max-width: 960px) {
      .detail-page {
        padding: 20px;
      }

      .detail-layout,
      .detail-list,
      .metric-grid {
        grid-template-columns: 1fr;
      }

      .detail-content-card h1 {
        font-size: 28px;
      }
    }
  `],
})
export class DoctorDetailComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly userService = inject(UserService);

  readonly loading = signal(true);
  readonly doctor = signal<DoctorResponse | null>(null);

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const doctorId = params.get('doctorId');
          if (!doctorId) {
            this.loading.set(false);
            return of(null);
          }

          this.loading.set(true);
          return this.userService.getPublicDoctorById(doctorId).pipe(
            catchError(() => of(null)),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((doctor) => this.doctor.set(doctor));
  }

  getDoctorImage(doctor: DoctorResponse): string {
    const name = encodeURIComponent(`Dr ${doctor.firstName} ${doctor.lastName}`);
    return `https://placehold.co/960x720/eaf4ff/2563eb?text=${name}`;
  }
}
