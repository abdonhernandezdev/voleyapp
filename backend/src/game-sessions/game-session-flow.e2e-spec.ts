import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { DataType, newDb } from 'pg-mem';
import * as request from 'supertest';
import cookieParser = require('cookie-parser');
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { QuestionsModule } from '../questions/questions.module';
import { GameSessionsModule } from './game-sessions.module';
import { User } from '../users/user.entity';
import { Question, QuestionCategory, QuestionType, Difficulty } from '../questions/question.entity';
import { GameMode, GameSession } from './game-session.entity';
import { UsersService } from '../users/users.service';
import { UserAchievement } from '../achievements/user-achievement.entity';
import { ScoreEvent } from '../scoring/score-event.entity';

describe('Game Session Flow (e2e)', () => {
  jest.setTimeout(60_000);

  let app: INestApplication;
  let dataSource: DataSource;
  let questionRepo: Repository<Question>;

  beforeAll(async () => {
    const db = newDb({ autoCreateForeignKeyIndices: true });
    db.public.registerFunction({
      name: 'current_database',
      returns: DataType.text,
      implementation: () => 'voley_test',
    });
    db.public.registerFunction({
      name: 'version',
      returns: DataType.text,
      implementation: () => 'PostgreSQL 16.0 on pg-mem',
    });
    db.public.registerFunction({
      name: 'random',
      returns: DataType.float,
      implementation: () => Math.random(),
    });
    db.public.registerFunction({
      name: 'uuid_generate_v4',
      returns: DataType.uuid,
      implementation: () => randomUUID(),
    });

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: () =>
            ({
              type: 'postgres',
              entities: [User, Question, GameSession, UserAchievement, ScoreEvent],
              synchronize: true,
              migrationsRun: false,
              autoLoadEntities: false,
              retryAttempts: 1,
              retryDelay: 0,
            }) as DataSourceOptions,
          dataSourceFactory: async (options) => {
            if (!options) {
              throw new Error('TypeORM options are required for e2e data source');
            }
            const ds = await db.adapters.createTypeormDataSource(options as DataSourceOptions);
            return ds.initialize();
          },
        }),
        AuthModule,
        UsersModule,
        QuestionsModule,
        GameSessionsModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        transform: true,
      }),
    );
    await app.init();

    dataSource = moduleRef.get(DataSource);
    questionRepo = dataSource.getRepository(Question);

    const usersService = moduleRef.get(UsersService);
    jest.spyOn(usersService, 'addPoints').mockImplementation(async (id, points) => {
      return {
        id,
        role: 'player',
        totalPoints: points,
        gamesPlayed: 1,
        sessionsWon: 1,
        streak: 1,
        maxStreak: 1,
      } as User;
    });

    for (let index = 0; index < 10; index++) {
      await questionRepo.save({
        id: randomUUID(),
        type: QuestionType.QUIZ,
        category: QuestionCategory.BASIC_RULES,
        difficulty: Difficulty.EASY,
        question: `Pregunta e2e ${index + 1}`,
        explanation: 'Pregunta de prueba para e2e',
        options: ['A', 'B', 'C', 'D'],
        correctOptionIndex: index % 4,
        isActive: true,
      });
    }
  });

  afterAll(async () => {
    if (app) await app.close();
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  it('register -> me -> start -> answer -> complete -> stats', async () => {
    const agent = request.agent(app.getHttpServer());
    const username = `player_${Date.now()}`;
    const email = `${username}@test.local`;
    const password = 'pass1234';

    const registerResponse = await agent.post('/api/auth/register').send({
      username,
      email,
      password,
      displayName: 'Player Test',
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.user.username).toBe(username);

    const meResponse = await agent.get('/api/auth/me');
    expect(meResponse.status).toBe(200);
    expect(meResponse.body.username).toBe(username);

    const startResponse = await agent.post('/api/game-sessions/start').send({ mode: GameMode.QUICK });
    expect(startResponse.status).toBe(201);
    expect(startResponse.body.session).toBeDefined();
    expect(startResponse.body.questions.length).toBe(10);

    const sessionId: string = startResponse.body.session.id;

    for (const publicQuestion of startResponse.body.questions as Array<{ id: string }>) {
      const stored = await questionRepo.findOne({ where: { id: publicQuestion.id } });
      expect(stored).toBeTruthy();

      const answerResponse = await agent
        .post(`/api/game-sessions/${sessionId}/answer`)
        .send({
          questionId: publicQuestion.id,
          answer: {
            selectedOptionIndex: stored!.correctOptionIndex,
            timeSeconds: 5,
          },
        });

      expect(answerResponse.status).toBe(201);
      expect(answerResponse.body.correct).toBe(true);
    }

    const completeResponse = await agent
      .patch(`/api/game-sessions/${sessionId}/complete`)
      .send({ totalTimeSpentSeconds: 120 });

    expect(completeResponse.status).toBe(200);
    expect(completeResponse.body.completed).toBe(true);

    const statsResponse = await agent.get('/api/game-sessions/my-stats');
    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.totalSessions).toBe(1);
  });
});
