import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PDFDocument = require('pdfkit');
import { QuestionCategory } from '../../questions/question.entity';
import { User, UserRole } from '../../users/user.entity';
import { GameSession } from '../../game-sessions/game-session.entity';
import { CoachPlayerAnalytics } from '../coach.types';
import { CoachAnalyticsQueryDto } from '../dto/coach-assignment.dto';

@Injectable()
export class CoachAnalyticsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(GameSession)
    private readonly gameSessionRepo: Repository<GameSession>,
  ) {}

  async getPlayerAnalytics(
    coachId: string,
    playerId: string,
    query: CoachAnalyticsQueryDto,
  ): Promise<CoachPlayerAnalytics> {
    await this.assertCoachExists(coachId);
    const player = await this.userRepo.findOne({
      where: { id: playerId, role: UserRole.PLAYER },
    });
    if (!player) throw new NotFoundException('Jugador no encontrado');

    const weeks = query.weeks ?? 8;
    const now = new Date();
    const fromDate = this.startOfWeek(this.shiftDays(now, -7 * (weeks - 1)));

    const [weeklyEvolution, weakCategories, comparison] = await Promise.all([
      this.buildWeeklyEvolution(playerId, weeks, fromDate),
      this.buildWeakCategories(playerId),
      this.buildComparison(playerId, fromDate),
    ]);

    return {
      player: {
        id: player.id,
        displayName: player.displayName,
        username: player.username,
        totalPoints: player.totalPoints,
        gamesPlayed: player.gamesPlayed,
        sessionsWon: player.sessionsWon,
        streak: player.streak,
        maxStreak: player.maxStreak,
      },
      period: {
        weeks,
        from: this.toDateOnly(fromDate),
        to: this.toDateOnly(now),
      },
      weeklyEvolution,
      weakCategories,
      comparison,
    };
  }

  async exportPlayerReportPdf(
    coachId: string,
    playerId: string,
  ): Promise<{ filename: string; buffer: Buffer }> {
    const analytics = await this.getPlayerAnalytics(coachId, playerId, { weeks: 16 });

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    const endPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    doc.fontSize(20).text('Informe de rendimiento - VoleyApp', { align: 'left' });
    doc.moveDown(0.6);
    doc.fontSize(11).text(`Jugador: ${analytics.player.displayName} (@${analytics.player.username})`);
    doc.text(`Periodo: ${analytics.period.from} a ${analytics.period.to} (${analytics.period.weeks} semanas)`);
    doc.moveDown(0.8);

    doc.fontSize(14).text('Resumen general');
    doc.moveDown(0.3);
    doc.fontSize(11).text(`Puntos acumulados: ${analytics.player.totalPoints}`);
    doc.text(`Partidas jugadas: ${analytics.player.gamesPlayed}`);
    doc.text(`Sesiones ganadas: ${analytics.player.sessionsWon}`);
    doc.text(`Racha actual / máxima: ${analytics.player.streak} / ${analytics.player.maxStreak}`);
    doc.moveDown(0.8);

    doc.fontSize(14).text('Evolucion semanal');
    doc.moveDown(0.3);
    doc.fontSize(10).text('Semana           Sesiones   Puntos   Precision');
    doc.moveDown(0.2);
    analytics.weeklyEvolution.forEach((week) => {
      doc.text(
        `${week.weekStart.padEnd(16)}${String(week.sessions).padEnd(11)}${String(week.points).padEnd(9)}${week.accuracy}%`,
      );
    });
    doc.moveDown(0.8);

    doc.fontSize(14).text('Categorias con mas margen de mejora');
    doc.moveDown(0.3);
    if (analytics.weakCategories.length === 0) {
      doc.fontSize(10).text('Sin datos suficientes por categoria.');
    } else {
      analytics.weakCategories.slice(0, 5).forEach((category) => {
        doc
          .fontSize(10)
          .text(
            `${category.category}: ${category.accuracy}% (${category.sessions} sesiones)`,
          );
      });
    }
    doc.moveDown(0.8);

    doc.fontSize(14).text('Comparativa interna');
    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .text(
        `Ranking por puntos: #${analytics.comparison.pointsRank} de ${analytics.comparison.teamSize}`,
      );
    doc
      .text(
        `Ranking por precision: #${analytics.comparison.accuracyRank} de ${analytics.comparison.teamSize}`,
      );
    doc.text(`Precision media del equipo: ${analytics.comparison.averageTeamAccuracy}%`);

    doc.end();
    const buffer = await endPromise;
    const filename = `reporte-${analytics.player.username}-${Date.now()}.pdf`;
    return { filename, buffer };
  }

  private async buildWeeklyEvolution(
    playerId: string,
    weeks: number,
    fromDate: Date,
  ): Promise<CoachPlayerAnalytics['weeklyEvolution']> {
    const weeklyRaw = await this.gameSessionRepo
      .createQueryBuilder('s')
      .select(`DATE_TRUNC('week', s."createdAt")`, 'weekStart')
      .addSelect('COUNT(*)', 'sessions')
      .addSelect('SUM(s."pointsEarned")', 'points')
      .addSelect('SUM(s."correctAnswers")', 'correct')
      .addSelect('SUM(s."totalQuestions")', 'total')
      .where('s."userId" = :playerId', { playerId })
      .andWhere('s.completed = true')
      .andWhere('s."createdAt" >= :fromDate', { fromDate: fromDate.toISOString() })
      .groupBy(`DATE_TRUNC('week', s."createdAt")`)
      .orderBy(`DATE_TRUNC('week', s."createdAt")`, 'ASC')
      .getRawMany<{ weekStart: Date; sessions: string; points: string; correct: string; total: string }>();

    const weeklyMap = new Map(
      weeklyRaw.map((row) => [this.toDateOnly(new Date(row.weekStart)), row]),
    );

    return Array.from({ length: weeks }, (_, index) => {
      const date = this.startOfWeek(this.shiftDays(fromDate, index * 7));
      const key = this.toDateOnly(date);
      const row = weeklyMap.get(key);
      const correct = row ? Number(row.correct) : 0;
      const total = row ? Number(row.total) : 0;
      return {
        weekStart: key,
        sessions: row ? Number(row.sessions) : 0,
        points: row ? Number(row.points) : 0,
        accuracy: total ? Math.round((correct / total) * 100) : 0,
      };
    });
  }

  private async buildWeakCategories(
    playerId: string,
  ): Promise<CoachPlayerAnalytics['weakCategories']> {
    const rows = await this.gameSessionRepo
      .createQueryBuilder('s')
      .select('s.category', 'category')
      .addSelect('COUNT(*)', 'sessions')
      .addSelect('SUM(s."correctAnswers")', 'correct')
      .addSelect('SUM(s."totalQuestions")', 'total')
      .where('s."userId" = :playerId', { playerId })
      .andWhere('s.completed = true')
      .andWhere('s.category IS NOT NULL')
      .groupBy('s.category')
      .getRawMany<{ category: QuestionCategory; sessions: string; correct: string; total: string }>();

    return rows
      .map((row) => {
        const total = Number(row.total);
        return {
          category: row.category,
          sessions: Number(row.sessions),
          accuracy: total ? Math.round((Number(row.correct) / total) * 100) : 0,
        };
      })
      .sort((a, b) => a.accuracy - b.accuracy);
  }

  private async buildComparison(
    playerId: string,
    fromDate: Date,
  ): Promise<CoachPlayerAnalytics['comparison']> {
    const rows = await this.gameSessionRepo
      .createQueryBuilder('s')
      .innerJoin(User, 'u', 'u.id = s."userId" AND u.role = :playerRole', {
        playerRole: UserRole.PLAYER,
      })
      .select('s."userId"', 'userId')
      .addSelect('SUM(s."pointsEarned")', 'points')
      .addSelect('SUM(s."correctAnswers")', 'correct')
      .addSelect('SUM(s."totalQuestions")', 'total')
      .where('s.completed = true')
      .andWhere('s."createdAt" >= :fromDate', { fromDate: fromDate.toISOString() })
      .groupBy('s."userId"')
      .getRawMany<{ userId: string; points: string; correct: string; total: string }>();

    const playerScores = rows
      .map((row) => ({
        userId: row.userId,
        points: Number(row.points),
        accuracy: Number(row.total)
          ? Math.round((Number(row.correct) / Number(row.total)) * 100)
          : 0,
      }))
      .sort((a, b) => b.points - a.points);

    const teamSize = Math.max(1, playerScores.length);
    const pointsRank = Math.max(
      1,
      playerScores.findIndex((e) => e.userId === playerId) + 1 || teamSize,
    );
    const accuracyRank = Math.max(
      1,
      [...playerScores]
        .sort((a, b) => b.accuracy - a.accuracy)
        .findIndex((e) => e.userId === playerId) + 1 || teamSize,
    );
    const averageTeamAccuracy = playerScores.length
      ? Math.round(
          playerScores.reduce((acc, e) => acc + e.accuracy, 0) / playerScores.length,
        )
      : 0;

    return { teamSize, pointsRank, accuracyRank, averageTeamAccuracy };
  }

  private async assertCoachExists(coachId: string): Promise<void> {
    const coach = await this.userRepo.findOne({
      where: { id: coachId, role: UserRole.COACH },
      select: ['id'],
    });
    if (!coach) {
      throw new ForbiddenException('Solo un entrenador puede acceder a estos datos');
    }
  }

  private shiftDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private startOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    result.setDate(result.getDate() + diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private toDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
