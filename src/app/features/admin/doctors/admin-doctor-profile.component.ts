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
import { DoctorResponse } from '../../../core/models';
import { ProfileService } from '../../../core/services/profile.service';
import { UserService } from '../../../core/services/user.service';
import { API_URL } from '../../../core/tokens/api.token';

@Component({
  selector: 'app-admin-doctor-profile',
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
        <button mat-stroked-button routerLink="/admin/doctors">
          <mat-icon>arrow_back</mat-icon>
          Back to doctors
        </button>
      </div>

      @if (loading()) {
        <div class="profile-state">
          <mat-spinner diameter="44" />
        </div>
      } @else {
        @if (doctor(); as currentDoctor) {
          <div class="profile-grid">
            <mat-card class="profile-card profile-card--hero">
              <mat-card-content>
                <div class="profile-hero">
                  <div class="profile-hero__visual">
                    <img [src]="getDoctorImage(currentDoctor)" [alt]="currentDoctor.firstName + ' ' + currentDoctor.lastName">
                    <input
                      #doctorImageInput
                      type="file"
                      accept="image/*"
                      hidden
                      (change)="uploadDoctorImage($event)"
                    >
                    <button
                      mat-stroked-button
                      type="button"
                      class="profile-photo-action"
                      [disabled]="uploadingImage()"
                      (click)="doctorImageInput.click()"
                    >
                      <mat-icon>{{ uploadingImage() ? 'hourglass_top' : 'photo_camera' }}</mat-icon>
                      {{ uploadingImage() ? 'Uploading...' : 'Update photo' }}
                    </button>
                  </div>
                  <div class="profile-hero__copy">
                    <span class="badge badge--blue">{{ currentDoctor.specialty }}</span>
                    <h1>Dr. {{ currentDoctor.firstName }} {{ currentDoctor.lastName }}</h1>
                    <p>{{ currentDoctor.email }}</p>
                    <div class="profile-hero__meta">
                      @if (currentDoctor.phoneNumber) {
                        <span><mat-icon>call</mat-icon>{{ currentDoctor.phoneNumber }}</span>
                      }
                      @if (currentDoctor.clinicAddress) {
                        <span><mat-icon>location_on</mat-icon>{{ currentDoctor.clinicAddress }}</span>
                      }
                      <span><mat-icon>verified</mat-icon>{{ currentDoctor.medicalLicenseNumber }}</span>
                    </div>
                    @if (uploadError()) {
                      <p class="profile-upload-error">{{ uploadError() }}</p>
                    }
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <div class="summary-grid">
              <mat-card class="summary-card">
                <mat-card-content>
                  <span>Appointments</span>
                  <strong>{{ currentDoctor.totalAppointments ?? 0 }}</strong>
                </mat-card-content>
              </mat-card>
              <mat-card class="summary-card">
                <mat-card-content>
                  <span>Prescriptions</span>
                  <strong>{{ currentDoctor.totalPrescriptions ?? 0 }}</strong>
                </mat-card-content>
              </mat-card>
              <mat-card class="summary-card">
                <mat-card-content>
                  <span>Active patients</span>
                  <strong>{{ currentDoctor.activePatientsCount ?? 0 }}</strong>
                </mat-card-content>
              </mat-card>
            </div>

            <mat-card class="profile-card">
              <mat-card-content>
                <div class="section-title">
                  <h2>Clinical profile</h2>
                  <span class="status-pill" [class.is-active]="currentDoctor.isActive">
                    {{ currentDoctor.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <mat-divider />
                <div class="info-grid">
                  <div class="info-row">
                    <span>Full name</span>
                    <strong>{{ currentDoctor.firstName }} {{ currentDoctor.lastName }}</strong>
                  </div>
                  <div class="info-row">
                    <span>Specialty</span>
                    <strong>{{ currentDoctor.specialty }}</strong>
                  </div>
                  <div class="info-row">
                    <span>Email</span>
                    <strong>{{ currentDoctor.email }}</strong>
                  </div>
                  <div class="info-row">
                    <span>Phone</span>
                    <strong>{{ currentDoctor.phoneNumber || 'Not provided' }}</strong>
                  </div>
                  <div class="info-row">
                    <span>Clinic address</span>
                    <strong>{{ currentDoctor.clinicAddress || 'Not provided' }}</strong>
                  </div>
                  <div class="info-row">
                    <span>License number</span>
                    <strong>{{ currentDoctor.medicalLicenseNumber }}</strong>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        } @else {
          <div class="profile-state profile-state--empty">
            <mat-icon>person_off</mat-icon>
            <h2>Doctor not found</h2>
            <p>This doctor profile is currently unavailable.</p>
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
    .profile-hero__visual {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .profile-hero img {
      width: 100%;
      aspect-ratio: 1 / 1;
      object-fit: cover;
      border-radius: 8px;
      background: #eef5ff;
    }
    .profile-photo-action {
      align-self: stretch;
      justify-content: center;
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
    .profile-upload-error {
      margin-top: 12px;
      color: var(--color-danger);
      font-size: 13px;
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
      font-size: 28px;
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
    .status-pill {
      display: inline-flex;
      align-items: center;
      padding: 6px 12px;
      border-radius: 999px;
      background: #fee2e2;
      color: var(--color-danger);
      font-size: 12px;
      font-weight: 700;
    }
    .status-pill.is-active {
      background: #dcfce7;
      color: #15803d;
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
    }
  `],
})
export class AdminDoctorProfileComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly userService = inject(UserService);
  private readonly profileService = inject(ProfileService);
  private readonly api = inject(API_URL);

  readonly loading = signal(true);
  readonly doctor = signal<DoctorResponse | null>(null);
  readonly uploadingImage = signal(false);
  readonly uploadError = signal('');

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
          return forkJoin({
            profile: this.profileService.getDoctorProfile(doctorId),
            summary: this.userService.getDoctorSummary(doctorId),
          }).pipe(
            catchError(() => of(null)),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.doctor.set(result ? { ...result.profile, ...result.summary } : null);
      });
  }

  uploadDoctorImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const imageFile = input.files?.[0];
    const currentDoctor = this.doctor();

    if (!imageFile || !currentDoctor) {
      return;
    }

    this.uploadingImage.set(true);
    this.uploadError.set('');

    this.profileService
      .uploadDoctorProfileImage(currentDoctor.id, imageFile)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedDoctor) => {
          this.doctor.update((doctor) => (doctor ? { ...doctor, ...updatedDoctor } : updatedDoctor));
          this.uploadingImage.set(false);
          input.value = '';
        },
        error: (err) => {
          this.uploadError.set(err.error?.message ?? 'Failed to upload the doctor profile image.');
          this.uploadingImage.set(false);
          input.value = '';
        },
      });
  }

  getDoctorImage(doctor: DoctorResponse): string {
    const imageUrl = this.resolveAssetUrl(doctor.profileImageUrl);
    if (imageUrl) {
      return imageUrl;
    }

    const name = encodeURIComponent(`Dr ${doctor.firstName} ${doctor.lastName}`);
    return `https://placehold.co/720x720/eaf4ff/2563eb?text=${name}`;
  }

  private resolveAssetUrl(assetPath?: string): string | null {
    if (!assetPath?.trim()) {
      return null;
    }

    if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
      return assetPath;
    }

    const apiRoot = this.api.endsWith('/api') ? this.api.slice(0, -4) : this.api;
    return `${apiRoot}${assetPath.startsWith('/') ? assetPath : `/${assetPath}`}`;
  }
}
