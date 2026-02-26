import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppNotification, NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-toast-center',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-center.component.html',
  styleUrls: ['./toast-center.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastCenterComponent {
  private readonly notifications = inject(NotificationService);
  readonly items = this.notifications.items;

  dismiss(id: number): void {
    this.notifications.dismiss(id);
  }

  iconFor(item: AppNotification): string {
    if (item.type === 'success') return 'check_circle';
    if (item.type === 'warning') return 'warning';
    if (item.type === 'error') return 'error';
    return 'info';
  }
}
