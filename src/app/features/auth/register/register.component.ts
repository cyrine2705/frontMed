import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { AuthService } from '../../../core/services/auth.service';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

@Component({
  selector: 'app-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
  ],
  template: `
    <div class="auth-shell">
      <div class="auth-card">
        <div class="auth-card__header">
          <h1>MediScript</h1>
          <p>Create a patient account</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
          <div class="auth-form__row">
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
            <input matInput type="email" formControlName="email" autocomplete="email">
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <mat-error>Valid email required</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Password</mat-label>
            <input matInput [type]="showPwd() ? 'text' : 'password'"
                   formControlName="password" autocomplete="new-password">
            <button mat-icon-button matSuffix type="button"
                    (click)="showPwd.set(!showPwd())">
              <mat-icon>{{ showPwd() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.get('password')?.hasError('minlength') && form.get('password')?.touched) {
              <mat-error>Minimum 8 characters</mat-error>
            }
            @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
              <mat-error>Required</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Date of birth</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="birthDate">
            <mat-datepicker-toggle matIconSuffix [for]="picker" />
            <mat-datepicker #picker />
            @if (form.get('birthDate')?.invalid && form.get('birthDate')?.touched) {
              <mat-error>Required</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Social security number</mat-label>
            <input matInput formControlName="socialSecurityNumber">
            @if (form.get('socialSecurityNumber')?.invalid && form.get('socialSecurityNumber')?.touched) {
              <mat-error>Required</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Blood type</mat-label>
            <mat-select formControlName="bloodType">
              @for (bt of bloodTypes; track bt) {
                <mat-option [value]="bt">{{ bt }}</mat-option>
              }
            </mat-select>
            @if (form.get('bloodType')?.invalid && form.get('bloodType')?.touched) {
              <mat-error>Required</mat-error>
            }
          </mat-form-field>

          @if (error()) {
            <div class="auth-error">{{ error() }}</div>
          }

          <button mat-flat-button color="primary" type="submit" [disabled]="loading()">
            {{ loading() ? 'Creating account…' : 'Create account' }}
          </button>
        </form>

        <p class="auth-footer">
          Already have an account? <a routerLink="/login">Sign in</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-shell {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-surface-2);
      padding: 24px;
    }

    .auth-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 40px;
      width: 100%;
      max-width: 480px;
      box-shadow: var(--shadow-card);
      margin: 24px 0;

      &__header {
        margin-bottom: 28px;

        h1 {
          font-size: 22px;
          font-weight: 700;
          color: var(--color-primary);
          letter-spacing: -.02em;
        }

        p {
          font-size: 14px;
          color: var(--color-text-2);
          margin-top: 4px;
        }
      }
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 16px;

      &__row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      button[type="submit"] {
        height: 44px;
        font-size: 15px;
        font-weight: 600;
        margin-top: 4px;
      }
    }

    .auth-error {
      background: #fee2e2;
      color: var(--color-danger);
      border-radius: var(--radius-md);
      padding: 10px 14px;
      font-size: 13px;
    }

    .auth-footer {
      text-align: center;
      margin-top: 20px;
      font-size: 13px;
      color: var(--color-text-2);

      a {
        color: var(--color-primary);
        text-decoration: none;
        font-weight: 500;
        &:hover { text-decoration: underline; }
      }
    }
  `],
})
export class RegisterComponent {
  private readonly fb   = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly bloodTypes = BLOOD_TYPES;
  readonly showPwd  = signal(false);
  readonly loading  = signal(false);
  readonly error    = signal('');

  readonly form = this.fb.nonNullable.group({
    firstName:            ['', Validators.required],
    lastName:             ['', Validators.required],
    email:                ['', [Validators.required, Validators.email]],
    password:             ['', [Validators.required, Validators.minLength(8)]],
    birthDate:            [null as Date | null, Validators.required],
    socialSecurityNumber: ['', Validators.required],
    bloodType:            ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');

    const raw = this.form.getRawValue();
    const birthDate = raw.birthDate instanceof Date
      ? raw.birthDate.toISOString().split('T')[0]
      : '';

    this.auth.registerPatient({
      firstName:            raw.firstName,
      lastName:             raw.lastName,
      email:                raw.email,
      password:             raw.password,
      birthDate,
      socialSecurityNumber: raw.socialSecurityNumber,
      bloodType:            raw.bloodType,
    }).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err) => {
        this.error.set(err.error?.message ?? 'Registration failed. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
