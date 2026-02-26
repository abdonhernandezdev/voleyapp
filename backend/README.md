# VoleyApp — Backend

<p align="center">
  <img src="../frontend/src/assets/voleyplay_logo.png" alt="Logo VoleyPlay" width="120" />
</p>

API REST (y WebSocket) para la aplicación de aprendizaje de voleibol. Gestiona autenticación, preguntas, sesiones de juego, rankings, minijuegos de entrenamiento y configuración de zonas de formación.

> Estado actual: **Versión Beta (MVP)**

---

## Stack

| Tecnología | Versión |
|---|---|
| NestJS | ^10 |
| TypeORM | ^0.3.20 |
| PostgreSQL | 14+ / 16 (Docker) |
| Passport + JWT | — |
| Socket.IO | ^4.8 |
| Swagger | ^7 |
| Jest | ^29 |

> **Importante:** Todos los paquetes `@nestjs/*` están fijados a `^10.x`. No instalar v11.

---

## Estructura de módulos

```
backend/src/
├── app.module.ts
├── main.ts
├── data-source.ts                   # TypeORM CLI DataSource
├── config/
│   └── env.config.ts                # Parseo y validación centralizada de env vars
├── common/
│   └── decorators/
│       └── current-user.decorator.ts
├── migrations/                      # Migraciones TypeORM en orden numérico
│   ├── 1771924755305-Initial.ts
│   └── 1771970000000-FormationConfig.ts
├── seeds/
│   └── seed.ts                      # Semilla de 28 preguntas
│
├── auth/          # JWT + Passport, login/register, guards, decoradores
├── users/         # Perfiles, estadísticas, avatares
├── questions/     # Banco de 28 preguntas en 5 categorías
├── game-sessions/ # Sesiones de juego, respuestas JSONB, puntuación
├── rankings/      # Ranking global agregado
├── achievements/  # Logros y recompensas de puntos
├── notifications/ # Notificaciones in-app
├── duels/         # Partidas en tiempo real (WebSocket)
├── coach/         # Panel de entrenador (jugadores, asignaciones)
├── scoring/       # Servicio de scoring compartido
├── rewards/       # Historial de recompensas
├── training/      # Validación server-side de minijuegos
└── formation-config/  # Zonas rectangulares por jugador/rotación
```

---

## API Endpoints

### Auth — `/api/auth`
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/register` | Registro de nuevo jugador |
| POST | `/auth/login` | Login → establece cookie httpOnly |
| POST | `/auth/logout` | Limpia cookie |
| GET | `/auth/me` | Usuario autenticado actual |

### Training — `/api/training`
| Método | Ruta | Guards | Descripción |
|---|---|---|---|
| POST | `/training/rotation/check` | JWT | Valida colocación de rotación completa (6 jugadores) |
| POST | `/training/defense-zone/check` | JWT | Valida defensa por zona de ataque rival |
| POST | `/training/role-reception/check` | JWT | Valida posición individual de recepción |
| POST | `/training/role-defense/check` | JWT | Valida posición individual de defensa |
| POST | `/training/complete` | JWT | Registra puntuación final de minijuego |
| GET | `/training/formation-status/:gameKey` | JWT | ¿Está configurado el juego? (para jugadores) |

### Formation Config — `/api/coach/formation-config` y `/api/training`
| Método | Ruta | Guards | Descripción |
|---|---|---|---|
| GET | `/coach/formation-config/status` | JWT + COACH | Status de todos los juegos |
| GET | `/coach/formation-config/:family/:system/:idx` | JWT + COACH | Zonas de una rotación |
| PUT | `/coach/formation-config/:family/:system/:idx` | JWT + COACH | Guardar zonas (upsert) |

`system` puede ser `5-1`, `4-2`, `6-2` o la cadena `null` (para defensa, donde el sistema es NULL en DB).

### Rankings, Achievements, Coach, etc.
Ver Swagger en `http://localhost:3000/api/docs` (solo en `NODE_ENV != production`).

---

## Autenticación y roles

- JWT almacenado en cookie `httpOnly` `voley_access_token` (sin localStorage).
- Guards: `JwtAuthGuard`, `RolesGuard`, `OptionalJwtAuthGuard`.
- Decoradores: `@Roles(UserRole.COACH)`, `@CurrentUser()`.
- Roles disponibles: `player` (por defecto al registrarse), `coach` (asignar manualmente en DB).

---

## Módulo `FormationConfig`

Permite al entrenador definir rectángulos de zona válida por jugador en cada rotación/escenario.

### Tabla `formation_zone_configs`

```sql
id          UUID PK
game_family VARCHAR(20)          -- 'reception' | 'defense'
system      VARCHAR(10) NULLABLE  -- '5-1' | '4-2' | '6-2' | NULL
idx         INTEGER               -- 0..5 (rotación) o 0..2 (escenario)
player_id   INTEGER               -- 1..6 (slot dentro de rotación/escenario)
x           FLOAT                 -- esquina superior-izquierda (0-100)
y           FLOAT
w           FLOAT                 -- ancho del rectángulo (0-100)
h           FLOAT                 -- alto del rectángulo (0-100)
updated_by  UUID NULLABLE         -- coachId (auditoría)
updated_at  TIMESTAMPTZ
UNIQUE (game_family, system, idx, player_id)
```

### Requisitos de configuración

| Juego | `gameFamily` | `system` | Registros requeridos |
|---|---|---|---|
| Simulador Recepción 5-1 | `reception` | `5-1` | 36 (6 rot × 6 jugadores) |
| Simulador Recepción 4-2 | `reception` | `4-2` | 36 |
| Simulador Recepción 6-2 | `reception` | `6-2` | 36 |
| Defensa por zona y rol | `defense` | `NULL` | 18 (3 esc × 6 jugadores) |

### Validación rectangular en TrainingService

```typescript
private isInRect(point: Point, zone: ZoneConfig): boolean {
  return point.x >= zone.x && point.x <= zone.x + zone.w &&
         point.y >= zone.y && point.y <= zone.y + zone.h;
}
```

Si el juego no está configurado (sin registros), los endpoints de check lanzan `BadRequestException('Juego no configurado')`.

---

## Módulo `Training` — Lógica de validación

| Método | Descripción |
|---|---|
| `checkRotationRound(dto)` | Carga 6 zonas del sistema/rotación, evalúa si cada jugador está dentro. Maneja pares (Central 1/2, Receptor 1/2) con asignación óptima. |
| `checkDefenseScenario(dto)` | Carga 6 zonas del escenario de defensa. |
| `checkRoleReception(dto)` | Carga zona del jugador individual en su posición de rol. |
| `checkRoleDefense(dto)` | Resuelve el slot según el rol elegido y el escenario, carga zona individual. |
| `completeTrainingGame(userId, dto)` | Persiste puntuación, aplica lógica de daily cap (máx. 2 partidas por día), otorga logros. |

---

## Sistema de puntuación

| Evento | Puntos |
|---|---|
| Respuesta correcta (quiz) | +100 |
| Bonus velocidad (< 10 s) | +50 |
| Racha 3 correctas | +50 |
| Racha 6 correctas | +100 |
| Respuesta incorrecta / timeout | 0 |

Constantes en `backend/src/game-sessions/scoring.constants.ts`.

Los minijuegos de posición tienen su propio cálculo de puntos por ronda (tiempo + aciertos).

---

## Migraciones

```bash
# Generar migración (ejecutar DENTRO del contenedor Docker — la DB no es accesible desde host)
docker exec voley_backend sh -c \
  "cd /app && npx typeorm-ts-node-commonjs migration:generate \
   -d src/data-source.ts src/migrations/<NombreMigracion>"

# Aplicar migraciones pendientes
npm run migration:run

# Revertir última migración
npm run migration:revert
```

> `DB_SYNCHRONIZE=false` en producción. Las migraciones corren automáticamente con `DB_MIGRATIONS_RUN=true`.

---

## Semilla de preguntas

```bash
cd backend
npm run seed
```

Carga 28 preguntas en 5 categorías (reglas, posiciones, técnica, táctica, historia).

---

## Tests

```bash
npm test                 # Todos los tests (Jest, --forceExit)
npm run test:cov         # Con reporte de cobertura
```

4 suites, ~19 tests. Incluye:
- `auth.service.spec.ts`
- `users.service.spec.ts`
- `game-sessions.service.spec.ts`
- `training.service.spec.ts` — prueba validación rectangular, par swapping, daily cap

**Patrones de mock:**
```typescript
// Repositorios TypeORM
{ provide: getRepositoryToken(Entity), useValue: { findOne, save, create, find } }
// FormationConfigService
{ provide: FormationConfigService, useValue: { getZonesForRotation: jest.fn(), ... } }
```

---

## Variables de entorno

```env
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=voley_app
DATABASE_USER=voley_user
DATABASE_PASSWORD=voley_pass
DB_SYNCHRONIZE=false         # true solo en desarrollo sin migraciones
DB_MIGRATIONS_RUN=true
JWT_SECRET=<min 32 chars en producción>
JWT_EXPIRES_IN=7d
AUTH_COOKIE_NAME=voley_access_token
CORS_ORIGINS=http://localhost:4200
PORT=3000
```

Para producción, copiar `.env.production.example` → `.env.production` y reemplazar todos los `CHANGE_ME`.

---

## Comandos de desarrollo

```bash
npm install           # Instalar dependencias
npm run start:dev     # Modo watch (http://localhost:3000)
npm run build         # Compilar a dist/
npm run start:prod    # Ejecutar compilado
npm run seed          # Cargar preguntas en DB
npm test              # Ejecutar tests
```

---

## Seguridad

- Rate limiting: 120 req/min global, 8 req/min en endpoints de auth (ThrottlerModule)
- Helmet middleware
- bcryptjs con 12 rondas para hashing de contraseñas
- CSRF protection por validación de origen
- Contenedores Docker como usuario no-root `appuser`
- Validación de secretos débiles en `env.config.ts` al arrancar en producción

---

## Swagger

Disponible en `http://localhost:3000/api/docs` cuando `NODE_ENV !== 'production'`.
