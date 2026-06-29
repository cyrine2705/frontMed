import { Routes } from '@angular/router';
import { PatientLayoutComponent } from './layout/patient-layout.component';

export const patientRoutes: Routes = [
  {
    path: '',
    component: PatientLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/patient-dashboard.component').then(m => m.PatientDashboardComponent),
      },
      {
        path: 'appointments',
        loadComponent: () =>
          import('./appointments/patient-appointments.component').then(m => m.PatientAppointmentsComponent),
      },
      {
        path: 'prescriptions',
        loadComponent: () =>
          import('./prescriptions/patient-prescriptions.component').then(m => m.PatientPrescriptionsComponent),
      },
    ],
  },
];
