import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { PatientResponse } from '../../../core/models';
import { extractTime, fromLocalDateTimeString, toLocalDateTimeString } from '../../../core/utils/datetime.util';

export interface AppointmentScheduleDialogData {
  patients: PatientResponse[];
  loadingPatients: boolean;
  initialStartDateTime: string;
  initialEndDateTime: string;
}

export interface AppointmentScheduleDialogResult {
  patientId: string;
  startDateTime: string;
  endDateTime: string;
  reason: string;
  recipientEmail?: string;
}

@Component({
  selector: 'app-appointment-schedule-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './appointment-schedule-dialog.component.html',
  styleUrl: './appointment-schedule-dialog.component.scss',
})
export class AppointmentScheduleDialogComponent {
  readonly data = inject<AppointmentScheduleDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<AppointmentScheduleDialogComponent, AppointmentScheduleDialogResult | undefined>>(MatDialogRef);
  private readonly formBuilder = inject(FormBuilder);

  private readonly initialStartDate = fromLocalDateTimeString(this.data.initialStartDateTime);
  private readonly initialEndDate = fromLocalDateTimeString(this.data.initialEndDateTime);

  readonly patientOptions = computed(() =>
    this.data.patients.map((patient) => ({
      id: patient.id,
      label: `${patient.firstName} ${patient.lastName}`,
      helper: patient.email,
    })),
  );

  readonly form = this.formBuilder.nonNullable.group({
    patientId: ['', Validators.required],
    manualPatientId: [''],
    startDate: [this.initialStartDate, Validators.required],
    startTime: [extractTime(this.data.initialStartDateTime), Validators.required],
    endDate: [this.initialEndDate, Validators.required],
    endTime: [extractTime(this.data.initialEndDateTime), Validators.required],
    reason: ['', [Validators.required, Validators.minLength(3)]],
    recipientEmail: ['', Validators.email],
  });

  constructor() {
    if (!this.hasPatientDirectory()) {
      this.form.controls.manualPatientId.addValidators(Validators.required);
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (!this.hasPatientDirectory()) {
      this.form.controls.patientId.setValue(this.form.controls.manualPatientId.getRawValue().trim());
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    const startDateTime = toLocalDateTimeString(rawValue.startDate, rawValue.startTime);
    const endDateTime = toLocalDateTimeString(rawValue.endDate, rawValue.endTime);

    if (fromLocalDateTimeString(endDateTime) <= fromLocalDateTimeString(startDateTime)) {
      this.form.controls.endTime.setErrors({ invalidRange: true });
      this.form.controls.endDate.setErrors({ invalidRange: true });
      return;
    }

    this.dialogRef.close({
      patientId: rawValue.patientId.trim(),
      startDateTime,
      endDateTime,
      reason: rawValue.reason.trim(),
      recipientEmail: rawValue.recipientEmail.trim() || undefined,
    });
  }

  hasPatientDirectory(): boolean {
    return this.data.patients.length > 0;
  }
}
