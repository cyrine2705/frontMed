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
import { catchError, debounceTime, distinctUntilChanged, finalize, of, startWith, switchMap } from 'rxjs';
import { MedicationResponse } from '../../../core/models';
import { MedicationService } from '../../../core/services/medication.service';

const MEDICATION_PLACEHOLDER = 'https://placehold.co/720x540/eaf4ff/2563eb?text=Medication';

@Component({
  selector: 'app-medication-catalog',
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
  templateUrl: './medication-catalog.component.html',
  styleUrl: './medication-catalog.component.scss',
})
export class MedicationCatalogComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly medicationService = inject(MedicationService);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly loading = signal(true);
  readonly medications = signal<MedicationResponse[]>([]);
  readonly selectedCategory = signal('All');
  readonly searchText = signal('');

  readonly categories = computed(() => [
    'All',
    ...Array.from(new Set(this.medications().map((medication) => medication.category))).sort((left, right) =>
      left.localeCompare(right)
    ),
  ]);

  readonly filteredMedications = computed(() => {
    const category = this.selectedCategory();
    if (category === 'All') {
      return this.medications();
    }

    return this.medications().filter((medication) => medication.category === category);
  });

  readonly hasActiveFilters = computed(() =>
    this.selectedCategory() !== 'All' || this.searchText().trim().length > 0
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
          return this.medicationService.getPublicCatalog(query).pipe(
            catchError(() => of([])),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((medications) => {
        this.medications.set(medications);
        if (!this.categories().includes(this.selectedCategory())) {
          this.selectedCategory.set('All');
        }
      });
  }

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.selectedCategory.set('All');
  }

  getMedicationImage(medication: MedicationResponse): string {
    return medication.imageUrl ?? MEDICATION_PLACEHOLDER;
  }

  getDescriptionExcerpt(description?: string): string {
    if (!description) {
      return 'No public description available yet.';
    }

    const plainText = description
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (plainText.length <= 150) {
      return plainText;
    }

    return `${plainText.slice(0, 147)}...`;
  }
}
