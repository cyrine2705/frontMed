import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CalendarOptions, DateSelectArg, DatesSetArg, EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { FullCalendarModule } from '@fullcalendar/angular';
import { AppointmentResponse, AppointmentStatus, CreateAppointmentRequest, PatientResponse } from '../../../core/models';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { fromLocalDateTimeString, toLocalDateTimeString } from '../../../core/utils/datetime.util';
import {
  AppointmentDetailsDialogComponent,
  AppointmentDetailsDialogResult,
} from './appointment-details-dialog.component';
import {
  AppointmentScheduleDialogComponent,
  AppointmentScheduleDialogResult,
} from './appointment-schedule-dialog.component';

interface CalendarRange {
  startDateTime: string;
  endDateTime: string;
}

@Component({
  selector: 'app-doctor-appointments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FullCalendarModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './doctor-appointments.component.html',
  styleUrl: './doctor-appointments.component.scss',
})
export class DoctorAppointmentsComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly appointmentService = inject(AppointmentService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);

  readonly appointments = signal<AppointmentResponse[]>([]);
  readonly patients = signal<PatientResponse[]>([]);
  readonly loadingAppointments = signal(false);
  readonly loadingPatients = signal(false);
  readonly pageError = signal('');
  readonly currentRange = signal<CalendarRange | null>(null);

  readonly doctorId = computed(() => this.authService.currentUser()?.id ?? '');
  readonly patientDirectory = computed(() => {
    const directory = new Map<string, PatientResponse>();
    for (const patient of this.patients()) {
      directory.set(patient.id, patient);
    }
    return directory;
  });
  readonly visibleAppointments = computed(() =>
    [...this.appointments()].sort(
      (left, right) =>
        fromLocalDateTimeString(left.startDateTime).getTime() -
        fromLocalDateTimeString(right.startDateTime).getTime(),
    ),
  );
  readonly upcomingAppointments = computed(() =>
    this.visibleAppointments().filter((appointment) => appointment.status === 'SCHEDULED').slice(0, 6),
  );
  readonly scheduledCount = computed(
    () => this.appointments().filter((appointment) => appointment.status === 'SCHEDULED').length,
  );
  readonly completedCount = computed(
    () => this.appointments().filter((appointment) => appointment.status === 'COMPLETED').length,
  );
  readonly canceledCount = computed(
    () => this.appointments().filter((appointment) => appointment.status === 'CANCELED').length,
  );
  readonly calendarEvents = computed<EventInput[]>(() =>
    this.appointments().map((appointment) => ({
      id: appointment.id,
      title: this.buildPatientLabel(appointment.patientId),
      start: appointment.startDateTime,
      end: appointment.endDateTime,
      classNames: [
        'appointment-event',
        `appointment-event--${appointment.status.toLowerCase()}`,
      ],
      extendedProps: {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        reason: appointment.reason,
        status: appointment.status,
      },
    })),
  );

  private readonly baseCalendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek',
    },
    buttonText: {
      today: 'Today',
      month: 'Month',
      week: 'Week',
    },
    height: 'auto',
    contentHeight: 760,
    weekends: true,
    nowIndicator: true,
    selectable: true,
    editable: true,
    eventStartEditable: true,
    allDaySlot: false,
    selectMirror: true,
    dayMaxEvents: true,
    slotMinTime: '07:00:00',
    slotMaxTime: '20:00:00',
    slotDuration: '00:30:00',
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      meridiem: false,
      hour12: false,
    },
    datesSet: (arg) => this.handleDatesSet(arg),
    select: (arg) => this.openCreateDialog(arg),
    eventClick: (arg) => this.openDetailsDialog(arg),
    eventDrop: (arg) => this.handleEventDrop(arg),
  };

  readonly calendarOptions = computed<CalendarOptions>(() => ({
    ...this.baseCalendarOptions,
    events: this.calendarEvents(),
  }));

  constructor() {
    this.loadPatients();
  }

  refreshRange(): void {
    const currentRange = this.currentRange();
    if (!currentRange || !this.doctorId()) {
      return;
    }

    this.loadAppointmentsForRange(currentRange);
  }

  openManualCreateDialog(): void {
    this.openCreateDialog();
  }

  openAppointmentDetails(appointment: AppointmentResponse): void {
    this.openDetailsDialog(appointment);
  }

  buildPatientLabel(patientId: string): string {
    const patient = this.patientDirectory().get(patientId);
    if (!patient) {
      return patientId;
    }

    return `${patient.firstName} ${patient.lastName}`;
  }

  formatAppointmentRange(appointment: AppointmentResponse): string {
    const startDate = fromLocalDateTimeString(appointment.startDateTime);
    const endDate = fromLocalDateTimeString(appointment.endDateTime);

    const datePart = startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const startTime = startDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const endTime = endDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return `${datePart} - ${startTime} to ${endTime}`;
  }

  trackAppointment(index: number, appointment: AppointmentResponse): string {
    return appointment.id;
  }

  private handleDatesSet(arg: DatesSetArg): void {
    const range = {
      startDateTime: toLocalDateTimeString(arg.start),
      endDateTime: toLocalDateTimeString(arg.end),
    };

    this.currentRange.set(range);
    this.loadAppointmentsForRange(range);
  }

  private loadPatients(): void {
    this.loadingPatients.set(true);

    this.userService.getPatients()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (patients) => {
          this.patients.set(patients.filter((patient) => patient.isActive));
          this.loadingPatients.set(false);
        },
        error: () => {
          this.loadingPatients.set(false);
          this.snackBar.open(
            'Patient directory could not be loaded. You can still enter a patient ID manually.',
            'Dismiss',
            { duration: 5000 },
          );
        },
      });
  }

  private loadAppointmentsForRange(range: CalendarRange): void {
    const doctorId = this.doctorId();
    if (!doctorId) {
      return;
    }

    this.loadingAppointments.set(true);
    this.pageError.set('');

    this.appointmentService.getByDoctorRange(doctorId, range.startDateTime, range.endDateTime)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (appointments) => {
          this.appointments.set(appointments);
          this.loadingAppointments.set(false);
        },
        error: (error) => {
          this.loadingAppointments.set(false);
          this.pageError.set(error.error?.message ?? 'Unable to load the calendar for this range.');
        },
      });
  }

  private openCreateDialog(selection?: DateSelectArg): void {
    const initialRange = this.resolveDialogRange(selection);
    selection?.view.calendar.unselect();

    const dialogRef = this.dialog.open(AppointmentScheduleDialogComponent, {
      width: '640px',
      maxWidth: '96vw',
      data: {
        patients: this.patients(),
        loadingPatients: this.loadingPatients(),
        initialStartDateTime: initialRange.startDateTime,
        initialEndDateTime: initialRange.endDateTime,
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result?: AppointmentScheduleDialogResult) => {
        if (!result) {
          return;
        }

        this.createAppointment(result);
      });
  }

  private createAppointment(result: AppointmentScheduleDialogResult): void {
    const doctorId = this.doctorId();
    if (!doctorId) {
      return;
    }

    const payload: CreateAppointmentRequest = {
      doctorId,
      patientId: result.patientId,
      startDateTime: result.startDateTime,
      endDateTime: result.endDateTime,
      reason: result.reason,
      recipientEmail: result.recipientEmail,
    };

    this.appointmentService.create(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (appointment) => {
          this.mergeAppointment(appointment);
          this.snackBar.open('Appointment scheduled successfully.', 'Dismiss', { duration: 3000 });
        },
        error: (error) => {
          this.snackBar.open(
            error.error?.message ?? 'Unable to schedule this appointment.',
            'Dismiss',
            { duration: 5000 },
          );
        },
      });
  }

  private openDetailsDialog(arg: EventClickArg | AppointmentResponse): void {
    const appointment = 'event' in arg
      ? this.appointments().find((item) => item.id === arg.event.id)
      : arg;
    if (!appointment) {
      return;
    }

    const dialogRef = this.dialog.open(AppointmentDetailsDialogComponent, {
      width: '520px',
      maxWidth: '96vw',
      data: {
        appointment,
        patientLabel: this.buildPatientLabel(appointment.patientId),
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result?: AppointmentDetailsDialogResult) => {
        if (!result) {
          return;
        }

        this.applyStatusChange(appointment, result.status);
      });
  }

  private applyStatusChange(appointment: AppointmentResponse, status: AppointmentStatus): void {
    this.appointmentService.updateStatus(appointment.id, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedAppointment) => {
          this.mergeAppointment(updatedAppointment);
          this.snackBar.open(`Appointment marked as ${status.toLowerCase()}.`, 'Dismiss', {
            duration: 3000,
          });
        },
        error: (error) => {
          this.snackBar.open(
            error.error?.message ?? 'Unable to update this appointment.',
            'Dismiss',
            { duration: 5000 },
          );
        },
      });
  }

  private handleEventDrop(arg: EventDropArg): void {
    const appointment = this.appointments().find((item) => item.id === arg.event.id);
    if (!appointment) {
      arg.revert();
      return;
    }

    const updatedPayload = {
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
      startDateTime: this.toCalendarDateTime(arg.event.start),
      endDateTime: this.toCalendarDateTime(arg.event.end ?? this.addMinutes(arg.event.start, 30)),
      reason: appointment.reason,
      recipientEmail: appointment.recipientEmail,
    };

    this.appointmentService.update(appointment.id, updatedPayload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedAppointment) => {
          this.mergeAppointment(updatedAppointment);
          this.snackBar.open('Appointment time updated.', 'Dismiss', { duration: 3000 });
        },
        error: (error) => {
          arg.revert();
          this.snackBar.open(
            error.error?.message ?? 'Unable to move this appointment.',
            'Dismiss',
            { duration: 5000 },
          );
        },
      });
  }

  private mergeAppointment(updatedAppointment: AppointmentResponse): void {
    this.appointments.update((appointments) => {
      const existingIndex = appointments.findIndex((appointment) => appointment.id === updatedAppointment.id);
      if (existingIndex === -1) {
        return [...appointments, updatedAppointment];
      }

      const nextAppointments = [...appointments];
      nextAppointments[existingIndex] = updatedAppointment;
      return nextAppointments;
    });
  }

  private resolveDialogRange(selection?: DateSelectArg): CalendarRange {
    if (!selection) {
      const startDate = this.roundToNextHalfHour(new Date());
      return {
        startDateTime: toLocalDateTimeString(startDate),
        endDateTime: toLocalDateTimeString(this.addMinutes(startDate, 30)),
      };
    }

    if (selection.allDay) {
      const startDate = new Date(selection.start);
      startDate.setHours(9, 0, 0, 0);
      return {
        startDateTime: toLocalDateTimeString(startDate),
        endDateTime: toLocalDateTimeString(this.addMinutes(startDate, 30)),
      };
    }

    return {
      startDateTime: toLocalDateTimeString(selection.start),
      endDateTime: toLocalDateTimeString(selection.end ?? this.addMinutes(selection.start, 30)),
    };
  }

  private addMinutes(date: Date | null, minutes: number): Date {
    const nextDate = new Date(date ?? new Date());
    nextDate.setMinutes(nextDate.getMinutes() + minutes);
    return nextDate;
  }

  private roundToNextHalfHour(date: Date): Date {
    const roundedDate = new Date(date);
    roundedDate.setSeconds(0, 0);

    const minutes = roundedDate.getMinutes();
    if (minutes === 0 || minutes === 30) {
      return roundedDate;
    }

    if (minutes < 30) {
      roundedDate.setMinutes(30);
      return roundedDate;
    }

    roundedDate.setHours(roundedDate.getHours() + 1, 0, 0, 0);
    return roundedDate;
  }

  private toCalendarDateTime(date: Date | null): string {
    return toLocalDateTimeString(date ?? new Date());
  }
}
