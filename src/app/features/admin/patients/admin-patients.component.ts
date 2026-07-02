import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from '../../../core/services/user.service';
import { PatientResponse } from '../../../core/models';

@Component({
  selector: 'app-admin-patients',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule, MatTableModule, MatTooltipModule],
  template: `
    <div class="page">
      <header class="page__header">
        <h1>Patients</h1>
        <p>View and manage patient accounts</p>
      </header>

      <mat-card class="table-card">
        <table mat-table [dataSource]="patients()">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let p">{{ p.firstName }} {{ p.lastName }}</td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let p">{{ p.email }}</td>
          </ng-container>

          <ng-container matColumnDef="bloodType">
            <th mat-header-cell *matHeaderCellDef>Blood type</th>
            <td mat-cell *matCellDef="let p">{{ p.bloodType }}</td>
          </ng-container>

          <ng-container matColumnDef="ssn">
            <th mat-header-cell *matHeaderCellDef>SSN</th>
            <td mat-cell *matCellDef="let p">
              {{ p.maskedSocialSecurityNumber || p.socialSecurityNumber || 'N/A' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let p">
              <span class="badge"
                    [class.badge--green]="p.isActive"
                    [class.badge--red]="!p.isActive">
                {{ p.isActive ? 'Active' : 'Archived' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let p">
              <div class="actions-cell">
                <button
                  mat-icon-button
                  color="primary"
                  matTooltip="View patient profile"
                  [routerLink]="['/admin/patients', p.id]"
                >
                  <mat-icon>visibility</mat-icon>
                </button>

                @if (p.isActive) {
                  <button mat-stroked-button color="warn"
                          matTooltip="Archive patient"
                          (click)="archive(p.id)">
                    <mat-icon>archive</mat-icon>
                    Archive
                  </button>
                } @else {
                  <button mat-stroked-button color="primary"
                          matTooltip="Unarchive patient"
                          (click)="unarchive(p.id)">
                    <mat-icon>unarchive</mat-icon>
                    Unarchive
                  </button>
                }
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>

        @if (patients().length === 0 && !loading()) {
          <div class="table-empty">No patients found.</div>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .table-card {
      overflow: hidden;
      table { width: 100%; }
    }

    .actions-cell {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      white-space: nowrap;
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
export class AdminPatientsComponent implements OnInit {
  private readonly userSvc = inject(UserService);

  readonly columns  = ['name', 'email', 'bloodType', 'ssn', 'status', 'actions'];
  readonly patients = signal<PatientResponse[]>([]);
  readonly loading  = signal(false);

  ngOnInit(): void {
    this.loading.set(true);
    this.userSvc.getPatients().subscribe({
      next: (list) => { this.patients.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  archive(id: string): void {
    if (!confirm('Archive this patient?')) return;
    this.userSvc.archivePatient(id).subscribe({
      next: (updated) =>
        this.patients.update(list => list.map(p => p.id === id ? updated : p)),
    });
  }

  unarchive(id: string): void {
    this.userSvc.unarchivePatient(id).subscribe({
      next: (updated) =>
        this.patients.update(list => list.map(p => p.id === id ? updated : p)),
    });
  }
}
