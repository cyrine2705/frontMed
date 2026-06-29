import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatButtonModule],
  template: `
    <aside class="sidebar">
      <div class="sidebar__brand">
        <span class="sidebar__brand-name">MediScript</span>
        <span class="sidebar__brand-sub">Clinical Platform</span>
      </div>

      <nav class="sidebar__nav">
        @for (item of navItems; track item.route) {
          <a class="sidebar__link"
             [routerLink]="item.route"
             routerLinkActive="sidebar__link--active">
            <mat-icon>{{ item.icon }}</mat-icon>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>

      <div class="sidebar__footer">
        <div class="sidebar__user">
          <span class="sidebar__user-name">
            {{ auth.currentUser()?.firstName }} {{ auth.currentUser()?.lastName }}
          </span>
          <span class="sidebar__user-role badge badge--gray">
            {{ auth.currentUser()?.role }}
          </span>
        </div>
        <button mat-stroked-button class="sidebar__logout" (click)="auth.logout()">
          <mat-icon>logout</mat-icon>
          Sign out
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 240px;
      height: 100vh;
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      overflow: hidden;
    }

    .sidebar__brand {
      padding: 20px 16px;
      border-bottom: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .sidebar__brand-name {
      font-size: 16px;
      font-weight: 700;
      color: var(--color-primary);
      letter-spacing: -.02em;
    }

    .sidebar__brand-sub {
      font-size: 11px;
      color: var(--color-text-3);
    }

    .sidebar__nav {
      flex: 1;
      padding: 12px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow-y: auto;
    }

    .sidebar__link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: var(--radius-md);
      color: var(--color-text-2);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.12s, color 0.12s;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: inherit;
      }

      &:hover {
        background: rgba(0,0,0,.04);
        color: var(--color-text-1);
      }

      &--active {
        background: rgba(37,99,235,.08);
        color: var(--color-primary);
      }
    }

    .sidebar__footer {
      padding: 16px;
      border-top: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .sidebar__user {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .sidebar__user-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-1);
    }

    .sidebar__user-role {
      align-self: flex-start;
      font-size: 11px;
    }

    .sidebar__logout {
      width: 100%;
      font-size: 13px;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        margin-right: 4px;
      }
    }
  `],
})
export class SidebarComponent {
  @Input() navItems: NavItem[] = [];
  protected readonly auth = inject(AuthService);
}
