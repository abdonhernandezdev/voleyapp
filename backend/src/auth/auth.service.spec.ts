import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user.entity';

const mockUser = {
  id: 'uuid-1',
  username: 'testuser',
  email: 'test@test.com',
  password: bcrypt.hashSync('correct-password', 1),
  displayName: 'Test User',
  avatarEmoji: 'sports_volleyball',
  role: UserRole.PLAYER,
  totalPoints: 0,
  gamesPlayed: 0,
  sessionsWon: 0,
  streak: 0,
  maxStreak: 0,
  lastPlayedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findByEmail: jest.fn(),
            toPublicProfile: jest.fn((u) => {
              const { password, ...profile } = u;
              return profile;
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  describe('register', () => {
    it('should return user profile and token on success', async () => {
      usersService.create.mockResolvedValue(mockUser as any);

      const result = await service.register({
        username: 'testuser',
        email: 'test@test.com',
        password: 'password123',
      });

      expect(result.token).toBe('mock-jwt-token');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user.email).toBe('test@test.com');
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: mockUser.id, email: mockUser.email, role: mockUser.role },
        expect.any(Object),
      );
    });

    it('should propagate ConflictException from usersService.create', async () => {
      usersService.create.mockRejectedValue(new ConflictException('No se pudo crear la cuenta'));

      await expect(
        service.register({ username: 'dup', email: 'dup@test.com', password: 'password123' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return user profile and token for valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);

      const result = await service.login({ email: 'test@test.com', password: 'correct-password' });

      expect(result.token).toBe('mock-jwt-token');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);

      await expect(
        service.login({ email: 'test@test.com', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user does not exist (timing-safe)', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'noexist@test.com', password: 'anypassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
