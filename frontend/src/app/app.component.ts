import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { ConfirmModalComponent } from '@shared/components/confirm-modal/confirm-modal.component';
import { ToastCenterComponent } from '@shared/components/toast-center/toast-center.component';
import { AuthService } from '@core/services/auth.service';
import { HttpErrorService } from '@core/services/http-error.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ConfirmModalComponent, ToastCenterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly auth = inject(AuthService);
  private readonly httpErrors = inject(HttpErrorService);

  sessionChecked = this.auth.sessionChecked;
  isLoggedIn = this.auth.isLoggedIn;
  globalError = this.httpErrors.globalError;

  constructor() {
    this.auth.ensureSession().subscribe();
  }

  clearGlobalError(): void {
    this.httpErrors.clearGlobal();
  }
}
