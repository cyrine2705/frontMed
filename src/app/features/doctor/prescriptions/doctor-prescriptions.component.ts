import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AsyncPipe, DatePipe } from '@angular/common';
import { Observable, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, startWith, switchMap } from 'rxjs/operators';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PrescriptionService } from '../../../core/services/prescription.service';
import { MedicationService } from '../../../core/services/medication.service';
import { AuthService } from '../../../core/services/auth.service';
import { PdfGeneratorService } from '../../../core/services/pdf-generator.service';
import { MedicationResponse, PrescriptionResponse } from '../../../core/models';

interface LineGroup extends FormGroup {
  controls: {
    medicationSearch: FormControl<string>;
    medicationId: FormControl<string>;
    dosage: FormControl<string>;
    duration: FormControl<string>;
  };
}

@Component({
  selector: 'app-doctor-prescriptions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    AsyncPipe,
    DatePipe,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    MatTooltipModule,
  ],
  template: `
    <div class="page">
      <header class="page__header">
        <div class="page__header-row">
          <div>
            <h1>Prescriptions</h1>
            <p>Issue, revise, and review prescriptions</p>
          </div>
          <button mat-flat-button color="primary" (click)="toggleForm()">
            <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon>
            {{ showForm() ? 'Cancel' : 'New prescription' }}
          </button>
        </div>
      </header>

      @if (showForm()) {
        <mat-card class="form-card">
          <mat-card-content>
            <h2 class="form-section-title">
              {{ isEditMode() ? 'Edit prescription' : 'New prescription' }}
            </h2>

            <form [formGroup]="form" (ngSubmit)="submit()" class="rx-form">
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Patient reference</mat-label>
                <input matInput formControlName="patientId" placeholder="Enter patient functional ID">
                @if (form.get('patientId')?.invalid && form.get('patientId')?.touched) {
                  <mat-error>Required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Doctor notes (optional)</mat-label>
                <textarea matInput formControlName="doctorNotes" rows="2"></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Notification email (optional)</mat-label>
                <input matInput type="email" formControlName="recipientEmail">
              </mat-form-field>

              <div class="lines-section">
                <div class="lines-section__header">
                  <span class="lines-section__title">Medications</span>
                  <button mat-stroked-button type="button" (click)="addLine()">
                    <mat-icon>add</mat-icon>
                    Add medication
                  </button>
                </div>

                @for (line of lines.controls; track $index) {
                  <div class="rx-line" [formGroup]="castLine(line)">
                    <div class="rx-line__idx">{{ $index + 1 }}</div>

                    <div class="rx-line__fields">
                      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="rx-line__med">
                        <mat-label>Medication</mat-label>
                        <input
                          matInput
                          formControlName="medicationSearch"
                          [matAutocomplete]="auto"
                          (input)="clearMedId($index)"
                          placeholder="Type to search..."
                        >
                        <mat-autocomplete
                          #auto="matAutocomplete"
                          [displayWith]="displayMed"
                          (optionSelected)="onMedSelected($index, $event)"
                        >
                          @for (med of (lineResults[$index] | async); track med.id) {
                            <mat-option [value]="med">
                              <div class="med-option">
                                <span class="med-option__name">{{ med.name }}</span>
                                <span class="med-option__cat">{{ med.category }}</span>
                              </div>
                            </mat-option>
                          }
                        </mat-autocomplete>
                        @if (
                          castLine(line).controls.medicationId.invalid &&
                          castLine(line).controls.medicationSearch.touched
                        ) {
                          <mat-error>Select a medication from the list</mat-error>
                        }
                      </mat-form-field>

                      <mat-form-field appearance="outline" subscriptSizing="dynamic">
                        <mat-label>Dosage</mat-label>
                        <input matInput formControlName="dosage" placeholder="e.g. 500mg twice daily">
                        @if (castLine(line).controls.dosage.invalid && castLine(line).controls.dosage.touched) {
                          <mat-error>Required</mat-error>
                        }
                      </mat-form-field>

                      <mat-form-field appearance="outline" subscriptSizing="dynamic">
                        <mat-label>Duration</mat-label>
                        <input matInput formControlName="duration" placeholder="e.g. 7 days">
                        @if (castLine(line).controls.duration.invalid && castLine(line).controls.duration.touched) {
                          <mat-error>Required</mat-error>
                        }
                      </mat-form-field>
                    </div>

                    <button
                      mat-icon-button
                      type="button"
                      color="warn"
                      (click)="removeLine($index)"
                      [disabled]="lines.length === 1"
                    >
                      <mat-icon>remove_circle_outline</mat-icon>
                    </button>
                  </div>
                }

                @if (lines.controls.length === 0) {
                  <p class="lines-empty">Add at least one medication.</p>
                }
              </div>

              @if (formError()) {
                <div class="form-error">{{ formError() }}</div>
              }

              <div class="rx-form__actions">
                <button mat-stroked-button type="button" (click)="toggleForm()">Cancel</button>
                <button mat-flat-button color="primary" type="submit" [disabled]="saving()">
                  {{ saving() ? 'Saving...' : (isEditMode() ? 'Save changes' : 'Issue prescription') }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      <div class="rx-list">
        @for (rx of prescriptions(); track rx.id) {
          <mat-card class="rx-card">
            <mat-card-content>
              <div class="rx-card__header">
                <div>
                  <div class="rx-card__patient">Patient: {{ rx.patient ? rx.patient.firstName + ' ' + rx.patient.lastName : rx.patientId }}</div>
                  <div class="rx-card__date">Reference: {{ rx.patient?.functionalId ?? rx.patientId }}</div>
                  <div class="rx-card__date">{{ rx.createdAt | date:'MMM d, yyyy' }}</div>
                </div>
                <div class="rx-card__actions">
                  <button
                    mat-stroked-button
                    class="rx-card__download"
                    [disabled]="downloadingPrescriptionId() === rx.id"
                    (click)="downloadPdf(rx.id)"
                  >
                    <mat-icon>{{ downloadingPrescriptionId() === rx.id ? 'hourglass_top' : 'download' }}</mat-icon>
                    {{ downloadingPrescriptionId() === rx.id ? 'Preparing...' : 'PDF' }}
                  </button>
                  <button
                    mat-icon-button
                    color="primary"
                    matTooltip="Edit prescription"
                    (click)="edit(rx.id)"
                  >
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    color="warn"
                    matTooltip="Delete prescription"
                    (click)="delete(rx.id)"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>

              @if (rx.doctorNotes) {
                <p class="rx-card__notes">{{ rx.doctorNotes }}</p>
              }

              <div class="rx-lines">
                @for (line of rx.prescriptionLines; track line.id) {
                  <div class="rx-line-item">
                    <mat-icon>medication</mat-icon>
                    <div>
                      <span class="rx-line-item__name">{{ line.medicationName }}</span>
                      <span class="rx-line-item__detail">{{ line.dosage }} - {{ line.duration }}</span>
                    </div>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        }

        @if (prescriptions().length === 0 && !loading()) {
          <div class="list-empty">No prescriptions issued yet.</div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page__header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .form-card {
      margin-bottom: 16px;
    }

    .form-section-title {
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--color-text-1);
    }

    .rx-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .rx-form__actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 4px;
    }

    .form-error {
      background: #fee2e2;
      color: var(--color-danger);
      border-radius: var(--radius-md);
      padding: 10px 14px;
      font-size: 13px;
    }

    .lines-section {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .lines-section__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .lines-section__title {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-1);
    }

    .rx-line {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background: var(--color-surface-2);
      border-radius: var(--radius-md);
    }

    .rx-line__idx {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--color-primary);
      color: white;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 14px;
    }

    .rx-line__fields {
      flex: 1;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 8px;
    }

    .rx-line__med {
      grid-column: 1;
    }

    .lines-empty {
      color: var(--color-text-3);
      font-size: 13px;
      text-align: center;
      padding: 8px;
    }

    .med-option {
      display: flex;
      flex-direction: column;
      line-height: 1.3;
    }

    .med-option__name {
      font-size: 13px;
      font-weight: 500;
    }

    .med-option__cat {
      font-size: 11px;
      color: var(--color-text-3);
    }

    .rx-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .rx-card__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
      gap: 12px;
    }

    .rx-card__actions {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
      white-space: nowrap;
    }

    .rx-card__download {
      min-width: 108px;
      justify-content: center;
    }

    .rx-card__patient {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-1);
    }

    .rx-card__date {
      font-size: 12px;
      color: var(--color-text-3);
      margin-top: 2px;
    }

    .rx-card__notes {
      font-size: 13px;
      color: var(--color-text-2);
      margin-bottom: 12px;
      font-style: italic;
    }

    .rx-lines {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .rx-line-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .rx-line-item mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--color-primary);
      margin-top: 2px;
      flex-shrink: 0;
    }

    .rx-line-item__name {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-1);
    }

    .rx-line-item__detail {
      display: block;
      font-size: 12px;
      color: var(--color-text-3);
    }

    .list-empty {
      text-align: center;
      color: var(--color-text-3);
      padding: 48px;
      font-size: 14px;
    }

    @media (max-width: 980px) {
      .rx-line__fields {
        grid-template-columns: 1fr;
      }

      .page__header-row,
      .lines-section__header {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `],
})
export class DoctorPrescriptionsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly rxSvc = inject(PrescriptionService);
  private readonly medSvc = inject(MedicationService);
  private readonly auth = inject(AuthService);
  private readonly pdfGenerator = inject(PdfGeneratorService);

  readonly prescriptions = signal<PrescriptionResponse[]>([]);
  readonly showForm = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly downloadingPrescriptionId = signal<string | null>(null);
  readonly formError = signal('');
  readonly editingPrescriptionId = signal<string | null>(null);
  readonly isEditMode = computed(() => this.editingPrescriptionId() !== null);

  lineResults: Observable<MedicationResponse[]>[] = [];

  readonly form = this.fb.nonNullable.group({
    patientId: ['', Validators.required],
    doctorNotes: [''],
    recipientEmail: [''],
    lines: this.fb.array<LineGroup>([]),
  });

  get lines(): FormArray<LineGroup> {
    return this.form.get('lines') as FormArray<LineGroup>;
  }

  castLine(control: unknown): LineGroup {
    return control as LineGroup;
  }

  ngOnInit(): void {
    this.loadPrescriptions();
    this.resetFormState();
  }

  private loadPrescriptions(): void {
    this.loading.set(true);
    const doctorId = this.auth.currentUser()!.id;
    this.rxSvc.getByDoctor(doctorId).subscribe({
      next: (list) => {
        this.prescriptions.set(
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleForm(): void {
    const nextState = !this.showForm();
    this.showForm.set(nextState);

    if (nextState) {
      if (!this.isEditMode()) {
        this.resetFormState();
      }
    } else {
      this.resetFormState();
    }
  }

  edit(prescriptionId: string): void {
    this.formError.set('');
    this.loading.set(true);
    this.showForm.set(true);

    this.rxSvc.getDetails(prescriptionId).subscribe({
      next: (prescription) => {
        this.editingPrescriptionId.set(prescription.id);
        this.populateForm(prescription);
        this.loading.set(false);
      },
      error: (err) => {
        this.formError.set(err.error?.message ?? 'Failed to load prescription details.');
        this.loading.set(false);
      },
    });
  }

  addLine(): void {
    const group = this.createLineGroup();
    this.lines.push(group);
    this.lineResults.push(this.createLineSearchStream(group));
  }

  removeLine(index: number): void {
    if (this.lines.length <= 1) {
      return;
    }

    this.lines.removeAt(index);
    this.lineResults.splice(index, 1);
  }

  onMedSelected(index: number, event: MatAutocompleteSelectedEvent): void {
    const med = event.option.value as MedicationResponse;
    const line = this.lines.at(index) as unknown as LineGroup;
    line.controls.medicationId.setValue(med.id);
    line.controls.medicationSearch.setValue(med.name);
  }

  clearMedId(index: number): void {
    const line = this.lines.at(index) as unknown as LineGroup;
    if (line.controls.medicationId.value) {
      line.controls.medicationId.setValue('');
    }
  }

  displayMed = (med: MedicationResponse | string | null): string => {
    if (!med) {
      return '';
    }

    return typeof med === 'string' ? med : med.name;
  };

  submit(): void {
    if (this.form.invalid || this.lines.length === 0) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.formError.set('');

    const raw = this.form.getRawValue();
    const payload = {
      doctorId: this.auth.currentUser()!.id,
      patientId: raw.patientId,
      doctorNotes: raw.doctorNotes || undefined,
      recipientEmail: raw.recipientEmail || undefined,
      prescriptionLines: raw.lines.map((line: { medicationId: string; dosage: string; duration: string }) => ({
        medicationId: line.medicationId,
        dosage: line.dosage,
        duration: line.duration,
      })),
    };

    const request$ = this.editingPrescriptionId()
      ? this.rxSvc.update(this.editingPrescriptionId()!, payload)
      : this.rxSvc.create(payload);

    request$.subscribe({
      next: (prescription) => {
        this.prescriptions.update((items) => {
          const exists = items.some((item) => item.id === prescription.id);
          if (!exists) {
            return [prescription, ...items];
          }

          return items.map((item) => (item.id === prescription.id ? prescription : item));
        });

        this.toggleForm();
        this.saving.set(false);
      },
      error: (err) => {
        this.formError.set(
          err.error?.message ?? (this.isEditMode() ? 'Failed to update prescription.' : 'Failed to issue prescription.')
        );
        this.saving.set(false);
      },
    });
  }

  delete(id: string): void {
    if (!confirm('Delete this prescription?')) {
      return;
    }

    this.rxSvc.delete(id).subscribe({
      next: () => this.prescriptions.update((items) => items.filter((prescription) => prescription.id !== id)),
    });
  }

  downloadPdf(id: string): void {
    this.downloadingPrescriptionId.set(id);

    this.rxSvc.getDetails(id).subscribe({
      next: (prescription) => {
        this.pdfGenerator.downloadPrescriptionPdf(prescription);
        this.downloadingPrescriptionId.set(null);
      },
      error: () => {
        this.formError.set('Failed to generate the prescription PDF.');
        this.downloadingPrescriptionId.set(null);
      },
    });
  }

  private populateForm(prescription: PrescriptionResponse): void {
    this.lines.clear();
    this.lineResults = [];

    this.form.patchValue({
      patientId: prescription.patientId,
      doctorNotes: prescription.doctorNotes ?? '',
      recipientEmail: prescription.recipientEmail ?? '',
    });

    if (prescription.prescriptionLines.length === 0) {
      this.addLine();
      return;
    }

    prescription.prescriptionLines.forEach((line) => {
      const group = this.createLineGroup(
        line.medicationName ?? '',
        line.medicationId,
        line.dosage,
        line.duration,
      );
      this.lines.push(group);
      this.lineResults.push(this.createLineSearchStream(group));
    });
  }

  private resetFormState(): void {
    this.form.reset();
    this.lines.clear();
    this.lineResults = [];
    this.editingPrescriptionId.set(null);
    this.addLine();
  }

  private createLineGroup(
    medicationSearch = '',
    medicationId = '',
    dosage = '',
    duration = '',
  ): LineGroup {
    return this.fb.nonNullable.group({
      medicationSearch: [medicationSearch],
      medicationId: [medicationId, Validators.required],
      dosage: [dosage, Validators.required],
      duration: [duration, Validators.required],
    }) as unknown as LineGroup;
  }

  private createLineSearchStream(group: LineGroup): Observable<MedicationResponse[]> {
    return group.controls.medicationSearch.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter((value) => typeof value === 'string' && value.length >= 2),
      switchMap((value) => this.medSvc.search(value).pipe(catchError(() => of([])))),
      startWith([]),
    );
  }
}
