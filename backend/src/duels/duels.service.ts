import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { QuestionsService } from '../questions/questions.service';
import { QuestionCategory, QuestionType } from '../questions/question.entity';
import { ScoringGame } from '../scoring/scoring.constants';
import { ScoringService } from '../scoring/scoring.service';
import {
  DuelAnswerPayload,
  DuelAuthenticatedUser,
  DuelQuestionPublic,
  DuelStatePublic,
} from './duel.types';

interface DuelQuestionInternal extends DuelQuestionPublic {
  correctOptionIndex: number;
}

interface DuelAnswerInternal {
  userId: string;
  selectedOptionIndex: number;
  timeSeconds: number;
  correct: boolean;
  points: number;
}

interface DuelPlayerInternal {
  userId: string;
  displayName: string;
  avatarEmoji: string;
  score: number;
}

interface DuelRoomInternal {
  roomCode: string;
  hostUserId: string;
  status: 'waiting' | 'active' | 'finished';
  category: QuestionCategory | null;
  players: DuelPlayerInternal[];
  questions: DuelQuestionInternal[];
  currentQuestionIndex: number;
  answersByQuestion: Record<string, DuelAnswerInternal[]>;
  winnerUserId: string | null;
  createdAt: number;
  updatedAt: number;
}

@Injectable()
export class DuelsService {
  private static readonly MAX_PLAYERS = 2;
  private static readonly QUESTIONS_PER_DUEL = 5;
  private static readonly BASE_POINTS = 100;
  private static readonly MAX_SPEED_BONUS = 40;
  private static readonly SPEED_PENALTY_PER_SECOND = 2;

  private readonly rooms = new Map<string, DuelRoomInternal>();
  private readonly roomByUser = new Map<string, string>();

  constructor(
    private readonly questionsService: QuestionsService,
    private readonly scoringService: ScoringService,
  ) {}

  createRoom(host: DuelAuthenticatedUser, category?: QuestionCategory): DuelStatePublic {
    this.leaveRoomByUser(host.id);

    const roomCode = this.generateRoomCode();
    const room: DuelRoomInternal = {
      roomCode,
      hostUserId: host.id,
      status: 'waiting',
      category: category ?? null,
      players: [
        {
          userId: host.id,
          displayName: host.displayName,
          avatarEmoji: host.avatarEmoji,
          score: 0,
        },
      ],
      questions: [],
      currentQuestionIndex: 0,
      answersByQuestion: {},
      winnerUserId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.rooms.set(roomCode, room);
    this.roomByUser.set(host.id, roomCode);
    return this.toPublicState(room);
  }

  joinRoom(roomCode: string, user: DuelAuthenticatedUser): DuelStatePublic {
    const normalizedRoomCode = roomCode.trim().toUpperCase();
    const room = this.rooms.get(normalizedRoomCode);
    if (!room) throw new NotFoundException('La sala no existe');
    if (room.status !== 'waiting') throw new BadRequestException('La sala ya ha comenzado');

    const existingPlayer = room.players.find((player) => player.userId === user.id);
    if (!existingPlayer && room.players.length >= DuelsService.MAX_PLAYERS) {
      throw new BadRequestException('La sala ya esta completa');
    }

    this.leaveRoomByUser(user.id);

    if (!existingPlayer) {
      room.players.push({
        userId: user.id,
        displayName: user.displayName,
        avatarEmoji: user.avatarEmoji,
        score: 0,
      });
    } else {
      existingPlayer.displayName = user.displayName;
      existingPlayer.avatarEmoji = user.avatarEmoji;
    }

    room.updatedAt = Date.now();
    this.roomByUser.set(user.id, normalizedRoomCode);
    return this.toPublicState(room);
  }

  async startRoom(roomCode: string, requesterUserId: string): Promise<DuelStatePublic> {
    const room = this.rooms.get(roomCode);
    if (!room) throw new NotFoundException('La sala no existe');
    if (room.hostUserId !== requesterUserId) {
      throw new BadRequestException('Solo el creador puede iniciar el duelo');
    }
    if (room.players.length !== DuelsService.MAX_PLAYERS) {
      throw new BadRequestException('El duelo necesita exactamente 2 jugadores');
    }
    if (room.status !== 'waiting') {
      throw new BadRequestException('El duelo ya esta en curso o ha finalizado');
    }

    const rawQuestions = await this.questionsService.getRandomQuestions(
      room.category ?? undefined,
      DuelsService.QUESTIONS_PER_DUEL,
      QuestionType.QUIZ,
    );
    if (rawQuestions.length < DuelsService.QUESTIONS_PER_DUEL) {
      throw new BadRequestException('No hay suficientes preguntas para iniciar el duelo');
    }

    room.questions = rawQuestions
      .slice(0, DuelsService.QUESTIONS_PER_DUEL)
      .map((question) => ({
        id: question.id,
        category: question.category,
        question: question.question,
        options: question.options ?? [],
        correctOptionIndex: question.correctOptionIndex ?? -1,
      }));
    room.currentQuestionIndex = 0;
    room.answersByQuestion = {};
    room.status = 'active';
    room.winnerUserId = null;
    room.players.forEach((player) => {
      player.score = 0;
    });
    room.updatedAt = Date.now();

    return this.toPublicState(room);
  }

  async submitAnswer(payload: DuelAnswerPayload, userId: string): Promise<DuelStatePublic> {
    const roomCode = payload.roomCode.trim().toUpperCase();
    const room = this.rooms.get(roomCode);
    if (!room) throw new NotFoundException('La sala no existe');
    if (room.status !== 'active') throw new BadRequestException('El duelo no esta activo');

    const player = room.players.find((entry) => entry.userId === userId);
    if (!player) throw new BadRequestException('No perteneces a esta sala');

    const question = room.questions[room.currentQuestionIndex];
    if (!question) throw new BadRequestException('No hay pregunta activa');
    if (question.id !== payload.questionId) {
      throw new BadRequestException('La respuesta no corresponde con la pregunta actual');
    }
    if (payload.selectedOptionIndex < -1 || payload.selectedOptionIndex >= question.options.length) {
      throw new BadRequestException('Indice de opcion invalido');
    }
    if (payload.timeSeconds < 0 || payload.timeSeconds > 120) {
      throw new BadRequestException('Tiempo fuera de rango');
    }

    const questionAnswers = room.answersByQuestion[question.id] ?? [];
    if (questionAnswers.some((answer) => answer.userId === userId)) {
      throw new BadRequestException('Ya respondiste esta pregunta');
    }

    const correct = payload.selectedOptionIndex === question.correctOptionIndex;
    const points = correct
      ? DuelsService.BASE_POINTS +
        Math.max(0, DuelsService.MAX_SPEED_BONUS - payload.timeSeconds * DuelsService.SPEED_PENALTY_PER_SECOND)
      : 0;

    questionAnswers.push({
      userId,
      selectedOptionIndex: payload.selectedOptionIndex,
      timeSeconds: payload.timeSeconds,
      correct,
      points,
    });
    room.answersByQuestion[question.id] = questionAnswers;
    player.score += points;

    await this.questionsService.recordAnswer(question.id, correct);

    const allAnswered = questionAnswers.length === room.players.length;
    if (allAnswered) {
      if (room.currentQuestionIndex >= room.questions.length - 1) {
        room.status = 'finished';
        room.winnerUserId = this.resolveWinner(room.players);
        room.updatedAt = Date.now();
        await this.persistDuelResult(room);
      } else {
        room.currentQuestionIndex += 1;
        room.updatedAt = Date.now();
      }
    }

    return this.toPublicState(room);
  }

  getRoomState(roomCode: string): DuelStatePublic {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room) throw new NotFoundException('La sala no existe');
    return this.toPublicState(room);
  }

  leaveRoomByUser(userId: string): DuelStatePublic | null {
    const roomCode = this.roomByUser.get(userId);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    this.roomByUser.delete(userId);
    if (!room) return null;

    room.players = room.players.filter((player) => player.userId !== userId);
    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
      return null;
    }

    if (room.hostUserId === userId) {
      room.hostUserId = room.players[0].userId;
    }

    if (room.status === 'active') {
      room.status = 'finished';
      room.winnerUserId = room.players[0]?.userId ?? null;
    }

    room.updatedAt = Date.now();
    return this.toPublicState(room);
  }

  getRoomCodeByUser(userId: string): string | null {
    return this.roomByUser.get(userId) ?? null;
  }

  private toPublicState(room: DuelRoomInternal): DuelStatePublic {
    const currentQuestion = room.status === 'active' ? room.questions[room.currentQuestionIndex] ?? null : null;
    return {
      roomCode: room.roomCode,
      hostUserId: room.hostUserId,
      status: room.status,
      category: room.category,
      players: room.players.map((player) => ({
        userId: player.userId,
        displayName: player.displayName,
        avatarEmoji: player.avatarEmoji,
        score: Math.round(player.score),
      })),
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions: room.questions.length,
      currentQuestion: currentQuestion
        ? {
            id: currentQuestion.id,
            category: currentQuestion.category,
            question: currentQuestion.question,
            options: currentQuestion.options,
          }
        : null,
      canStart: room.status === 'waiting' && room.players.length === DuelsService.MAX_PLAYERS,
      winnerUserId: room.winnerUserId,
    };
  }

  private resolveWinner(players: DuelPlayerInternal[]): string | null {
    if (players.length === 0) return null;
    const sorted = [...players].sort((a, b) => b.score - a.score);
    if (sorted.length > 1 && sorted[0].score === sorted[1].score) {
      return null;
    }
    return sorted[0].userId;
  }

  private async persistDuelResult(room: DuelRoomInternal): Promise<void> {
    const winnerId = room.winnerUserId;
    await Promise.all(
      room.players.map((player) =>
        this.scoringService
          .applyGameScore({
            userId: player.userId,
            game: ScoringGame.DUEL,
            rawPoints: Math.round(player.score),
            sessionWon: winnerId !== null && player.userId === winnerId,
            source: 'duel_room',
            sourceId: room.roomCode,
            metadata: {
              category: room.category,
              winnerUserId: winnerId,
            },
          })
          .then(() => undefined)
          .catch(() => undefined),
      ),
    );
  }

  private generateRoomCode(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
    } while (this.rooms.has(code));
    return code;
  }
}
