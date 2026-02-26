import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: [
    './navbar.component.scss',
    './navbar-flyout.scss',
    './navbar-mobile.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  private readonly auth = inject(AuthService);
  isCoach = this.auth.isCoach;
  user = this.auth.user;

  menuOpen = signal(false);

  userInitial = computed(() => {
    const displayName = this.user()?.displayName?.trim();
    const username = this.user()?.username?.trim();
    const source = displayName || username || 'U';
    return source.charAt(0);
  });

  closeMenu() {
    this.menuOpen.set(false);
  }

  toggleMenu() {
    this.menuOpen.set(!this.menuOpen());
  }

  logout() {
    this.closeMenu();
    this.auth.logout();
  }
}
