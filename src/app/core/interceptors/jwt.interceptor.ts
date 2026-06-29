import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

const PUBLIC_PATHS = ['/v1/auth/login', '/v1/auth/register', '/v1/public/'];

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const isPublic = PUBLIC_PATHS.some(p => req.url.includes(p));
  if (isPublic) return next(req);

  const token = inject(AuthService).getToken();
  if (!token) return next(req);

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
