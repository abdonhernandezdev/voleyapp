import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ConfirmDialogService } from '@core/services/confirm-dialog.service';
import { AuthService } from '@core/services/auth.service';
import { Reward } from '@shared/models/reward.model';
import { RewardsFacade } from '../data-access/rewards.facade';

type PlayerView = 'catalog' | 'my-redemptions';

@Component({
  selector: 'app-rewards',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rewards.component.html',
  styleUrls: ['./rewards.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RewardsFacade],
})
export class RewardsComponent implements OnInit {
  readonly facade = inject(RewardsFacade);
  private readonly auth = inject(AuthService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly user = this.auth.user;
  readonly playerView = signal<PlayerView>('catalog');

  ngOnInit(): void {
    this.facade.loadRewards();
    this.facade.loadPointsBalance();
    this.facade.loadMyRedemptions();
  }

  setView(view: PlayerView): void {
    this.playerView.set(view);
  }

  async confirmRedeem(reward: Reward): Promise<void> {
    const confirmed = await this.confirmDialog.open({
      title: 'Confirmar canje',
      message: `¿Gastar ${reward.pointCost} puntos semanales para canjear "${reward.name}"?`,
      confirmText: 'Canjear',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    this.facade.redeemReward(reward.id);
  }

  stockLabel(reward: Reward): string {
    if (reward.stock === null) return 'Sin limite';
    return `${reward.stockAvailable ?? 0} disponibles`;
  }

  statusLabel(status: string): string {
    if (status === 'delivered') return 'Entregado';
    if (status === 'cancelled') return 'Cancelado';
    return 'Pendiente';
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
