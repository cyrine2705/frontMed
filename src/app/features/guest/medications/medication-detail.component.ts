import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  SecurityContext,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, finalize, of, switchMap } from 'rxjs';
import { MedicationResponse } from '../../../core/models';
import { MedicationService } from '../../../core/services/medication.service';

const MEDICATION_PLACEHOLDER = 'https://placehold.co/960x720/eaf4ff/2563eb?text=Medication';

@Component({
  selector: 'app-medication-detail',
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
  templateUrl: './medication-detail.component.html',
  styleUrl: './medication-detail.component.scss',
})
export class MedicationDetailComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly medicationService = inject(MedicationService);

  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly medication = signal<MedicationResponse | null>(null);

  readonly safeDescription = computed(() =>
    this.sanitizer.sanitize(SecurityContext.HTML, this.medication()?.description ?? '') ?? ''
  );

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const medicationId = params.get('medicationId');
          if (!medicationId) {
            this.notFound.set(true);
            this.loading.set(false);
            return of(null);
          }

          this.loading.set(true);
          this.notFound.set(false);

          return this.medicationService.getPublicById(medicationId).pipe(
            catchError(() => {
              this.notFound.set(true);
              return of(null);
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((medication) => {
        this.medication.set(medication);
      });
  }

  getMedicationImage(medication: MedicationResponse | null): string {
    return medication?.imageUrl ?? MEDICATION_PLACEHOLDER;
  }
}
