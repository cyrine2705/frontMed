import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { MedicationService } from '../../core/services/medication.service';
import { DoctorResponse, MedicationResponse } from '../../core/models';

@Component({
  selector: 'app-guest',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  styles: [`
    :host { display: block; background: var(--color-surface-2); min-height: 100vh; }

    .nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 48px;
      height: 64px;
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav__brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-primary);
    }
    .nav__brand mat-icon { color: var(--color-primary); font-size: 1.5rem; }
    .nav__actions { display: flex; gap: 8px; }

    .hero {
      display: flex;
      align-items: center;
      gap: 48px;
      max-width: 1140px;
      margin: 0 auto;
      padding: 72px 48px;
      min-height: 440px;
    }
    .hero__content { flex: 1; }
    .hero__title {
      font-size: 2.625rem;
      font-weight: 700;
      line-height: 1.15;
      color: var(--color-text-1);
      margin-bottom: 20px;
      letter-spacing: -0.03em;
    }
    .hero__accent { color: var(--color-primary); }
    .hero__sub {
      font-size: 1rem;
      color: var(--color-text-2);
      line-height: 1.65;
      max-width: 500px;
      margin-bottom: 32px;
    }
    .hero__ctas { display: flex; gap: 12px; flex-wrap: wrap; }
    .hero__visual {
      flex: 0 0 300px;
      height: 300px;
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, rgba(37,99,235,.1) 0%, rgba(37,99,235,.04) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .hero__icon {
      font-size: 8rem !important;
      width: 8rem !important;
      height: 8rem !important;
      color: var(--color-primary);
      opacity: .55;
    }

    .stats {
      background: var(--color-primary);
      color: #fff;
      display: flex;
      justify-content: space-around;
      padding: 40px 48px;
    }
    .stat { text-align: center; }
    .stat__val { display: block; font-size: 2rem; font-weight: 700; }
    .stat__lbl { display: block; font-size: .875rem; opacity: .8; margin-top: 4px; }

    .features {
      max-width: 1140px;
      margin: 0 auto;
      padding: 72px 48px;
    }
    .features__grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-top: 32px;
    }
    .feat-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 24px;
      box-shadow: var(--shadow-card);
    }
    .feat-card mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      color: var(--color-primary);
      margin-bottom: 12px;
    }
    .feat-card h3 { font-size: .9375rem; font-weight: 600; color: var(--color-text-1); margin-bottom: 8px; }
    .feat-card p { font-size: .875rem; color: var(--color-text-2); line-height: 1.55; margin: 0; }

    .section-head { margin-bottom: 0; }
    .section-title { font-size: 1.5rem; font-weight: 700; color: var(--color-text-1); }
    .section-sub { font-size: .9375rem; color: var(--color-text-2); margin-top: 4px; }

    .doctors {
      background: var(--color-surface);
      padding: 72px 48px;
    }
    .doctors__inner { max-width: 1140px; margin: 0 auto; }
    .doctors__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
      margin-top: 32px;
    }
    .doc-card {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 20px;
      display: flex;
      gap: 16px;
      align-items: flex-start;
      background: var(--color-surface);
      box-shadow: var(--shadow-card);
    }
    .doc-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--color-primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: .9375rem;
      flex-shrink: 0;
    }
    .doc-info { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .doc-name { font-size: .9375rem; font-weight: 600; color: var(--color-text-1); }
    .doc-loc {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: .8125rem;
      color: var(--color-text-2);
    }
    .doc-loc mat-icon {
      font-size: .875rem !important;
      width: .875rem !important;
      height: .875rem !important;
    }

    .medications {
      max-width: 1140px;
      margin: 0 auto;
      padding: 72px 48px;
    }
    .meds-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 32px;
    }
    .meds-header mat-form-field { width: 280px; }
    .meds-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 16px;
    }
    .med-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: var(--shadow-card);
    }
    .med-card__top { display: flex; align-items: center; gap: 10px; }
    .med-card__top mat-icon { color: var(--color-primary); }
    .med-name { font-size: .9375rem; font-weight: 600; color: var(--color-text-1); }
    .med-lab { font-size: .8125rem; color: var(--color-text-2); }
    .med-desc {
      font-size: .8125rem;
      color: var(--color-text-2);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .loading-row { display: flex; justify-content: center; padding: 48px 0; }
    .empty { text-align: center; color: var(--color-text-2); padding: 48px 0; font-size: .9375rem; }

    .footer {
      background: var(--color-text-1);
      color: rgba(255,255,255,.6);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 48px;
      font-size: .875rem;
    }
    .footer__links { display: flex; gap: 24px; }
    .footer__links a { color: rgba(255,255,255,.6); text-decoration: none; }
    .footer__links a:hover { color: #fff; }
  `],
  template: `
    <nav class="nav">
      <div class="nav__brand">
        <mat-icon>medical_services</mat-icon>
        MediScript
      </div>
      <div class="nav__actions">
        @if (auth.isAuthenticated()) {
          <button mat-flat-button color="primary" (click)="auth.redirectToDashboard()">
            Go to Dashboard
          </button>
        } @else {
          <button mat-stroked-button routerLink="/login">Sign In</button>
          <button mat-flat-button color="primary" routerLink="/register">Get Started</button>
        }
      </div>
    </nav>

    <section class="hero">
      <div class="hero__content">
        <h1 class="hero__title">
          Smart Prescriptions.<br>
          <span class="hero__accent">Better Patient Care.</span>
        </h1>
        <p class="hero__sub">
          MediScript is a digital clinical platform connecting doctors and patients
          for seamless prescription management, appointment scheduling,
          and AI-assisted health consultations.
        </p>
        <div class="hero__ctas">
          @if (!auth.isAuthenticated()) {
            <button mat-flat-button color="primary" routerLink="/register">
              Create Patient Account
            </button>
            <button mat-stroked-button routerLink="/login">
              Sign In as Doctor / Admin
            </button>
          }
          <button mat-button routerLink="/doctors">
            Browse Doctors
          </button>
          <button mat-button routerLink="/medications">
            Browse Medications
          </button>
        </div>
      </div>
      <div class="hero__visual">
        <mat-icon class="hero__icon">monitor_heart</mat-icon>
      </div>
    </section>

    <section class="stats">
      <div class="stat">
        <span class="stat__val">{{ doctors().length }}+</span>
        <span class="stat__lbl">Certified Doctors</span>
      </div>
      <div class="stat">
        <span class="stat__val">{{ medications().length }}+</span>
        <span class="stat__lbl">Medications</span>
      </div>
      <div class="stat">
        <span class="stat__val">24/7</span>
        <span class="stat__lbl">AI Health Assistant</span>
      </div>
      <div class="stat">
        <span class="stat__val">100%</span>
        <span class="stat__lbl">Digital Prescriptions</span>
      </div>
    </section>

    <section class="features">
      <div class="section-head">
        <h2 class="section-title">Everything in one platform</h2>
        <p class="section-sub">Built for clinics, doctors, and patients alike.</p>
      </div>
      <div class="features__grid">
        <div class="feat-card">
          <mat-icon>event</mat-icon>
          <h3>Appointment Booking</h3>
          <p>Schedule and manage appointments with your doctor directly through the platform.</p>
        </div>
        <div class="feat-card">
          <mat-icon>description</mat-icon>
          <h3>Digital Prescriptions</h3>
          <p>Receive and manage prescriptions digitally, with secure email delivery.</p>
        </div>
        <div class="feat-card">
          <mat-icon>smart_toy</mat-icon>
          <h3>AI Health Chat</h3>
          <p>Get quick health guidance from our AI assistant powered by your doctor's context.</p>
        </div>
        <div class="feat-card">
          <mat-icon>medication</mat-icon>
          <h3>Medication Catalog</h3>
          <p>Browse an extensive database of medications with detailed clinical information.</p>
        </div>
      </div>
    </section>

    <section class="doctors">
      <div class="doctors__inner">
        <div class="section-head">
          <h2 class="section-title">Our Medical Team</h2>
          <p class="section-sub">Certified specialists across multiple disciplines.</p>
        </div>
        @if (loading()) {
          <div class="loading-row"><mat-spinner diameter="40" /></div>
        } @else if (doctors().length === 0) {
          <p class="empty">No doctors available at the moment.</p>
        } @else {
          <div class="doctors__grid">
            @for (doc of doctors(); track doc.id) {
              <div class="doc-card">
                <div class="doc-avatar">{{ doc.firstName[0] }}{{ doc.lastName[0] }}</div>
                <div class="doc-info">
                  <span class="doc-name">Dr. {{ doc.firstName }} {{ doc.lastName }}</span>
                  <span class="badge badge--blue">{{ doc.specialty }}</span>
                  @if (doc.clinicAddress) {
                    <span class="doc-loc">
                      <mat-icon>location_on</mat-icon>{{ doc.clinicAddress }}
                    </span>
                  }
                  <div>
                    <button mat-button color="primary" [routerLink]="['/doctors', doc.id]">
                      View profile
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </section>

    <section class="medications">
      <div class="meds-header">
        <div class="section-head">
          <h2 class="section-title">Medication Catalog</h2>
          <p class="section-sub">{{ medications().length }} medications in our database.</p>
        </div>
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Search medications…</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput (input)="onSearch($any($event.target).value)"
                 placeholder="Name, category or laboratory">
        </mat-form-field>
      </div>
      @if (loading()) {
        <div class="loading-row"><mat-spinner diameter="40" /></div>
      } @else if (filteredMeds().length === 0) {
        <p class="empty">No medications match your search.</p>
      } @else {
        <div class="meds-grid">
          @for (med of filteredMeds(); track med.id) {
            <div class="med-card">
              <div class="med-card__top">
                <mat-icon>medication</mat-icon>
                <span class="med-name">{{ med.name }}</span>
              </div>
              <span class="badge badge--gray">{{ med.category }}</span>
              @if (med.laboratory) {
                <span class="med-lab">{{ med.laboratory }}</span>
              }
              @if (med.description) {
                <p class="med-desc">{{ getMedicationExcerpt(med.description) }}</p>
              }
              <button mat-button color="primary" [routerLink]="['/medications', med.id]">
                View details
              </button>
            </div>
          }
        </div>
      }
    </section>

    <footer class="footer">
      <span>© 2024 MediScript — Digital Clinical Platform</span>
      <div class="footer__links">
        <a routerLink="/login">Sign In</a>
        <a routerLink="/register">Register</a>
      </div>
    </footer>
  `,
})
export class GuestComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly userSvc = inject(UserService);
  private readonly medSvc = inject(MedicationService);

  readonly doctors     = signal<DoctorResponse[]>([]);
  readonly medications = signal<MedicationResponse[]>([]);
  readonly searchQuery = signal('');
  readonly loading     = signal(true);

  readonly filteredMeds = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const meds = this.medications();
    if (!q) return meds;
    return meds.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      (m.laboratory ?? '').toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    forkJoin({
      doctors: this.userSvc.getPublicDoctors(),
      medications: this.medSvc.getAllPublic(),
    }).subscribe({
      next: ({ doctors, medications }) => {
        this.doctors.set(doctors);
        this.medications.set(medications);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
  }

  getMedicationExcerpt(description?: string): string {
    if (!description) {
      return '';
    }

    const plainText = description
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (plainText.length <= 120) {
      return plainText;
    }

    return `${plainText.slice(0, 117)}...`;
  }
}
