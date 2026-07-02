import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { DoctorResponse } from '../../../core/models';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-doctor-catalog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="catalog-page">
      <section class="catalog-hero">
        <div class="catalog-hero__copy">
          <span class="catalog-hero__eyebrow">Doctor Directory</span>
          <h1>Find the right specialist with a clearer medical profile.</h1>
          <p>
            Browse doctors by specialty, search by name, and open a detailed profile
            with location, contact data, and activity summary.
          </p>
        </div>

        <mat-card class="catalog-search-card">
          <mat-card-content>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Search doctors</mat-label>
              <mat-icon matPrefix>search</mat-icon>
              <input
                matInput
                [formControl]="searchControl"
                placeholder="Try: cardiology, Alice, clinic"
              >
            </mat-form-field>

            <div class="catalog-search-card__footer">
              <span>{{ filteredDoctors().length }} result(s)</span>
              @if (hasActiveFilters()) {
                <button mat-button type="button" (click)="clearFilters()">Clear filters</button>
              }
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <section class="catalog-body">
        <div class="catalog-body__toolbar">
          <div class="catalog-body__heading">
            <h2>Specialists</h2>
            <p>Refine the directory by specialty or free text.</p>
          </div>

          <div class="catalog-body__actions">
            <button mat-stroked-button routerLink="/">
              <mat-icon>arrow_back</mat-icon>
              Back to home
            </button>
          </div>
        </div>

        <div class="category-row">
          @for (specialty of specialties(); track specialty) {
            <button
              mat-stroked-button
              type="button"
              class="category-chip"
              [class.category-chip--active]="selectedSpecialty() === specialty"
              (click)="selectSpecialty(specialty)"
            >
              {{ specialty }}
            </button>
          }
        </div>

        @if (loading()) {
          <div class="catalog-state">
            <mat-spinner diameter="42" />
          </div>
        } @else if (filteredDoctors().length === 0) {
          <div class="catalog-state catalog-state--empty">
            <mat-icon>person_search</mat-icon>
            <h3>No doctors found</h3>
            <p>Try another specialty or broaden the search terms.</p>
          </div>
        } @else {
          <div class="catalog-grid">
            @for (doctor of filteredDoctors(); track doctor.id) {
              <mat-card class="doctor-card">
                <img
                  class="doctor-card__image"
                  [src]="getDoctorImage(doctor)"
                  [alt]="doctor.firstName + ' ' + doctor.lastName"
                >

                <mat-card-content>
                  <div class="doctor-card__meta">
                    <span class="badge badge--blue">{{ doctor.specialty }}</span>
                    <span class="doctor-card__status" [class.is-inactive]="!doctor.isActive">
                      {{ doctor.isActive ? 'Available' : 'Inactive' }}
                    </span>
                  </div>

                  <h3>Dr. {{ doctor.firstName }} {{ doctor.lastName }}</h3>

                  <div class="doctor-card__info-list">
                    @if (doctor.clinicAddress) {
                      <span><mat-icon>location_on</mat-icon>{{ doctor.clinicAddress }}</span>
                    }
                    @if (doctor.phoneNumber) {
                      <span><mat-icon>call</mat-icon>{{ doctor.phoneNumber }}</span>
                    }
                    <span><mat-icon>mail</mat-icon>{{ doctor.email }}</span>
                  </div>
                </mat-card-content>

                <mat-card-actions align="end">
                  <button
                    mat-flat-button
                    color="primary"
                    [routerLink]="['/doctors', doctor.id]"
                  >
                    View profile
                  </button>
                </mat-card-actions>
              </mat-card>
            }
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(180deg, #f6f9fd 0%, #fbfcfe 260px, #f7f8fa 100%);
    }

    .catalog-page {
      max-width: 1320px;
      margin: 0 auto;
      padding: 32px;
    }

    .catalog-hero {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(340px, 420px);
      gap: 20px;
      align-items: stretch;
      margin-bottom: 28px;
    }

    .catalog-hero__copy {
      padding: 24px 0;
    }

    .catalog-hero__copy h1 {
      font-size: 40px;
      line-height: 1.1;
      font-weight: 700;
      color: var(--color-text-1);
      max-width: 760px;
    }

    .catalog-hero__copy p {
      margin-top: 18px;
      font-size: 15px;
      line-height: 1.7;
      color: var(--color-text-2);
      max-width: 680px;
    }

    .catalog-hero__eyebrow {
      display: inline-flex;
      align-items: center;
      padding: 5px 12px;
      border-radius: 999px;
      background: rgba(37, 99, 235, 0.09);
      color: var(--color-primary);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-bottom: 14px;
    }

    .catalog-search-card mat-card-content {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 14px;
      min-height: 100%;
      padding: 24px !important;
    }

    .catalog-search-card .mat-mdc-form-field {
      width: 100%;
    }

    .catalog-search-card__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      color: var(--color-text-2);
      font-size: 13px;
    }

    .catalog-body__toolbar {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
    }

    .catalog-body__heading h2 {
      font-size: 24px;
      font-weight: 700;
      color: var(--color-text-1);
    }

    .catalog-body__heading p {
      margin-top: 4px;
      font-size: 14px;
      color: var(--color-text-2);
    }

    .category-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 22px;
    }

    .category-chip {
      background: #fff;
      border-color: var(--color-border) !important;
      color: var(--color-text-2) !important;
    }

    .category-chip--active {
      border-color: rgba(37, 99, 235, 0.16) !important;
      background: rgba(37, 99, 235, 0.08) !important;
      color: var(--color-primary) !important;
    }

    .catalog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .doctor-card {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .doctor-card__image {
      width: 100%;
      aspect-ratio: 4 / 3;
      object-fit: cover;
      background: #eef5ff;
    }

    .doctor-card__meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 12px;
    }

    .doctor-card__status {
      font-size: 12px;
      color: #15803d;
      font-weight: 600;
    }

    .doctor-card__status.is-inactive {
      color: var(--color-danger);
    }

    .doctor-card h3 {
      font-size: 18px;
      font-weight: 700;
      color: var(--color-text-1);
      margin-bottom: 12px;
    }

    .doctor-card__info-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      color: var(--color-text-2);
      font-size: 13px;
      min-height: 96px;
    }

    .doctor-card__info-list span {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .doctor-card__info-list mat-icon {
      width: 16px;
      height: 16px;
      font-size: 16px;
      color: var(--color-primary);
    }

    .doctor-card mat-card-actions {
      padding: 0 16px 16px;
      margin-top: auto;
    }

    .catalog-state {
      min-height: 360px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .catalog-state--empty {
      flex-direction: column;
      gap: 10px;
      text-align: center;
    }

    .catalog-state--empty mat-icon {
      width: 42px;
      height: 42px;
      font-size: 42px;
      color: var(--color-text-3);
    }

    .catalog-state--empty h3 {
      font-size: 20px;
      color: var(--color-text-1);
    }

    .catalog-state--empty p {
      color: var(--color-text-2);
      font-size: 14px;
    }

    @media (max-width: 960px) {
      .catalog-page {
        padding: 24px 20px;
      }

      .catalog-hero {
        grid-template-columns: 1fr;
      }

      .catalog-hero__copy h1 {
        font-size: 32px;
      }

      .catalog-body__toolbar {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `],
})
export class DoctorCatalogComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly userService = inject(UserService);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly loading = signal(true);
  readonly doctors = signal<DoctorResponse[]>([]);
  readonly selectedSpecialty = signal('All');
  readonly searchText = signal('');

  readonly specialties = computed(() => [
    'All',
    ...Array.from(new Set(this.doctors().map((doctor) => doctor.specialty))).sort((left, right) =>
      left.localeCompare(right)
    ),
  ]);

  readonly filteredDoctors = computed(() => {
    const specialty = this.selectedSpecialty();
    if (specialty === 'All') {
      return this.doctors();
    }

    return this.doctors().filter((doctor) => doctor.specialty === specialty);
  });

  readonly hasActiveFilters = computed(() =>
    this.selectedSpecialty() !== 'All' || this.searchText().trim().length > 0
  );

  constructor() {
    this.searchControl.valueChanges
      .pipe(
        startWith(this.searchControl.value),
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((query) => {
          this.searchText.set(query);
          this.loading.set(true);
          const specialty = this.selectedSpecialty() === 'All' ? undefined : this.selectedSpecialty();

          return this.userService.getPublicDoctors(query, specialty).pipe(
            catchError(() => of([])),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((doctors) => {
        this.doctors.set(doctors);
        if (!this.specialties().includes(this.selectedSpecialty())) {
          this.selectedSpecialty.set('All');
        }
      });
  }

  selectSpecialty(specialty: string): void {
    this.selectedSpecialty.set(specialty);
    this.loading.set(true);
    this.userService
      .getPublicDoctors(this.searchControl.value, specialty === 'All' ? undefined : specialty)
      .pipe(
        catchError(() => of([])),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((doctors) => this.doctors.set(doctors));
  }

  clearFilters(): void {
    this.selectedSpecialty.set('All');
    this.searchControl.setValue('');
  }

  getDoctorImage(doctor: DoctorResponse): string {
    const name = encodeURIComponent(`Dr ${doctor.firstName} ${doctor.lastName}`);
    return `https://placehold.co/720x540/eaf4ff/2563eb?text=${name}`;
  }
}
