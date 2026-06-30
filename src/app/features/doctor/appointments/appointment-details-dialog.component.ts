import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AppointmentResponse, AppointmentStatus } from '../../../core/models';
import { fromLocalDateTimeString } from '../../../core/utils/datetime.util';

export interface AppointmentDetailsDialogData {
  appointment: AppointmentResponse;
  patientLabel: string;
}

export interface AppointmentDetailsDialogResult {
  status: AppointmentStatus;
}

@Component({
  selector: 'app-appointment-details-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './appointment-details-dialog.component.html',
  styleUrl: './appointment-details-dialog.component.scss',
})
export class AppointmentDetailsDialogComponent {
  readonly data = inject<AppointmentDetailsDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<AppointmentDetailsDialogComponent, AppointmentDetailsDialogResult | undefined>>(MatDialogRef);

  readonly appointment = this.data.appointment;

  close(): void {
    this.dialogRef.close();
  }

  setStatus(status: AppointmentStatus): void {
    this.dialogRef.close({ status });
  }

  formatDateTime(dateTime: string): string {
    return fromLocalDateTimeString(dateTime).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
}
