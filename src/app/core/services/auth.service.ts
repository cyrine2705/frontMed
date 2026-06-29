import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_URL } from '../tokens/api.token';
import {
  AuthResponse,
  LoginRequest,
  RegisterPatientRequest,
  UserResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'ms_token';
  private readonly USER_KEY  = 'ms_user';

  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly api    = inject(API_URL);

  private readonly _user = signal<UserResponse | null>(this.loadUser());

  readonly currentUser    = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly isAdmin        = computed(() => this._user()?.role === 'ADMIN');
  readonly isDoctor       = computed(() => this._user()?.role === 'DOCTOR');
  readonly isPatient      = computed(() => this._user()?.role === 'PATIENT');

  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/v1/auth/login`, body).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.accessToken);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        this._user.set(res.user);
      })
    );
  }

  registerPatient(body: RegisterPatientRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.api}/v1/auth/register/patient`, body);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  redirectToDashboard(): void {
    const role = this._user()?.role;
    switch (role) {
      case 'ADMIN':   this.router.navigate(['/admin/dashboard']);   break;
      case 'DOCTOR':  this.router.navigate(['/doctor/dashboard']);  break;
      case 'PATIENT': this.router.navigate(['/patient/dashboard']); break;
      default:        this.router.navigate(['/login']);
    }
  }

  private loadUser(): UserResponse | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? (JSON.parse(raw) as UserResponse) : null;
    } catch {
      return null;
    }
  }
}
