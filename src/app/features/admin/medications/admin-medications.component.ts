import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  OnInit,
  SecurityContext,
  signal,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { QuillEditorComponent } from 'ngx-quill';
import { CreateMedicationRequest, MedicationResponse } from '../../../core/models';
import { MedicationService } from '../../../core/services/medication.service';

const MEDICATION_PLACEHOLDER = 'https://placehold.co/720x540/eaf4ff/2563eb?text=Medication';

@Component({
  selector: 'app-admin-medications',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    QuillEditorComponent,
  ],
  templateUrl: './admin-medications.component.html',
  styleUrl: './admin-medications.component.scss',
})
export class AdminMedicationsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly medicationService = inject(MedicationService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly columns = ['image', 'name', 'category', 'laboratory', 'actions'];
  readonly medications = signal<MedicationResponse[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly searchQuery = signal('');
  readonly formError = signal('');
  readonly selectedMedication = signal<MedicationResponse | null>(null);
  readonly deletingMedicationId = signal<string | null>(null);

  private readonly persistedImageValue = signal<string | null>(null);
  private readonly persistedImagePreview = signal<string | null>(null);
  private readonly uploadedImageFile = signal<File | null>(null);
  private readonly uploadedImagePreview = signal<string | null>(null);
  private readonly externalImagePreview = signal<string | null>(null);
  private readonly descriptionHtml = signal('');

  readonly isEditMode = computed(() => this.selectedMedication() !== null);
  readonly filteredMedications = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) {
      return this.medications();
    }

    return this.medications().filter((medication) =>
      medication.name.toLowerCase().includes(query)
      || medication.category.toLowerCase().includes(query)
      || (medication.laboratory ?? '').toLowerCase().includes(query)
    );
  });
  readonly previewImageUrl = computed(() =>
    this.uploadedImagePreview()
    ?? this.externalImagePreview()
    ?? this.persistedImagePreview()
    ?? MEDICATION_PLACEHOLDER
  );
  readonly sanitizedDescription = computed(() =>
    this.sanitizeHtml(this.descriptionHtml())
  );

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    category: ['', [Validators.required, Validators.maxLength(80)]],
    laboratory: ['', Validators.maxLength(120)],
    imageUrl: ['', Validators.maxLength(500)],
    description: [''],
  });

  ngOnInit(): void {
    this.loadMedications();

    this.form.controls.imageUrl.valueChanges
      .pipe(
        debounceTime(150),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => {
        this.externalImagePreview.set(this.cleanOptionalString(value) ?? null);
      });

    this.form.controls.description.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.descriptionHtml.set(value ?? '');
      });
  }

  openCreateForm(): void {
    this.showForm.set(true);
    this.selectedMedication.set(null);
    this.formError.set('');
    this.form.reset({
      name: '',
      category: '',
      laboratory: '',
      imageUrl: '',
      description: '',
    });
    this.persistedImageValue.set(null);
    this.persistedImagePreview.set(null);
    this.uploadedImageFile.set(null);
    this.uploadedImagePreview.set(null);
    this.externalImagePreview.set(null);
    this.descriptionHtml.set('');
  }

  editMedication(medication: MedicationResponse): void {
    this.showForm.set(true);
    this.selectedMedication.set(medication);
    this.formError.set('');
    this.form.reset({
      name: medication.name,
      category: medication.category,
      laboratory: medication.laboratory ?? '',
      imageUrl: '',
      description: medication.description ?? '',
    });
    this.persistedImageValue.set(medication.sourceImageUrl ?? null);
    this.persistedImagePreview.set(medication.imageUrl ?? null);
    this.uploadedImageFile.set(null);
    this.uploadedImagePreview.set(null);
    this.externalImagePreview.set(null);
    this.descriptionHtml.set(medication.description ?? '');
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.selectedMedication.set(null);
    this.formError.set('');
    this.uploadedImageFile.set(null);
    this.uploadedImagePreview.set(null);
    this.externalImagePreview.set(null);
    this.descriptionHtml.set('');
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const imageFile = input?.files?.item(0) ?? null;

    if (!imageFile) {
      this.uploadedImageFile.set(null);
      this.uploadedImagePreview.set(null);
      return;
    }

    this.uploadedImageFile.set(imageFile);

    const fileReader = new FileReader();
    fileReader.onload = () => {
      this.uploadedImagePreview.set(typeof fileReader.result === 'string' ? fileReader.result : null);
    };
    fileReader.readAsDataURL(imageFile);
  }

  clearImageSelection(fileInput: HTMLInputElement): void {
    fileInput.value = '';
    this.uploadedImageFile.set(null);
    this.uploadedImagePreview.set(null);
    this.externalImagePreview.set(this.cleanOptionalString(this.form.controls.imageUrl.value) ?? null);
  }

  canClearImageSelection(): boolean {
    return this.uploadedImageFile() !== null || !!this.cleanOptionalString(this.form.controls.imageUrl.value);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.formError.set('');

    const rawValue = this.form.getRawValue();
    const payload: CreateMedicationRequest = {
      name: rawValue.name.trim(),
      category: rawValue.category.trim(),
      laboratory: this.cleanOptionalString(rawValue.laboratory),
      description: this.cleanOptionalString(rawValue.description),
      imageUrl: this.resolveImageValue(rawValue.imageUrl),
    };

    const selectedMedication = this.selectedMedication();
    const request$ = selectedMedication
      ? this.medicationService.updateAdmin(selectedMedication.id, payload, this.uploadedImageFile())
      : this.medicationService.createAdmin(payload, this.uploadedImageFile());

    request$.subscribe({
      next: (medication) => {
        if (selectedMedication) {
          this.medications.update((items) =>
            items.map((item) => (item.id === medication.id ? medication : item))
          );
        } else {
          this.medications.update((items) => [medication, ...items]);
        }

        this.saving.set(false);
        this.cancelForm();
      },
      error: (error) => {
        this.formError.set(error.error?.message ?? 'Unable to save this medication right now.');
        this.saving.set(false);
      },
    });
  }

  deleteMedication(medication: MedicationResponse): void {
    if (!confirm(`Delete ${medication.name}?`)) {
      return;
    }

    this.deletingMedicationId.set(medication.id);
    this.medicationService.deleteAdmin(medication.id).subscribe({
      next: () => {
        this.medications.update((items) => items.filter((item) => item.id !== medication.id));
        if (this.selectedMedication()?.id === medication.id) {
          this.cancelForm();
        }
        this.deletingMedicationId.set(null);
      },
      error: () => {
        this.deletingMedicationId.set(null);
      },
    });
  }

  getMedicationImage(medication: MedicationResponse): string {
    return medication.imageUrl ?? MEDICATION_PLACEHOLDER;
  }

  getDescriptionExcerpt(description?: string): string {
    if (!description) {
      return 'No description provided yet.';
    }

    const plainText = description
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (plainText.length <= 90) {
      return plainText;
    }

    return `${plainText.slice(0, 87)}...`;
  }

  private loadMedications(): void {
    this.loading.set(true);
    this.medicationService.getAdminCatalog().subscribe({
      next: (medications) => {
        this.medications.set(medications);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private resolveImageValue(formImageUrl: string): string | undefined {
    const providedImageUrl = this.cleanOptionalString(formImageUrl);
    if (providedImageUrl) {
      return providedImageUrl;
    }

    return this.persistedImageValue() ?? undefined;
  }

  private cleanOptionalString(value: string | null | undefined): string | undefined {
    const normalizedValue = value?.trim();
    return normalizedValue ? normalizedValue : undefined;
  }

  private sanitizeHtml(value: string | null | undefined): string {
    const html = value?.trim();
    if (!html) {
      return '';
    }

    return this.sanitizer.sanitize(SecurityContext.HTML, html) ?? '';
  }
}
