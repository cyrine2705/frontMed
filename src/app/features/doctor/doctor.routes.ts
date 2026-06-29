import { Routes } from '@angular/router';
import { DoctorLayoutComponent } from './layout/doctor-layout.component';

export const doctorRoutes: Routes = [
  {
    path: '',
    component: DoctorLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/doctor-dashboard.component').then(m => m.DoctorDashboardComponent),
      },
      {
        path: 'appointments',
        loadComponent: () =>
          import('./appointments/doctor-appointments.component').then(m => m.DoctorAppointmentsComponent),
      },
      {
        path: 'prescriptions',
        loadComponent: () =>
          import('./prescriptions/doctor-prescriptions.component').then(m => m.DoctorPrescriptionsComponent),
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('./chat/doctor-chat.component').then(m => m.DoctorChatComponent),
      },
    ],
  },
];
