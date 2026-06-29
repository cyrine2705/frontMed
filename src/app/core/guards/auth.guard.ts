import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

function redirectByRole(auth: AuthService, router: Router): false {
  const role = auth.currentUser()?.role;
  switch (role) {
    case 'ADMIN':   router.navigate(['/admin/dashboard']);   break;
    case 'DOCTOR':  router.navigate(['/doctor/dashboard']);  break;
    case 'PATIENT': router.navigate(['/patient/dashboard']); break;
    default:        router.navigate(['/login']);
  }
  return false;
}

export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) { router.navigate(['/login']); return false; }
  if (!auth.isAdmin())         return redirectByRole(auth, router);
  return true;
};

export const doctorGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) { router.navigate(['/login']); return false; }
  if (!auth.isDoctor())        return redirectByRole(auth, router);
  return true;
};

export const patientGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) { router.navigate(['/login']); return false; }
  if (!auth.isPatient())       return redirectByRole(auth, router);
  return true;
};

export const publicGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return redirectByRole(auth, router);
  return true;
};
