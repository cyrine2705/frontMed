import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent, NavItem } from '../../../shared/components/sidebar/sidebar.component';

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard',        route: '/admin/dashboard' },
  { label: 'Doctors',   icon: 'medical_services', route: '/admin/doctors'   },
  { label: 'Patients',  icon: 'people',           route: '/admin/patients'  },
  { label: 'Medications', icon: 'medication',     route: '/admin/medications' },
];

@Component({
  selector: 'app-admin-layout',
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
export class AdminLayoutComponent {
  readonly navItems = NAV_ITEMS;
}
