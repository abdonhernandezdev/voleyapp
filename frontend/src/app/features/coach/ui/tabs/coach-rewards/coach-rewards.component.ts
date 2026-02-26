import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmDialogService } from '@core/services/confirm-dialog.service';
import { CoachReward } from '@shared/models/reward.model';
import { RewardsFacade } from '../../../../rewards/data-access/rewards.facade';

type RewardView = 'rewards' | 'redemptions';

@Component({
  selector: 'app-coach-rewards',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './coach-rewards.component.html',
  styleUrls: ['../../coach.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoachRewardsComponent implements OnInit {
  readonly rewardsFacade = inject(RewardsFacade);
  private readonly fb = inject(FormBuilder);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly rewardView = signal<RewardView>('rewards');
  readonly editingRewardId = signal<string | null>(null);

  readonly rewardForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: [''],
    pointCost: [100, [Validators.required, Validators.min(1)]],
    stock: [null as number | null],
    isActive: [true],
  });

  ngOnInit(): void {
    this.rewardsFacade.loadCoachRewards();
    this.rewardsFacade.loadCoachRedemptions();
  }

  setRewardView(view: RewardView): void {
    this.rewardView.set(view);
    if (view === 'redemptions') {
      this.rewardsFacade.loadCoachRedemptions();
    }
  }

  submitReward(): void {
    if (this.rewardForm.invalid) {
      this.rewardForm.markAllAsTouched();
      return;
    }
    const v = this.rewardForm.getRawValue();
    const basePayload = {
      name: v.name.trim(),
      description: v.description.trim() || undefined,
      pointCost: Number(v.pointCost),
      stock: v.stock !== null && v.stock !== undefined ? Number(v.stock) : null,
    };
    const editingId = this.editingRewardId();
    if (editingId) {
      this.rewardsFacade.updateCoachReward(
        editingId,
        { ...basePayload, isActive: v.isActive },
        () => this.resetRewardForm(),
      );
    } else {
      this.rewardsFacade.createCoachReward(basePayload, () => this.resetRewardForm());
    }
  }

  startEditReward(reward: CoachReward): void {
    this.editingRewardId.set(reward.id);
    this.rewardForm.patchValue({
      name: reward.name,
      description: reward.description ?? '',
      pointCost: reward.pointCost,
      stock: reward.stock,
      isActive: reward.isActive,
    });
    this.rewardView.set('rewards');
  }

  cancelRewardEdit(): void {
    this.resetRewardForm();
  }

  async deactivateReward(rewardId: string): Promise<void> {
    const confirmed = await this.confirmDialog.open({
      title: 'Desactivar recompensa',
      message: 'La recompensa dejara de aparecer en el catalogo de jugadores.',
      confirmText: 'Desactivar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    this.rewardsFacade.deactivateCoachReward(rewardId);
  }

  async deliverRedemption(redemptionId: string): Promise<void> {
    const confirmed = await this.confirmDialog.open({
      title: 'Marcar como entregado',
      message: '¿Confirmas que has entregado esta recompensa al jugador?',
      confirmText: 'Confirmar entrega',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    this.rewardsFacade.deliverRedemption(redemptionId);
  }

  async cancelRedemption(redemptionId: string): Promise<void> {
    const confirmed = await this.confirmDialog.open({
      title: 'Cancelar canje',
      message: 'Se devolveran los puntos al jugador. Esta accion no se puede deshacer.',
      confirmText: 'Cancelar canje',
      cancelText: 'Volver',
      tone: 'danger',
    });
    if (!confirmed) return;
    this.rewardsFacade.cancelRedemption(redemptionId);
  }

  statusLabel(status: string): string {
    if (status === 'delivered') return 'Entregado';
    if (status === 'cancelled') return 'Cancelado';
    return 'Pendiente';
  }

  formatRedemptionDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private resetRewardForm(): void {
    this.editingRewardId.set(null);
    this.rewardForm.reset({ name: '', description: '', pointCost: 100, stock: null, isActive: true });
  }
}
