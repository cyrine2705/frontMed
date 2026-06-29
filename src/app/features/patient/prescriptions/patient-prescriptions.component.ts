import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { PrescriptionService } from '../../../core/services/prescription.service';
import { AuthService } from '../../../core/services/auth.service';
import { PrescriptionResponse } from '../../../core/models';

@Component({
  selector: 'app-patient-prescriptions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatCardModule, MatExpansionModule, MatIconModule],
  template: `
    <div class="page">
      <header class="page__header">
        <h1>Prescriptions</h1>
        <p>Your prescription history</p>
      </header>

      @if (prescriptions().length === 0 && !loading()) {
        <div class="list-empty">No prescriptions on file.</div>
      }

      <div class="rx-list">
        @for (rx of prescriptions(); track rx.id) {
          <mat-card class="rx-card">
            <mat-card-content>
              <div class="rx-card__header">
                <div>
                  <div class="rx-card__doctor">
                    Dr. {{ rx.doctor ? rx.doctor.lastName : rx.doctorId }}
                  </div>
                  <div class="rx-card__date">Issued {{ rx.createdAt | date:'MMMM d, yyyy' }}</div>
                </div>
                <span class="badge badge--blue">{{ rx.prescriptionLines.length }} med(s)</span>
              </div>

              @if (rx.doctorNotes) {
                <p class="rx-card__notes">
                  <mat-icon>notes</mat-icon> {{ rx.doctorNotes }}
                </p>
              }

              <div class="rx-lines">
                @for (line of rx.prescriptionLines; track line.id) {
                  <div class="rx-line">
                    <div class="rx-line__name">{{ line.medicationName }}</div>
                    <div class="rx-line__detail">
                      <span class="badge badge--gray">{{ line.dosage }}</span>
                      <span class="badge badge--gray">{{ line.duration }}</span>
                    </div>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .list-empty {
      text-align: center;
      color: var(--color-text-3);
      padding: 64px;
      font-size: 14px;
    }

    .rx-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .rx-card mat-card-content {
      padding: 20px !important;
    }

    .rx-card__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .rx-card__doctor {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text-1);
    }

    .rx-card__date {
      font-size: 12px;
      color: var(--color-text-3);
      margin-top: 2px;
    }

    .rx-card__notes {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 13px;
      color: var(--color-text-2);
      font-style: italic;
      margin-bottom: 12px;
      background: var(--color-surface-2);
      border-radius: var(--radius-md);
      padding: 8px 12px;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        margin-top: 1px;
        color: var(--color-text-3);
      }
    }

    .rx-lines {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .rx-line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);

      &__name {
        font-size: 13px;
        font-weight: 500;
        color: var(--color-text-1);
      }

      &__detail {
        display: flex;
        gap: 6px;
      }
    }
  `],
})
export class PatientPrescriptionsComponent implements OnInit {
  private readonly rxSvc = inject(PrescriptionService);
  private readonly auth  = inject(AuthService);

  readonly prescriptions = signal<PrescriptionResponse[]>([]);
  readonly loading       = signal(false);

  ngOnInit(): void {
    this.loading.set(true);
    const patientId = this.auth.currentUser()!.id;
    this.rxSvc.getByPatient(patientId).subscribe({
      next: (list) => {
        this.prescriptions.set(
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
