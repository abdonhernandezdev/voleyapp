# VoleyPlay — Manual Técnico

**Versión:** 1.0
**Fecha:** Febrero 2026
**Audiencia:** Desarrolladores, DevOps, administradores de sistemas

---

## Tabla de Contenidos

1. [Visión General del Sistema](#1-visión-general-del-sistema)
2. [Arquitectura](#2-arquitectura)
3. [Requisitos de Infraestructura](#3-requisitos-de-infraestructura)
4. [Instalación y Configuración](#4-instalación-y-configuración)
   - 4.1 [Con Docker (recomendado)](#41-con-docker-recomendado)
   - 4.2 [Desarrollo Local sin Docker](#42-desarrollo-local-sin-docker)
5. [Variables de Entorno](#5-variables-de-entorno)
6. [Base de Datos](#6-base-de-datos)
7. [Backend — NestJS](#7-backend--nestjs)
8. [Frontend — Angular](#8-frontend--angular)
9. [Autenticación y Seguridad](#9-autenticación-y-seguridad)
10. [Sistema de Puntuación](#10-sistema-de-puntuación)
11. [API — Endpoints Principales](#11-api--endpoints-principales)
12. [Testing](#12-testing)
13. [Despliegue en Producción](#13-despliegue-en-producción)
14. [Monitorización y Logs](#14-monitorización-y-logs)
15. [Diagrama de Entidades](#15-diagrama-de-entidades)
16. [Accesibilidad (MVP/Beta)](#16-accesibilidad-mvpbeta)

---

## 1. Visión General del Sistema

**VoleyPlay** es una aplicación fullstack de aprendizaje de voleibol. Utiliza una arquitectura cliente-servidor desacoplada:

```
Navegador (Angular 19)
       │  HTTP/REST (cookies httpOnly)
       ▼
   NestJS 10 API  ─────►  PostgreSQL 16
       │
       └──► (Migraciones TypeORM)
```

**Monorepo:**

```
voley-app/
├── backend/          # NestJS 10 API
├── frontend/         # Angular 19 SPA
├── docs/             # Documentación generada
├── docker-compose.yml
└── docker-compose.prod.yml
```

---

## 2. Arquitectura

### 2.1 Capa de Frontend

- **Framework:** Angular 19 con componentes standalone
- **UI:** Angular Material 19
- **Patrón de estado:** Facade pattern — cada feature expone un `*.facade.ts` con Observables
- **Lazy loading** en todas las rutas de feature
- **Proxy de desarrollo:** `/api/*` → `http://localhost:3000` (via `proxy.conf.json`)

### 2.2 Capa de Backend

- **Framework:** NestJS 10 (Express bajo el capó)
- **ORM:** TypeORM 0.3 con migraciones explícitas
- **Validación:** `class-validator` + `class-transformer`
- **Autenticación:** Passport JWT — token en cookie `httpOnly`

### 2.3 Módulos NestJS

| Módulo             | Responsabilidad                                 |
| ------------------ | ----------------------------------------------- |
| `auth`             | Login, registro, guards, estrategia JWT         |
| `users`            | Perfiles, estadísticas agregadas                |
| `questions`        | Banco de preguntas (28 items, 5 categorías)     |
| `game-sessions`    | Sesiones, respuestas, cálculo de puntos         |
| `rankings`         | Leaderboard global agregado                     |
| `training`         | Validación server-side de minijuegos            |
| `formation-config` | Zonas de formación configurables por entrenador |
| `common`           | Filtro global de excepciones, decoradores       |

### 2.4 Capa de Base de Datos

- **Motor:** PostgreSQL 16
- **Gestión de esquema:** TypeORM migrations (no `synchronize` en producción)
- **Migraciones disponibles:**
  - `1771924755305-Initial.ts` — esquema base
  - `1771970000000-FormationConfig.ts` — tabla `formation_zone_configs`

---

## 3. Requisitos de Infraestructura

| Componente     | Versión mínima       |
| -------------- | -------------------- |
| Node.js        | 20 LTS               |
| npm            | 9+                   |
| Docker         | 24+                  |
| Docker Compose | 2.x                  |
| PostgreSQL     | 14+ (16 recomendado) |
| Angular CLI    | 19                   |

**Puertos usados:**

| Servicio   | Puerto                        |
| ---------- | ----------------------------- |
| Frontend   | 4200 (dev) / 80 (prod Docker) |
| Backend    | 3000                          |
| PostgreSQL | 5432                          |

---

## 4. Instalación y Configuración

### 4.1 Con Docker (recomendado)

```bash
# Clonar repositorio
git clone <repo-url> voley-app
cd voley-app

# Levantar todos los servicios (DB + backend + frontend)
docker-compose up -d

# Ver logs
docker-compose logs -f

# Cargar preguntas (primer arranque)
docker exec voley_backend sh -c "cd /app && npm run seed"

# Detener servicios
docker-compose down
```

**Servicios Docker:**

| Contenedor       | Imagen                 | Puerto  |
| ---------------- | ---------------------- | ------- |
| `voley_db`       | postgres:16-alpine     | 5432    |
| `voley_backend`  | node:20-alpine (build) | 3000    |
| `voley_frontend` | node:20-alpine / nginx | 4200/80 |

> Los contenedores corren como usuario no-root `appuser` por seguridad.

---

### 4.2 Desarrollo Local sin Docker

**Prerrequisito:** PostgreSQL corriendo localmente.

```sql
-- Crear base de datos y usuario
CREATE DATABASE voley_app;
CREATE USER voley_user WITH PASSWORD 'voley_pass';
GRANT ALL PRIVILEGES ON DATABASE voley_app TO voley_user;
```

**Backend:**

```bash
cd backend
npm install

# Copiar y editar variables de entorno
cp .env.example .env
# Editar .env con tu configuración local

npm run migration:run   # Aplicar migraciones
npm run seed            # Cargar preguntas
npm run start:dev       # Servidor en http://localhost:3000
```

**Frontend:**

```bash
cd frontend
npm install
ng serve                # Dev server en http://localhost:4200
```

---

## 5. Variables de Entorno

Archivo: `backend/.env` (desarrollo) / `backend/.env.production` (producción)

| Variable            | Descripción                               | Default dev             |
| ------------------- | ----------------------------------------- | ----------------------- |
| `NODE_ENV`          | Entorno de ejecución                      | `development`           |
| `PORT`              | Puerto del servidor                       | `3000`                  |
| `DATABASE_HOST`     | Host PostgreSQL                           | `localhost`             |
| `DATABASE_PORT`     | Puerto PostgreSQL                         | `5432`                  |
| `DATABASE_NAME`     | Nombre de la BD                           | `voley_app`             |
| `DATABASE_USER`     | Usuario BD                                | `voley_user`            |
| `DATABASE_PASSWORD` | Contraseña BD                             | `voley_pass`            |
| `DB_SYNCHRONIZE`    | TypeORM auto-sync                         | `false`                 |
| `DB_MIGRATIONS_RUN` | Ejecutar migraciones al inicio            | `true`                  |
| `JWT_SECRET`        | Clave secreta JWT (mín. 32 chars en prod) | —                       |
| `JWT_EXPIRES_IN`    | Duración del token                        | `7d`                    |
| `AUTH_COOKIE_NAME`  | Nombre de la cookie JWT                   | `voley_access_token`    |
| `CORS_ORIGINS`      | Orígenes CORS permitidos                  | `http://localhost:4200` |

> **Producción:** `JWT_SECRET` debe tener al menos 32 caracteres. `DB_SYNCHRONIZE` debe ser `false`. La validación en `env.config.ts` rechaza configuraciones inseguras en producción.

---

## 6. Base de Datos

### 6.1 Entidades principales

#### `users`

| Campo           | Tipo           | Notas               |
| --------------- | -------------- | ------------------- |
| `id`            | UUID PK        | Auto-generado       |
| `username`      | VARCHAR UNIQUE | Nombre de usuario   |
| `email`         | VARCHAR UNIQUE | Email               |
| `passwordHash`  | VARCHAR        | bcryptjs, 12 rondas |
| `displayName`   | VARCHAR        | Nombre visible      |
| `avatarEmoji`   | VARCHAR        | Emoji de perfil     |
| `role`          | ENUM           | `player` \| `coach` |
| `totalPoints`   | INT            | Puntos acumulados   |
| `currentStreak` | INT            | Racha de días       |
| `gamesPlayed`   | INT            | Partidas jugadas    |
| `createdAt`     | TIMESTAMP      | Auto                |

#### `game_sessions`

| Campo         | Tipo      | Notas                       |
| ------------- | --------- | --------------------------- |
| `id`          | UUID PK   | —                           |
| `userId`      | UUID FK   | Relación con `users`        |
| `mode`        | ENUM      | `quiz`, `field`, `rotation` |
| `category`    | VARCHAR   | Categoría del quiz          |
| `answers`     | JSONB     | Array de respuestas         |
| `totalScore`  | INT       | Puntos de la sesión         |
| `basePoints`  | INT       | Puntos base                 |
| `timeBonus`   | INT       | Bono por velocidad          |
| `streakBonus` | INT       | Bono por racha              |
| `completed`   | BOOL      | Sesión completada           |
| `createdAt`   | TIMESTAMP | —                           |

#### `questions`

| Campo          | Tipo    | Notas                    |
| -------------- | ------- | ------------------------ |
| `id`           | UUID PK | —                        |
| `category`     | ENUM    | 5 categorías             |
| `difficulty`   | ENUM    | `easy`, `medium`, `hard` |
| `text`         | TEXT    | Enunciado                |
| `options`      | TEXT[]  | 4 opciones               |
| `correctIndex` | INT     | Índice correcto (0-3)    |
| `explanation`  | TEXT    | Explicación opcional     |

#### `formation_zone_configs`

| Campo             | Tipo    | Notas                                 |
| ----------------- | ------- | ------------------------------------- |
| `id`              | UUID PK | —                                     |
| `gameFamily`      | VARCHAR | `field` \| `rotation`                 |
| `system`          | VARCHAR | `K1` \| `K2`                          |
| `idx`             | INT     | Índice del jugador (0-5)              |
| `playerId`        | INT     | ID del jugador                        |
| `x`, `y`          | FLOAT   | Posición en %                         |
| `width`, `height` | FLOAT   | Tamaño en %                           |
| UNIQUE            | —       | `(gameFamily, system, idx, playerId)` |

### 6.2 Migraciones

```bash
# Generar migración (debe correr dentro del contenedor Docker)
docker exec voley_backend sh -c \
  "cd /app && npx typeorm-ts-node-commonjs migration:generate \
   -d src/data-source.ts src/migrations/<NombreMigracion>"

# Aplicar migraciones pendientes
npm run migration:run   # o desde Docker
```

**Archivo DataSource CLI:** `backend/src/data-source.ts`

---

## 7. Backend — NestJS

### 7.1 Estructura de módulos

```
backend/src/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   ├── guards/           # JwtAuthGuard, RolesGuard, OptionalJwtGuard
│   └── decorators/       # @Roles, @CurrentUser
├── users/
├── questions/
├── game-sessions/
│   └── scoring.constants.ts
├── rankings/
├── training/
├── formation-config/
├── common/
│   ├── filters/http-exception.filter.ts
│   └── decorators/current-user.decorator.ts
└── config/
    └── env.config.ts
```

### 7.2 Guards de autorización

| Guard              | Decorador                  | Uso                                 |
| ------------------ | -------------------------- | ----------------------------------- |
| `JwtAuthGuard`     | `@UseGuards(JwtAuthGuard)` | Rutas autenticadas                  |
| `RolesGuard`       | `@Roles('coach')`          | Rutas de entrenador                 |
| `OptionalJwtGuard` | —                          | Rutas públicas con usuario opcional |

### 7.3 Comandos de desarrollo

```bash
npm run start:dev     # Watch mode
npm run build         # Compilar a dist/
npm run start:prod    # Ejecutar compilado
npm run seed          # Cargar preguntas iniciales
npm test              # Jest unit tests
npm run test:cov      # Coverage report
```

---

## 8. Frontend — Angular

### 8.1 Estructura de carpetas

```
frontend/src/app/
├── core/
│   ├── guards/
│   │   ├── auth.guard.ts         # Rutas autenticadas
│   │   └── coach.guard.ts        # Rutas de entrenador
│   ├── interceptors/
│   │   ├── auth.interceptor.ts   # withCredentials: true
│   │   └── error.interceptor.ts  # Manejo centralizado de errores
│   └── services/data-access/    # Un servicio por recurso backend
├── shared/
│   ├── components/navbar/
│   ├── models/                  # Interfaces TypeScript
│   ├── constants/
│   └── utils/
└── features/
    ├── auth/
    ├── dashboard/
    ├── quiz/
    ├── field-challenge/
    ├── rotation/
    ├── ranking/
    └── coach/
```

### 8.2 Path aliases (tsconfig.json)

| Alias         | Ruta                 |
| ------------- | -------------------- |
| `@core/*`     | `src/app/core/*`     |
| `@shared/*`   | `src/app/shared/*`   |
| `@features/*` | `src/app/features/*` |
| `@env/*`      | `src/environments/*` |

### 8.3 Patrón Facade

Cada feature compleja expone un servicio facade que los componentes consumen:

```typescript
// Ejemplo: QuizFacade
@Injectable({ providedIn: "root" })
export class QuizFacade {
  questions$ = this.quizApi.getQuestions();
  // ...state management con BehaviorSubject/RxJS
}
```

### 8.4 Rutas principales

| Ruta                    | Feature            | Guard        |
| ----------------------- | ------------------ | ------------ |
| `/`                     | Landing / redirect | —            |
| `/auth/login`           | Login              | —            |
| `/auth/register`        | Registro           | —            |
| `/dashboard`            | Panel principal    | `AuthGuard`  |
| `/game/quiz`            | Quiz               | `AuthGuard`  |
| `/game/field-challenge` | Desafío de campo   | `AuthGuard`  |
| `/game/rotation`        | Rotaciones         | `AuthGuard`  |
| `/ranking`              | Ranking global     | `AuthGuard`  |
| `/coach`                | Panel entrenador   | `CoachGuard` |

---

## 9. Autenticación y Seguridad

### 9.1 Flujo JWT

1. El usuario hace login → backend valida credenciales.
2. Backend emite JWT y lo almacena en cookie `httpOnly` `Secure` `SameSite=Strict`.
3. El frontend NO accede al token directamente.
4. `auth.interceptor.ts` agrega `withCredentials: true` a todas las peticiones HTTP.
5. El token expira en 7 días (configurable con `JWT_EXPIRES_IN`).

### 9.2 Medidas de seguridad implementadas

| Medida            | Detalle                                               |
| ----------------- | ----------------------------------------------------- |
| Rate limiting     | 120 req/min global, 8 req/min en endpoints de auth    |
| Helmet            | Headers HTTP de seguridad (CSP, HSTS, etc.)           |
| bcryptjs          | 12 rondas de hashing para contraseñas                 |
| CORS              | Solo orígenes configurados en `CORS_ORIGINS`          |
| CSRF              | Verificación de origen en middleware                  |
| Validación de env | `env.config.ts` rechaza config insegura en producción |
| Contenedores      | Usuario no-root `appuser` en Docker                   |

### 9.3 Roles de usuario

| Rol      | Descripción                    | Asignación   |
| -------- | ------------------------------ | ------------ |
| `player` | Rol por defecto al registrarse | Automático   |
| `coach`  | Acceso al panel de entrenador  | Manual en BD |

Para promover un usuario a entrenador:

```sql
UPDATE users SET role = 'coach' WHERE username = 'nombre_usuario';
```

---

## 10. Sistema de Puntuación

Lógica centralizada en `backend/src/game-sessions/scoring.constants.ts`:

```typescript
BASE_POINTS = 100; // Por respuesta correcta
TIME_BONUS = 50; // Si responde en < 10 segundos
STREAK_BONUS = 50; // Por cada racha de 3 correctas
STREAK_BONUS_6 = 100; // Por cada racha de 6 correctas
```

El cálculo ocurre server-side al finalizar una sesión de juego. El frontend no calcula puntos definitivos.

---

## 11. API — Endpoints Principales

Base URL: `http://localhost:3000/api`
Documentación Swagger: `http://localhost:3000/api/docs` (solo en desarrollo)

### Auth

| Método | Endpoint         | Descripción                   |
| ------ | ---------------- | ----------------------------- |
| POST   | `/auth/register` | Registro de usuario           |
| POST   | `/auth/login`    | Login, devuelve cookie JWT    |
| POST   | `/auth/logout`   | Cierra sesión, borra cookie   |
| GET    | `/auth/me`       | Datos del usuario autenticado |

### Users

| Método | Endpoint     | Descripción       |
| ------ | ------------ | ----------------- |
| GET    | `/users/:id` | Perfil de usuario |
| PATCH  | `/users/:id` | Actualizar perfil |

### Questions

| Método | Endpoint         | Descripción                    |
| ------ | ---------------- | ------------------------------ |
| GET    | `/questions`     | Listar preguntas (con filtros) |
| GET    | `/questions/:id` | Pregunta específica            |

### Game Sessions

| Método | Endpoint                      | Descripción             |
| ------ | ----------------------------- | ----------------------- |
| POST   | `/game-sessions`              | Iniciar sesión de juego |
| PATCH  | `/game-sessions/:id/answer`   | Registrar respuesta     |
| POST   | `/game-sessions/:id/complete` | Completar sesión        |

### Rankings

| Método | Endpoint    | Descripción        |
| ------ | ----------- | ------------------ |
| GET    | `/rankings` | Leaderboard global |

### Training

| Método | Endpoint             | Descripción                          |
| ------ | -------------------- | ------------------------------------ |
| POST   | `/training/validate` | Validar posicionamiento en minijuego |

### Formation Config (solo coach)

| Método | Endpoint            | Descripción                        |
| ------ | ------------------- | ---------------------------------- |
| GET    | `/formation-config` | Obtener zonas configuradas         |
| POST   | `/formation-config` | Guardar configuración de formación |

---

## 12. Testing

### 12.1 Ejecutar tests

```bash
cd backend
npm test              # Todos los tests (45 tests, 4 suites)
npm run test:cov      # Con reporte de cobertura
```

### 12.2 Suites de tests

| Archivo                         | Tests | Descripción              |
| ------------------------------- | ----- | ------------------------ |
| `auth.service.spec.ts`          | ~15   | Login, registro, JWT     |
| `users.service.spec.ts`         | ~10   | CRUD usuarios            |
| `game-sessions.service.spec.ts` | ~12   | Sesiones y puntuación    |
| `training.service.spec.ts`      | ~8    | Validación de posiciones |

### 12.3 Patrones de mocking

```typescript
// Mock de repositorio TypeORM
{
  provide: getRepositoryToken(UserEntity),
  useValue: { findOne: jest.fn(), save: jest.fn(), create: jest.fn() }
}

// Mock de transacciones DataSource
{
  provide: DataSource,
  useValue: { transaction: jest.fn((fn) => fn(mockManager)) }
}

// TrainingService sin dependencias
const service = new TrainingService();
```

> Se usa `--forceExit` en Jest para manejar handles abiertos de bcryptjs.

---

## 13. Despliegue en Producción

### 13.1 Pasos

```bash
# 1. Preparar variables de entorno
cp backend/.env.production.example backend/.env.production
# Editar TODOS los valores CHANGE_ME en .env.production

# 2. Levantar con perfil de producción
docker compose --env-file backend/.env.production \
  -f docker-compose.prod.yml up -d

# 3. Aplicar migraciones
docker exec voley_backend npm run migration:run

# 4. Cargar datos iniciales (solo primera vez)
docker exec voley_backend npm run seed
```

### 13.2 Checklist de producción

- [ ] `JWT_SECRET` con al menos 32 caracteres aleatorios
- [ ] `DB_SYNCHRONIZE=false`
- [ ] `NODE_ENV=production`
- [ ] `CORS_ORIGINS` solo con el dominio real
- [ ] Certificado SSL/TLS configurado en el proxy inverso (nginx/caddy)
- [ ] Backups automáticos de PostgreSQL configurados
- [ ] Volúmenes Docker nombrados para persistencia de datos

---

## 14. Monitorización y Logs

- **Logs de aplicación:** `docker-compose logs -f voley_backend`
- **Logs de base de datos:** `docker-compose logs -f voley_db`
- **Health check:** `GET /api/health` (si implementado)
- **Swagger:** `GET /api/docs` (solo `NODE_ENV=development`)

El filtro global `HttpExceptionFilter` en `common/filters/` captura y normaliza todos los errores HTTP.

---

## 15. Diagrama de Entidades

```
┌──────────────────┐       ┌──────────────────────┐
│      users       │       │    game_sessions      │
├──────────────────┤       ├──────────────────────┤
│ id (UUID PK)     │◄──────│ userId (UUID FK)      │
│ username         │       │ id (UUID PK)          │
│ email            │       │ mode (ENUM)           │
│ passwordHash     │       │ category              │
│ displayName      │       │ answers (JSONB)       │
│ avatarEmoji      │       │ totalScore            │
│ role (ENUM)      │       │ completed             │
│ totalPoints      │       │ createdAt             │
│ currentStreak    │       └──────────────────────┘
│ gamesPlayed      │
└──────────────────┘

┌──────────────────┐       ┌─────────────────────────────┐
│   questions      │       │   formation_zone_configs     │
├──────────────────┤       ├─────────────────────────────┤
│ id (UUID PK)     │       │ id (UUID PK)                 │
│ category (ENUM)  │       │ gameFamily                   │
│ difficulty       │       │ system                       │
│ text             │       │ idx                          │
│ options (TEXT[]) │       │ playerId                     │
│ correctIndex     │       │ x, y, width, height (FLOAT)  │
│ explanation      │       │ UNIQUE(gameFamily,system,    │
└──────────────────┘       │         idx,playerId)        │
                           └─────────────────────────────┘
```

---

## 16. Accesibilidad (MVP/Beta)

### 16.1 Implementación realizada

- `frontend/src/app/app.component.html`:
  - enlace de salto (`skip link`) a `#main-content`.
  - regiones `main` con `id="main-content"`.
  - botones de cierre de alerta con `aria-label`.
- `frontend/src/app/shared/components/navbar/navbar.component.html`:
  - `nav` con `aria-label`.
  - botones de menú con `aria-haspopup`, `aria-controls`, `aria-expanded`.
  - estructura usable por teclado en submenús.
- `frontend/src/styles.scss`:
  - estilo global de `:focus-visible`.
  - clase utilitaria `.sr-only`.
  - soporte de `prefers-reduced-motion: reduce`.
- `frontend/src/index.html`:
  - idioma `lang="es-ES"`.
  - meta descripción.

### 16.2 Criterios de validación manual (beta)

1. Completar navegación de login, dashboard, juegos y coach usando solo teclado.
2. Confirmar foco visible en todos los controles interactivos.
3. Verificar que el menú principal se puede abrir y recorrer sin ratón.
4. Revisar que los mensajes globales de error son cerrables por teclado.

### 16.3 Pendiente para producción

- Auditoría WCAG 2.2 AA completa.
- Integración de pruebas automáticas de accesibilidad en CI (axe/lighthouse-ci).
- Revisión específica de minijuegos drag & drop para lectores de pantalla.

---

_VoleyPlay — Manual Técnico v1.0 — Febrero 2026_
_© 2026 Abdón Hernández Perera. Todos los derechos reservados._
