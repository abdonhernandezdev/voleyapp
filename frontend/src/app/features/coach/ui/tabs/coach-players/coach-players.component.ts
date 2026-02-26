import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoachFacade } from '../../../data-access/coach.facade';
import { resolveAvatarIcon } from '@shared/utils/avatar-icon.util';
import { User } from '@shared/models/user.model';

@Component({
  selector: 'app-coach-players',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './coach-players.component.html',
  styleUrls: ['../../coach.component.scss', './coach-players.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoachPlayersComponent {
  private readonly facade = inject(CoachFacade);

  readonly players = this.facade.players;
  readonly loadingPlayers = this.facade.loadingPlayers;
  readonly playersError = this.facade.playersError;
  readonly searchQuery = signal('');

  readonly filteredPlayers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.players();
    return this.players().filter(
      (player) =>
        player.displayName.toLowerCase().includes(query) ||
        player.username.toLowerCase().includes(query),
    );
  });

  refreshPlayers(): void {
    this.facade.loadPlayers();
  }

  getAccuracy(player: User): number {
    return player.gamesPlayed
      ? Math.round((player.sessionsWon / player.gamesPlayed) * 100)
      : 0;
  }

  isTopPlayer(playerId: string): boolean {
    return this.players()[0]?.id === playerId;
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return 'Sin fecha';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  getAvatarIcon(raw?: string): string {
    return resolveAvatarIcon(raw);
  }
}
