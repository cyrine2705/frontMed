import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'doctors',
        loadComponent: () =>
          import('./doctors/admin-doctors.component').then(m => m.AdminDoctorsComponent),
      },
      {
        path: 'doctors/:doctorId',
        loadComponent: () =>
          import('./doctors/admin-doctor-profile.component').then(m => m.AdminDoctorProfileComponent),
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('./patients/admin-patients.component').then(m => m.AdminPatientsComponent),
      },
      {
        path: 'patients/:patientId',
        loadComponent: () =>
          import('./patients/admin-patient-profile.component').then(m => m.AdminPatientProfileComponent),
      },
      {
        path: 'medications',
        loadComponent: () =>
          import('./medications/admin-medications.component').then(m => m.AdminMedicationsComponent),
      },
    ],
  },
];
