import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UsersService } from './users.service';
import { User, UserRole } from './user.entity';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-uuid-1',
    username: 'testplayer',
    email: 'player@test.com',
    password: 'hashed-password',
    displayName: 'Test Player',
    avatarEmoji: 'sports_volleyball',
    role: UserRole.PLAYER,
    totalPoints: 0,
    gamesPlayed: 0,
    sessionsWon: 0,
    streak: 0,
    maxStreak: 0,
    lastPlayedAt: null as any,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  } as User;
}

// ─── QueryBuilder mock for addPoints ────────────────────────────────────────

function makeQueryBuilder(resolvedUser: User | null) {
  const qb: any = {
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(resolvedUser),
  };
  return qb;
}

function makeManagerMock(user: User | null) {
  const qb = makeQueryBuilder(user);
  const repoMock = {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    save: jest.fn().mockImplementation((u) => Promise.resolve(u)),
  };
  return {
    getRepository: jest.fn().mockReturnValue(repoMock),
    _qb: qb,
    _repo: repoMock,
  };
}

// ─── Suite ──────────────────────────────────────────────────────────────────

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: any;
  let dataSource: any;

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    dataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  // ─── create ─────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should hash the password and save a new user', async () => {
      userRepo.findOne.mockResolvedValue(null);
      const created = makeUser();
      userRepo.create.mockReturnValue(created);
      userRepo.save.mockResolvedValue(created);

      const result = await service.create({
        username: 'testplayer',
        email: 'player@test.com',
        password: 'plaintext',
      });

      expect(userRepo.findOne).toHaveBeenCalled();
      expect(userRepo.save).toHaveBeenCalled();
      expect(result.role).toBe(UserRole.PLAYER);
    });

    it('should throw ConflictException if email or username already exists', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());

      await expect(
        service.create({ username: 'testplayer', email: 'player@test.com', password: 'pass' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── findByEmail ─────────────────────────────────────────────────────────

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      const user = makeUser();
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('player@test.com');
      expect(result).toBe(user);
    });

    it('should return null when not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nope@test.com');
      expect(result).toBeNull();
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return user when found', async () => {
      const user = makeUser();
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.findById('user-uuid-1');
      expect(result).toBe(user);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('no-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── addPoints — streak logic ─────────────────────────────────────────────

  describe('addPoints', () => {
    it('should set streak=1 on first session (no lastPlayedAt)', async () => {
      const user = makeUser({ lastPlayedAt: null as any, streak: 0, maxStreak: 0 });
      const manager = makeManagerMock(user);
      dataSource.transaction.mockImplementation((fn: any) => fn(manager));

      const result = await service.addPoints('user-uuid-1', 100, true);

      expect(result.streak).toBe(1);
      expect(result.gamesPlayed).toBe(1);
      expect(result.sessionsWon).toBe(1);
      expect(result.totalPoints).toBe(100);
    });

    it('should not change streak when already played today', async () => {
      const today = new Date();
      const user = makeUser({ lastPlayedAt: today, streak: 3 });
      const manager = makeManagerMock(user);
      dataSource.transaction.mockImplementation((fn: any) => fn(manager));

      const result = await service.addPoints('user-uuid-1', 50, false);

      expect(result.streak).toBe(3);
    });

    it('should increment streak when played yesterday', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const user = makeUser({ lastPlayedAt: yesterday, streak: 2 });
      const manager = makeManagerMock(user);
      dataSource.transaction.mockImplementation((fn: any) => fn(manager));

      const result = await service.addPoints('user-uuid-1', 50, false);

      expect(result.streak).toBe(3);
    });

    it('should reset streak to 1 when gap is more than 1 day', async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const user = makeUser({ lastPlayedAt: threeDaysAgo, streak: 5 });
      const manager = makeManagerMock(user);
      dataSource.transaction.mockImplementation((fn: any) => fn(manager));

      const result = await service.addPoints('user-uuid-1', 50, false);

      expect(result.streak).toBe(1);
    });

    it('should update maxStreak when current streak exceeds it', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const user = makeUser({ lastPlayedAt: yesterday, streak: 4, maxStreak: 4 });
      const manager = makeManagerMock(user);
      dataSource.transaction.mockImplementation((fn: any) => fn(manager));

      const result = await service.addPoints('user-uuid-1', 50, false);

      expect(result.streak).toBe(5);
      expect(result.maxStreak).toBe(5);
    });

    it('should throw NotFoundException when user not found in transaction', async () => {
      const manager = makeManagerMock(null);
      dataSource.transaction.mockImplementation((fn: any) => fn(manager));

      await expect(service.addPoints('no-uuid', 50, false)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── toPublicProfile ──────────────────────────────────────────────────────

  describe('toPublicProfile', () => {
    it('should return user without password field', () => {
      const user = makeUser();
      const profile = service.toPublicProfile(user);

      expect(profile).not.toHaveProperty('password');
      expect(profile.id).toBe(user.id);
      expect(profile.email).toBe(user.email);
    });
  });
});
