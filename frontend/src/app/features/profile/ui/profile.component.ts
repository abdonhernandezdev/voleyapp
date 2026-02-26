import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AVATAR_ICON_OPTIONS } from '@shared/constants/avatar.constants';
import { ProfileFacade } from '../data-access/profile.facade';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProfileFacade],
})
export class ProfileComponent implements OnInit {
  private readonly facade = inject(ProfileFacade);
  private readonly fb = inject(FormBuilder);

  readonly avatarOptions = AVATAR_ICON_OPTIONS;
  readonly user = this.facade.user;
  readonly achievements = this.facade.achievements;
  readonly loading = this.facade.loading;
  readonly saving = this.facade.saving;
  readonly error = this.facade.error;
  readonly saveMessage = this.facade.saveMessage;

  readonly unlockedAchievements = computed(() => this.achievements().filter((achievement) => achievement.unlocked));

  readonly form = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
    avatarEmoji: ['sports_volleyball', [Validators.required]],
    streakReminderEmailEnabled: [false],
  });

  constructor() {
    effect(() => {
      const user = this.user();
      if (user) {
        this.patchForm(user);
      }
    });
  }

  ngOnInit(): void {
    this.facade.load();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.facade.save(this.form.getRawValue());
  }

  private patchForm(user: {
    displayName: string;
    avatarEmoji: string;
    streakReminderEmailEnabled?: boolean;
  }): void {
    this.form.patchValue({
      displayName: user.displayName || '',
      avatarEmoji: user.avatarEmoji || 'sports_volleyball',
      streakReminderEmailEnabled: !!user.streakReminderEmailEnabled,
    });
  }
}
