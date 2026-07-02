import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';
import { SidebarComponent, NavItem } from '../../../shared/components/sidebar/sidebar.component';

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     icon: 'dashboard',     route: '/patient/dashboard'     },
  { label: 'Appointments',  icon: 'calendar_today', route: '/patient/appointments' },
  { label: 'Prescriptions', icon: 'medication',    route: '/patient/prescriptions' },
];

@Component({
  selector: 'app-patient-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="shell">
      <app-sidebar [navItems]="navItems" />
      <main class="shell__main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    .shell__main {
      flex: 1;
      overflow-y: auto;
      background: var(--color-surface-2);
      min-width: 0;
    }
  `],
})
export class PatientLayoutComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);

  readonly navItems = NAV_ITEMS;

  ngOnInit(): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      return;
    }

    this.profileService.getPatientProfile(currentUser.id).subscribe({
      error: () => undefined,
    });
  }
}
