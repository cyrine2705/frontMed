import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from '../../../core/services/user.service';
import { DoctorResponse } from '../../../core/models';

@Component({
  selector: 'app-admin-doctors',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule, MatCardModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatTableModule, MatTooltipModule,
  ],
  template: `
    <div class="page">
      <header class="page__header">
        <div class="page__header-row">
          <div>
            <h1>Doctors</h1>
            <p>Manage doctor accounts</p>
          </div>
          <button mat-flat-button color="primary" (click)="showForm.set(!showForm())">
            <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon>
            {{ showForm() ? 'Cancel' : 'Add doctor' }}
          </button>
        </div>
      </header>

      @if (showForm()) {
        <mat-card class="form-card">
          <mat-card-content>
            <h2 class="form-card__title">New doctor</h2>
            <form [formGroup]="form" (ngSubmit)="submit()" class="doctor-form">
              <div class="doctor-form__row">
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>First name</mat-label>
                  <input matInput formControlName="firstName">
                  @if (form.get('firstName')?.invalid && form.get('firstName')?.touched) {
                    <mat-error>Required</mat-error>
                  }
                </mat-form-field>
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>Last name</mat-label>
                  <input matInput formControlName="lastName">
                  @if (form.get('lastName')?.invalid && form.get('lastName')?.touched) {
                    <mat-error>Required</mat-error>
                  }
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email">
                @if (form.get('email')?.invalid && form.get('email')?.touched) {
                  <mat-error>Valid email required</mat-error>
                }
              </mat-form-field>

              <div class="doctor-form__row">
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>Specialty</mat-label>
                  <input matInput formControlName="specialty">
                  @if (form.get('specialty')?.invalid && form.get('specialty')?.touched) {
                    <mat-error>Required</mat-error>
                  }
                </mat-form-field>
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>License number</mat-label>
                  <input matInput formControlName="medicalLicenseNumber">
                  @if (form.get('medicalLicenseNumber')?.invalid && form.get('medicalLicenseNumber')?.touched) {
                    <mat-error>Required</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="doctor-form__row">
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>Phone (optional)</mat-label>
                  <input matInput formControlName="phoneNumber">
                </mat-form-field>
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>Password</mat-label>
                  <input matInput type="password" formControlName="password">
                  @if (form.get('password')?.hasError('minlength') && form.get('password')?.touched) {
                    <mat-error>Minimum 8 characters</mat-error>
                  }
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Clinic address (optional)</mat-label>
                <input matInput formControlName="clinicAddress">
              </mat-form-field>

              @if (formError()) {
                <div class="form-error">{{ formError() }}</div>
              }

              <div class="doctor-form__actions">
                <button mat-stroked-button type="button" (click)="showForm.set(false)">Cancel</button>
                <button mat-flat-button color="primary" type="submit" [disabled]="saving()">
                  {{ saving() ? 'Creating…' : 'Create doctor' }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      <mat-card class="table-card">
        <table mat-table [dataSource]="doctors()" class="w-full">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let d">
              {{ d.firstName }} {{ d.lastName }}
            </td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let d">{{ d.email }}</td>
          </ng-container>

          <ng-container matColumnDef="specialty">
            <th mat-header-cell *matHeaderCellDef>Specialty</th>
            <td mat-cell *matCellDef="let d">{{ d.specialty }}</td>
          </ng-container>

          <ng-container matColumnDef="license">
            <th mat-header-cell *matHeaderCellDef>License</th>
            <td mat-cell *matCellDef="let d">{{ d.medicalLicenseNumber }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let d">
              <span class="badge" [class.badge--green]="d.isActive" [class.badge--red]="!d.isActive">
                {{ d.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let d">
              <button mat-icon-button color="warn"
                      matTooltip="Delete doctor"
                      (click)="deleteDoctor(d.id)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>

        @if (doctors().length === 0 && !loading()) {
          <div class="table-empty">No doctors found.</div>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .page__header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .form-card {
      margin-bottom: 16px;

      &__title {
        font-size: 15px;
        font-weight: 600;
        margin-bottom: 16px;
        color: var(--color-text-1);
      }
    }

    .doctor-form {
      display: flex;
      flex-direction: column;
      gap: 12px;

      &__row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      &__actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 4px;
      }
    }

    .form-error {
      background: #fee2e2;
      color: var(--color-danger);
      border-radius: var(--radius-md);
      padding: 10px 14px;
      font-size: 13px;
    }

    .table-card {
      overflow: hidden;

      table { width: 100%; }
    }

    .table-empty {
      padding: 32px;
      text-align: center;
      color: var(--color-text-3);
      font-size: 14px;
    }

    th.mat-mdc-header-cell, td.mat-mdc-cell {
      padding: 12px 16px !important;
      font-size: 13px;
    }

    th.mat-mdc-header-cell {
      color: var(--color-text-2);
      font-weight: 600;
    }
  `],
})
export class AdminDoctorsComponent implements OnInit {
  private readonly fb       = inject(FormBuilder);
  private readonly userSvc  = inject(UserService);

  readonly columns  = ['name', 'email', 'specialty', 'license', 'status', 'actions'];
  readonly doctors  = signal<DoctorResponse[]>([]);
  readonly showForm = signal(false);
  readonly loading  = signal(false);
  readonly saving   = signal(false);
  readonly formError = signal('');

  readonly form = this.fb.nonNullable.group({
    firstName:            ['', Validators.required],
    lastName:             ['', Validators.required],
    email:                ['', [Validators.required, Validators.email]],
    specialty:            ['', Validators.required],
    medicalLicenseNumber: ['', Validators.required],
    phoneNumber:          [''],
    clinicAddress:        [''],
    password:             ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    this.loadDoctors();
  }

  private loadDoctors(): void {
    this.loading.set(true);
    this.userSvc.getDoctors().subscribe({
      next: (list) => { this.doctors.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.formError.set('');

    const raw = this.form.getRawValue();
    this.userSvc.createDoctor({
      firstName:            raw.firstName,
      lastName:             raw.lastName,
      email:                raw.email,
      specialty:            raw.specialty,
      medicalLicenseNumber: raw.medicalLicenseNumber,
      phoneNumber:          raw.phoneNumber || undefined,
      clinicAddress:        raw.clinicAddress || undefined,
      password:             raw.password || undefined,
    }).subscribe({
      next: (doc) => {
        this.doctors.update(list => [doc, ...list]);
        this.form.reset();
        this.showForm.set(false);
        this.saving.set(false);
      },
      error: (err) => {
        this.formError.set(err.error?.message ?? 'Failed to create doctor.');
        this.saving.set(false);
      },
    });
  }

  deleteDoctor(id: string): void {
    if (!confirm('Delete this doctor?')) return;
    this.userSvc.deleteDoctor(id).subscribe({
      next: () => this.doctors.update(list => list.filter(d => d.id !== id)),
    });
  }
}
