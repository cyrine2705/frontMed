import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent, NavItem } from '../../../shared/components/sidebar/sidebar.component';

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     icon: 'dashboard',    route: '/doctor/dashboard'     },
  { label: 'Appointments',  icon: 'calendar_today', route: '/doctor/appointments' },
  { label: 'Prescriptions', icon: 'medication',   route: '/doctor/prescriptions' },
  { label: 'Chat',          icon: 'chat',         route: '/doctor/chat'          },
];

@Component({
  selector: 'app-doctor-layout',
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
export class DoctorLayoutComponent {
  readonly navItems = NAV_ITEMS;
}
