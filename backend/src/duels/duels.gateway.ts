import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { BadRequestException, Logger } from '@nestjs/common';
import { envConfig } from '../config/env.config';
import { UsersService } from '../users/users.service';
import { DuelsService } from './duels.service';
import {
  DuelAnswerPayload,
  DuelAuthenticatedUser,
  DuelCreatePayload,
  DuelJoinPayload,
} from './duel.types';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@WebSocketGateway({
  namespace: '/duels',
  cors: {
    origin: envConfig.app.corsOrigins,
    credentials: true,
  },
})
export class DuelsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(DuelsGateway.name);

  @WebSocketServer()
  private server: Server;

  constructor(
    private readonly duelsService: DuelsService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const user = await this.authenticateSocket(client);
      client.data.user = user;
      client.emit('duel:connected', { userId: user.id });
    } catch (error) {
      this.logger.warn(`WS auth failed: ${this.normalizeError(error)}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const user = client.data.user as DuelAuthenticatedUser | undefined;
    if (!user) return;

    const roomCode = this.duelsService.getRoomCodeByUser(user.id);
    const state = this.duelsService.leaveRoomByUser(user.id);
    if (roomCode && state) {
      this.server.to(roomCode).emit('duel:state', state);
    }
  }

  @SubscribeMessage('duel:create')
  handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: DuelCreatePayload | undefined,
  ) {
    return this.executeSafely(client, () => {
      const user = this.requireUser(client);
      const state = this.duelsService.createRoom(user, payload?.category);
      client.join(state.roomCode);
      client.emit('duel:state', state);
      return { ok: true, roomCode: state.roomCode };
    });
  }

  @SubscribeMessage('duel:join')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: DuelJoinPayload,
  ) {
    return this.executeSafely(client, () => {
      if (!payload?.roomCode) {
        throw new BadRequestException('roomCode es obligatorio');
      }
      const user = this.requireUser(client);
      const state = this.duelsService.joinRoom(payload.roomCode, user);
      client.join(state.roomCode);
      this.server.to(state.roomCode).emit('duel:state', state);
      return { ok: true };
    });
  }

  @SubscribeMessage('duel:start')
  async handleStartRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: DuelJoinPayload,
  ) {
    return this.executeSafely(client, async () => {
      if (!payload?.roomCode) {
        throw new BadRequestException('roomCode es obligatorio');
      }
      const user = this.requireUser(client);
      const roomCode = payload.roomCode.trim().toUpperCase();
      const state = await this.duelsService.startRoom(roomCode, user.id);
      this.server.to(state.roomCode).emit('duel:state', state);
      return { ok: true };
    });
  }

  @SubscribeMessage('duel:answer')
  async handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: DuelAnswerPayload,
  ) {
    return this.executeSafely(client, async () => {
      const user = this.requireUser(client);
      const state = await this.duelsService.submitAnswer(payload, user.id);
      this.server.to(state.roomCode).emit('duel:state', state);
      if (state.status === 'finished') {
        this.server.to(state.roomCode).emit('duel:finished', state);
      }
      return { ok: true };
    });
  }

  @SubscribeMessage('duel:get-state')
  handleGetState(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: DuelJoinPayload,
  ) {
    return this.executeSafely(client, () => {
      if (!payload?.roomCode) {
        throw new BadRequestException('roomCode es obligatorio');
      }
      const state = this.duelsService.getRoomState(payload.roomCode);
      client.emit('duel:state', state);
      return { ok: true };
    });
  }

  private requireUser(client: Socket): DuelAuthenticatedUser {
    const user = client.data.user as DuelAuthenticatedUser | undefined;
    if (!user) {
      throw new BadRequestException('Socket no autenticado');
    }
    return user;
  }

  private async authenticateSocket(client: Socket): Promise<DuelAuthenticatedUser> {
    const cookieHeader = client.handshake.headers.cookie;
    if (typeof cookieHeader !== 'string' || cookieHeader.trim().length === 0) {
      throw new BadRequestException('Cookie de autenticacion no encontrada');
    }

    const token = this.extractCookieToken(cookieHeader, envConfig.auth.cookieName);
    if (!token) {
      throw new BadRequestException('Token de autenticacion no encontrado');
    }

    const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: envConfig.auth.jwtSecret,
      issuer: envConfig.auth.jwtIssuer,
      audience: envConfig.auth.jwtAudience,
    });

    const user = await this.usersService.findById(payload.sub);
    return {
      id: user.id,
      displayName: user.displayName || user.username,
      avatarEmoji: user.avatarEmoji || 'sports_volleyball',
    };
  }

  private extractCookieToken(cookieHeader: string, cookieName: string): string | null {
    const pairs = cookieHeader.split(';');
    for (const pair of pairs) {
      const [rawName, ...rawValue] = pair.trim().split('=');
      if (rawName === cookieName) {
        try {
          return decodeURIComponent(rawValue.join('='));
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  private async executeSafely(
    client: Socket,
    action: () => Promise<{ ok: boolean; roomCode?: string }> | { ok: boolean; roomCode?: string },
  ): Promise<{ ok: boolean; roomCode?: string }> {
    try {
      return await action();
    } catch (error) {
      client.emit('duel:error', { message: this.normalizeError(error) });
      return { ok: false };
    }
  }

  private normalizeError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Error inesperado';
  }
}
