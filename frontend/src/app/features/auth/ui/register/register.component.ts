import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { HttpErrorService } from '@core/services/http-error.service';
import { RegisterRequest } from '@shared/models/auth.model';
import { AVATAR_ICON_OPTIONS } from '@shared/constants/avatar.constants';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly httpErrors = inject(HttpErrorService);
  private readonly destroyRef = inject(DestroyRef);

  avatars = AVATAR_ICON_OPTIONS;
  loading = signal(false);
  error = signal('');

  readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)]],
    displayName: [''],
    avatarEmoji: ['sports_volleyball', [Validators.required]],
  });

  get selectedAvatar(): string {
    return this.form.controls.avatarEmoji.value;
  }

  selectAvatar(avatar: string): void {
    this.form.controls.avatarEmoji.setValue(avatar);
  }

  onRegister(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    const payload: RegisterRequest = {
      username: values.username,
      email: values.email,
      password: values.password,
      avatarEmoji: values.avatarEmoji,
      displayName: values.displayName || undefined,
    };

    this.loading.set(true);
    this.error.set('');

    this.auth
      .register(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        error: (err) => {
          this.error.set(this.httpErrors.getMessage(err, 'Error al registrarse'));
        },
      },
    );
  }

  controlInvalid(name: 'username' | 'email' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.dirty || control.touched);
  }
}
