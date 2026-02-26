# 🏐 VoleyPlay — Aprende Voleibol Jugando

Aplicación fullstack interactiva para enseñar voleibol a jugadores de iniciación (Infantil/Alevín). Incluye quiz, drag & drop en campo, simulador de rotaciones K1/K2, ranking global y panel del entrenador.

---

## 🚀 Arrancar con Docker (más fácil)

Necesitas tener instalado **Docker Desktop**.

```bash
# 1. Entra en la carpeta del proyecto
cd voley-app

# 2. Levanta todo (PostgreSQL + Backend + Frontend)
docker-compose up -d

# 3. Espera ~30 segundos y abre:
#    Frontend  →  http://localhost:4200
#    API       →  http://localhost:3000/api
```

Para parar:

```bash
docker-compose down
```

---

## 💻 Arrancar en local (sin Docker)

### Requisitos

- Node.js 20+
- PostgreSQL 14+ corriendo localmente
- Angular CLI 19: `npm install -g @angular/cli`

### 1. Base de datos

Crea una base de datos PostgreSQL:

```sql
CREATE DATABASE voley_app;
CREATE USER voley_user WITH PASSWORD 'voley_pass';
GRANT ALL PRIVILEGES ON DATABASE voley_app TO voley_user;
```

O usa Docker solo para la BD:

```bash
docker run -d --name voley_db \
  -e POSTGRES_DB=voley_app \
  -e POSTGRES_USER=voley_user \
  -e POSTGRES_PASSWORD=voley_pass \
  -p 5432:5432 postgres:16-alpine
```

### 2. Backend

```bash
cd backend
npm install
npm run start:dev
# API disponible en http://localhost:3000/api
# Las preguntas se cargan automáticamente al arrancar
```

### 3. Frontend

```bash
cd frontend
npm install
ng serve
# App disponible en http://localhost:4200
```

---

## 🎮 Modos de juego

| Modo              | Ruta                    | Descripción                             |
| ----------------- | ----------------------- | --------------------------------------- |
| **Quiz**          | `/game/quiz`            | Preguntas con timer y sistema de rachas |
| **Reto de Campo** | `/game/field-challenge` | Drag & drop de jugadores al campo       |
| **Rotaciones**    | `/game/rotation`        | Simulador visual de K1 y K2             |
| **Ranking**       | `/ranking`              | Clasificación global del equipo         |

La autenticación usa cookie `httpOnly` segura (sin token en `localStorage`).

---

## 👤 Roles de usuario

- **`player`** — Jugador normal. Accede a los 3 modos de juego y el ranking.
- **`coach`** — Entrenador. Además accede al panel con estadísticas de todos los jugadores.

Al registrarte, el rol siempre es `player`. El rol `coach` solo debe asignarse desde backend/base de datos por un administrador.

---

## ⭐ Sistema de puntuación

| Acción                       | Puntos   |
| ---------------------------- | -------- |
| Respuesta correcta           | +100 pts |
| Bonus rapidez (< 10 seg)     | +50 pts  |
| Racha de 3 aciertos seguidos | +50 pts  |
| Racha de 6 aciertos seguidos | +100 pts |
| Tiempo agotado / error       | 0 pts    |

---

## 📚 Contenido incluido (banco de preguntas)

El backend carga automáticamente **28 preguntas** organizadas en 5 categorías:

- 🔄 **Rotaciones K1** — 5 preguntas (fácil → difícil)
- 🛡️ **Rotaciones K2** — 4 preguntas
- 👥 **Posiciones y Roles** — 6 preguntas
- 🎯 **Sistemas de Juego** — 6 preguntas
- 📋 **Reglas Básicas** — 7 preguntas

---

## 🗂️ Estructura del proyecto

```
voley-app/
├── docker-compose.yml
├── backend/                  ← NestJS API
│   └── src/
│       ├── auth/             ← JWT auth, guards
│       ├── users/            ← Usuarios y estadísticas
│       ├── questions/        ← Banco de preguntas + seed
│       ├── game-sessions/    ← Sesiones y puntuación
│       ├── training/         ← Validación backend de minijuegos
│       └── rankings/         ← Clasificación
└── frontend/                 ← Angular 19
    └── src/app/
        ├── core/             ← Servicios, guards, interceptors
        ├── shared/           ← Navbar, modelos
        └── features/
            ├── auth/         ← Login y Registro
            ├── dashboard/    ← Pantalla principal
            ├── game/         ← Quiz, Campo, Rotaciones
            ├── ranking/      ← Clasificación
            └── coach/        ← Panel del entrenador
```

---

## ♿ Accesibilidad (MVP/Beta)

Se han aplicado mejoras base para navegación por teclado y semántica:

- `skip link` al contenido principal.
- foco visible global en elementos interactivos.
- navegación principal con ARIA y uso por teclado.
- soporte `prefers-reduced-motion`.

Documentación específica:

- `docs/accesibilidad.md`
- `docs/manual_usuario.md`
- `docs/manual_tecnico.md`

---

## © Copyright

© 2026 Abdón Hernández Perera. Todos los derechos reservados.

---

## 🔧 Variables de entorno del backend

El backend las lee de las variables del sistema o del `docker-compose.yml`:

```env
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=voley_app
DATABASE_USER=voley_user
DATABASE_PASSWORD=voley_pass
DB_SYNCHRONIZE=true
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=false
JWT_SECRET=dev_only_change_this_jwt_secret
JWT_EXPIRES_IN=7d
JWT_ISSUER=voley-app-backend
JWT_AUDIENCE=voley-app-clients
AUTH_COOKIE_NAME=voley_access_token
BCRYPT_ROUNDS=12
CORS_ORIGINS=http://localhost:4200,http://localhost:80
RATE_LIMIT_GLOBAL_TTL_MS=60000
RATE_LIMIT_GLOBAL_LIMIT=120
RATE_LIMIT_AUTH_TTL_MS=60000
RATE_LIMIT_AUTH_LIMIT=8
PORT=3000
```

## 🔐 Producción segura

1. Copia `.env.production.example` a `.env.production` y cambia todos los valores `CHANGE_ME`.
2. No uses `docker-compose.yml` para producción; usa `docker-compose.prod.yml`.
3. Mantén `DB_SYNCHRONIZE=false` en producción.
4. Usa un `JWT_SECRET` fuerte y único por entorno.
5. Limita `CORS_ORIGINS` a tu dominio real (sin `localhost`).
6. Levanta producción con:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

---

## 🗺️ Próximas mejoras sugeridas

- [ ] Editor de preguntas para el entrenador desde la UI
- [ ] Modo contrarreloj con ranking semanal
- [ ] Exportar informe PDF del progreso del equipo
- [ ] Animación de campo al rotar
- [ ] PWA para instalar en móvil
- [ ] Modo multijugador en tiempo real (WebSockets)
