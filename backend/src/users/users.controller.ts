import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { envConfig } from '../config/env.config';

@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiTags('Users')
@ApiCookieAuth(envConfig.auth.cookieName)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Actualizar perfil del usuario autenticado' })
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(userId, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH)
  @ApiOperation({ summary: 'Listar jugadores (solo entrenador)' })
  findAll() {
    return this.usersService.findPlayers();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH)
  @ApiOperation({ summary: 'Obtener perfil de un jugador por id (solo entrenador)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getProfile(id);
  }
}
