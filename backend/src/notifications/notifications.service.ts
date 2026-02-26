import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { envConfig } from '../config/env.config';
import { User, UserRole } from '../users/user.entity';
import { StreakReminderLog } from './streak-reminder-log.entity';

export interface StreakReminderCandidate {
  userId: string;
  displayName: string;
  email: string;
  streak: number;
  lastPlayedAt: string;
}

export interface StreakReminderDispatchResult {
  candidates: number;
  sent: number;
  failed: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(StreakReminderLog)
    private readonly reminderLogRepo: Repository<StreakReminderLog>,
  ) {}

  async getStreakReminderCandidates(referenceDate = new Date()): Promise<StreakReminderCandidate[]> {
    const todayIso = this.toDateOnly(referenceDate);
    const yesterdayIso = this.toDateOnly(this.shiftDays(referenceDate, -1));

    const alreadyNotifiedToday = await this.reminderLogRepo.find({
      where: { reminderDate: todayIso },
      select: ['userId'],
    });
    const excludedUserIds = alreadyNotifiedToday.map((entry) => entry.userId);

    const query = this.userRepo
      .createQueryBuilder('u')
      .select([
        'u.id AS "userId"',
        'u.email AS "email"',
        `COALESCE(NULLIF(u."displayName", ''), u.username) AS "displayName"`,
        'u.streak AS "streak"',
        'u."lastPlayedAt" AS "lastPlayedAt"',
      ])
      .where('u.role = :role', { role: UserRole.PLAYER })
      .andWhere('u."streakReminderEmailEnabled" = true')
      .andWhere('u.streak >= :minStreak', { minStreak: 3 })
      .andWhere(`DATE(u."lastPlayedAt") = :yesterday`, { yesterday: yesterdayIso });

    if (excludedUserIds.length > 0) {
      query.andWhere('u.id NOT IN (:...excludedUserIds)', { excludedUserIds });
    }

    const rows = await query.getRawMany<{
      userId: string;
      email: string;
      displayName: string;
      streak: string;
      lastPlayedAt: Date;
    }>();

    return rows.map((row) => ({
      userId: row.userId,
      email: row.email,
      displayName: row.displayName,
      streak: Number(row.streak),
      lastPlayedAt: new Date(row.lastPlayedAt).toISOString(),
    }));
  }

  async dispatchStreakReminders(referenceDate = new Date()): Promise<StreakReminderDispatchResult> {
    const reminderDate = this.toDateOnly(referenceDate);
    const candidates = await this.getStreakReminderCandidates(referenceDate);
    if (candidates.length === 0) {
      return { candidates: 0, sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const candidate of candidates) {
      try {
        await this.sendEmailReminder(candidate);
        await this.reminderLogRepo.save(
          this.reminderLogRepo.create({
            userId: candidate.userId,
            reminderDate,
            channel: 'email',
            status: 'sent',
          }),
        );
        sent++;
      } catch (error) {
        failed++;
        await this.reminderLogRepo.save(
          this.reminderLogRepo.create({
            userId: candidate.userId,
            reminderDate,
            channel: 'email',
            status: 'failed',
            errorMessage: this.normalizeError(error),
          }),
        );
      }
    }

    return {
      candidates: candidates.length,
      sent,
      failed,
    };
  }

  @Cron(envConfig.notifications.streakReminderCron, {
    timeZone: envConfig.notifications.timeZone,
  })
  async runDailyStreakReminderCron(): Promise<void> {
    if (!envConfig.notifications.streakReminderAutoSendEnabled) {
      return;
    }

    const result = await this.dispatchStreakReminders(new Date());
    this.logger.log(
      `Streak reminder cron ejecutado: candidatos=${result.candidates}, enviados=${result.sent}, fallidos=${result.failed}`,
    );
  }

  private async sendEmailReminder(candidate: StreakReminderCandidate): Promise<void> {
    if (envConfig.notifications.emailProvider === 'resend' && envConfig.notifications.resendApiKey) {
      await this.sendWithResend(candidate);
      return;
    }

    this.logger.log(
      `[STREAK_REMINDER][LOG] to=${candidate.email} streak=${candidate.streak} appUrl=${envConfig.notifications.appUrl}`,
    );
  }

  private async sendWithResend(candidate: StreakReminderCandidate): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${envConfig.notifications.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: envConfig.notifications.fromEmail,
        to: [candidate.email],
        subject: `Tu racha de ${candidate.streak} dias te espera en VoleyApp`,
        html: `
          <p>Hola ${candidate.displayName},</p>
          <p>Tu racha actual es de <strong>${candidate.streak} dias</strong> y hoy todavia puedes mantenerla.</p>
          <p><a href="${envConfig.notifications.appUrl}">Entrar a VoleyApp</a></p>
        `,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Resend error ${response.status}: ${detail}`);
    }
  }

  private toDateOnly(date: Date): string {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy.toISOString().slice(0, 10);
  }

  private shiftDays(date: Date, deltaDays: number): Date {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + deltaDays);
    return copy;
  }

  private normalizeError(error: unknown): string {
    if (error instanceof Error) return error.message.slice(0, 500);
    return 'Unknown error';
  }
}
