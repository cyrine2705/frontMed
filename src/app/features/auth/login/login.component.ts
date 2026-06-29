import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="auth-shell">
      <div class="auth-card">
        <div class="auth-card__header">
          <h1>MediScript</h1>
          <p>Sign in to your account</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
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
                   formControlName="password" autocomplete="current-password">
            <button mat-icon-button matSuffix type="button"
                    (click)="showPwd.set(!showPwd())">
              <mat-icon>{{ showPwd() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.get('password')?.invalid && form.get('password')?.touched) {
              <mat-error>Password required</mat-error>
            }
          </mat-form-field>

          @if (error()) {
            <div class="auth-error">{{ error() }}</div>
          }

          <button mat-flat-button color="primary" type="submit"
                  [disabled]="loading()">
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <p class="auth-footer">
          New patient? <a routerLink="/register">Create account</a>
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
      max-width: 400px;
      box-shadow: var(--shadow-card);

      &__header {
        margin-bottom: 32px;

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
export class LoginComponent {
  private readonly fb   = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly showPwd = signal(false);
  readonly loading = signal(false);
  readonly error   = signal('');

  readonly form = this.fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.auth.redirectToDashboard(),
      error: (err) => {
        this.error.set(err.error?.message ?? 'Invalid credentials. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
