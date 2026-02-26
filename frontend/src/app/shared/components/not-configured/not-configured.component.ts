import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-configured',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './not-configured.component.html',
  styleUrls: ['./not-configured.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotConfiguredComponent {
  @Input() gameName = 'este juego';
  @Input() showBack = false;
  @Output() back = new EventEmitter<void>();
}
