import { Routes } from '@angular/router';
import { adminGuard, doctorGuard, patientGuard, publicGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/guest/guest.component').then(m => m.GuestComponent),
  },
  {
    path: 'doctors',
    loadComponent: () =>
      import('./features/guest/doctors/doctor-catalog.component').then(m => m.DoctorCatalogComponent),
  },
  {
    path: 'doctors/:doctorId',
    loadComponent: () =>
      import('./features/guest/doctors/doctor-detail.component').then(m => m.DoctorDetailComponent),
  },
  {
    path: 'medications',
    loadComponent: () =>
      import('./features/guest/medications/medication-catalog.component').then(m => m.MedicationCatalogComponent),
  },
  {
    path: 'medications/:medicationId',
    loadComponent: () =>
      import('./features/guest/medications/medication-detail.component').then(m => m.MedicationDetailComponent),
  },

  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  },

  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () =>
      import('./features/admin/admin.routes').then(m => m.adminRoutes),
  },
  {
    path: 'doctor',
    canActivate: [doctorGuard],
    loadChildren: () =>
      import('./features/doctor/doctor.routes').then(m => m.doctorRoutes),
  },
  {
    path: 'patient',
    canActivate: [patientGuard],
    loadChildren: () =>
      import('./features/patient/patient.routes').then(m => m.patientRoutes),
  },

  { path: '**', redirectTo: 'login' },
];
