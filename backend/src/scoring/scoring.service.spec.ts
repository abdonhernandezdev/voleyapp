import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ScoringService } from './scoring.service';
import { ScoreEvent } from './score-event.entity';
import { UsersService } from '../users/users.service';
import { ScoringGame } from './scoring.constants';

function makeQueryBuilder(getCountValue: number) {
  return {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(getCountValue),
  };
}

describe('ScoringService', () => {
  let service: ScoringService;
  let scoreEventRepo: any;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    scoreEventRepo = {
      create: jest.fn((value) => value),
      save: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoringService,
        { provide: getRepositoryToken(ScoreEvent), useValue: scoreEventRepo },
        {
          provide: UsersService,
          useValue: {
            addPoints: jest.fn().mockResolvedValue({
              id: 'user-1',
              totalPoints: 1000,
              gamesPlayed: 10,
              sessionsWon: 5,
              streak: 2,
              maxStreak: 7,
            }),
          },
        },
      ],
    }).compile();

    service = module.get(ScoringService);
    usersService = module.get(UsersService);
  });

  it('awards full points in the first daily score for a general game', async () => {
    scoreEventRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder(0));

    const result = await service.applyGameScore({
      userId: 'user-1',
      game: ScoringGame.QUIZ,
      rawPoints: 1000,
      sessionWon: true,
    });

    expect(result.awardedPoints).toBe(1000);
    expect(result.dailyCapApplied).toBe(false);
    expect(usersService.addPoints).toHaveBeenCalledWith('user-1', 1000, true);
  });

  it('applies reduced multiplier on the second daily score for a general game', async () => {
    scoreEventRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder(1));

    const result = await service.applyGameScore({
      userId: 'user-1',
      game: ScoringGame.QUIZ,
      rawPoints: 1000,
      sessionWon: true,
    });

    expect(result.awardedPoints).toBe(700);
    expect(result.dailyCapApplied).toBe(false);
    expect(usersService.addPoints).toHaveBeenCalledWith('user-1', 700, true);
  });

  it('blocks points after the second daily score for a general game', async () => {
    scoreEventRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder(2));

    const result = await service.applyGameScore({
      userId: 'user-1',
      game: ScoringGame.QUIZ,
      rawPoints: 1000,
      sessionWon: true,
    });

    expect(result.awardedPoints).toBe(0);
    expect(result.dailyCapApplied).toBe(true);
    expect(usersService.addPoints).toHaveBeenCalledWith('user-1', 0, true);
  });

  it('keeps unlimited but low scoring for individual games', async () => {
    scoreEventRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder(999));

    const result = await service.applyGameScore({
      userId: 'user-1',
      game: ScoringGame.ROLE_RECEPTION,
      rawPoints: 500,
    });

    expect(result.awardedPoints).toBe(8);
    expect(result.dailyAwardLimit).toBeNull();
    expect(result.dailyCapApplied).toBe(false);
  });

  it('returns grouped daily status for general and individual games', async () => {
    scoreEventRepo.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        { game: ScoringGame.QUIZ, count: '2' },
        { game: ScoringGame.ROLE_RECEPTION, count: '7' },
      ]),
    });

    const result = await service.getUserDailyStatus('user-1');

    const quiz = result.general.find((item) => item.game === ScoringGame.QUIZ);
    const roleReception = result.individual.find((item) => item.game === ScoringGame.ROLE_RECEPTION);
    expect(quiz?.remainingAwardsToday).toBe(0);
    expect(quiz?.canStillScore).toBe(false);
    expect(roleReception?.dailyAwardLimit).toBeNull();
    expect(roleReception?.canStillScore).toBe(true);
  });
});
