# VoleyPlay — Frontend

© 2026 Abdón Hernández Perera. Todos los derechos reservados.

Aplicación Angular 19 para el aprendizaje interactivo de voleibol. Orientada a jugadores principiantes (equipos juveniles) con quiz, minijuegos de arrastrar-y-soltar, simuladores de rotación y panel de entrenador.

---

## Stack

| Tecnología             | Versión |
| ---------------------- | ------- |
| Angular                | 19      |
| Angular Material / CDK | 19      |
| RxJS                   | ~7.8    |
| TypeScript             | ~5.6    |
| Socket.IO client       | ^4.8    |

Todos los componentes son **standalone** con `ChangeDetectionStrategy.OnPush`.

---

## Estructura de carpetas

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                        # Servicios singleton, guards, interceptores
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts        # Protege rutas autenticadas
│   │   │   │   └── coach.guard.ts       # Restringe /coach a rol coach
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts  # withCredentials en todas las peticiones
│   │   │   │   └── error.interceptor.ts # Manejo centralizado de errores HTTP
│   │   │   └── services/
│   │   │       ├── auth.service.ts
│   │   │       ├── notification.service.ts
│   │   │       ├── http-error.service.ts
│   │   │       └── data-access/         # Un servicio API por recurso backend
│   │   │           ├── formation-config-api.service.ts
│   │   │           ├── training-api.service.ts
│   │   │           └── ...
│   │   ├── shared/                      # Modelos TS, componentes reutilizables
│   │   │   ├── models/
│   │   │   │   ├── auth.model.ts
│   │   │   │   ├── formation-config.model.ts
│   │   │   │   ├── training.model.ts
│   │   │   │   └── index.ts
│   │   │   └── components/
│   │   │       └── navbar/
│   │   └── features/                    # Una carpeta por feature (ui/, domain/)
│   │       ├── auth/
│   │       ├── dashboard/
│   │       ├── game/
│   │       │   ├── quiz/
│   │       │   ├── field-challenge/
│   │       │   ├── rotation-sim/
│   │       │   ├── role-reception/
│   │       │   ├── role-defense/
│   │       │   └── duel/
│   │       ├── coach/
│   │       │   └── ui/
│   │       │       ├── coach.component.*
│   │       │       └── formation-editor/   # Editor interactivo de zonas
│   │       ├── ranking/
│   │       ├── rewards/
│   │       └── profile/
│   ├── environments/
│   └── proxy.conf.json                  # /api/* → localhost:3000
└── package.json
```

### Aliases de path (`tsconfig.json`)

| Alias         | Ruta                 |
| ------------- | -------------------- |
| `@core/*`     | `src/app/core/*`     |
| `@shared/*`   | `src/app/shared/*`   |
| `@features/*` | `src/app/features/*` |
| `@env/*`      | `src/environments/*` |

---

## Rutas

| Ruta                    | Componente              | Guards                 |
| ----------------------- | ----------------------- | ---------------------- |
| `/`                     | → `/dashboard`          | —                      |
| `/auth/login`           | AuthComponent           | —                      |
| `/auth/register`        | AuthComponent           | —                      |
| `/dashboard`            | DashboardComponent      | authGuard              |
| `/game/quiz`            | QuizComponent           | authGuard              |
| `/game/field-challenge` | FieldChallengeComponent | authGuard              |
| `/game/rotation`        | RotationSimComponent    | authGuard              |
| `/game/role-reception`  | RoleReceptionComponent  | authGuard              |
| `/game/role-defense`    | RoleDefenseComponent    | authGuard              |
| `/game/duel`            | DuelComponent           | authGuard              |
| `/rewards`              | RewardsComponent        | authGuard              |
| `/ranking`              | RankingComponent        | authGuard              |
| `/profile`              | ProfileComponent        | authGuard              |
| `/coach`                | CoachComponent          | authGuard + coachGuard |
| `**`                    | → `/dashboard`          | —                      |

Todas las rutas de juego y protegidas se cargan con lazy loading (`loadComponent`).

---

## Minijuegos

### Simulador de Recepción (`/game/rotation`)

Elige sistema de juego (5-1, 4-2, 6-2), coloca 6 fichas de jugadores en la cancha en la rotación correcta. Arrastra o toca para posicionar. El backend valida si cada jugador está dentro del rectángulo de zona configurado.

**Estado del componente:** `selecting → setup → playing → checked → finished`
**Bloqueo:** si el entrenador no ha configurado las zonas, muestra pantalla `not-configured`.

### Defensa por Zona (`/game/field-challenge`)

Coloca los 6 jugadores en posición defensiva según la zona de ataque rival. 3 escenarios, sistema 5-1. Validación rectangular igual que recepción.

### Recepción por Rol (`/game/role-reception`)

Modo individual: el jugador elige su posición (Colocador, Central 1/2, Receptor 1/2, Opuesto) y debe colocarse correctamente en las 6 rotaciones. Puntúa con valor reducido por ser modo individual.

### Defensa por Rol (`/game/role-defense`)

Modo individual para defensa: elige posición y resuelve los 3 escenarios de defensa para esa posición.

### Quiz (`/game/quiz`)

Preguntas de opción múltiple con bonus de velocidad y rachas. 28 preguntas semilladas en 5 categorías.

### Duelo (`/game/duel`)

Partida en tiempo real contra otro jugador vía WebSocket (Socket.IO).

---

## Panel del Entrenador (`/coach`)

Accesible solo con rol `coach`. Tabs disponibles:

| Tab          | Ícono     | Descripción                         |
| ------------ | --------- | ----------------------------------- |
| Jugadores    | people    | Listado y asignaciones de jugadores |
| Estadísticas | bar_chart | Métricas del equipo                 |
| Formaciones  | grid_on   | **Editor interactivo de zonas**     |

### Tab Formaciones — Editor de Zonas

El entrenador define rectángulos de zona válida por jugador, por rotación/escenario, para cada sistema de juego.

**Juegos configurables:**

| Clave           | Sistema       | Rotaciones/Escenarios | Registros requeridos |
| --------------- | ------------- | --------------------- | -------------------- |
| `reception_5_1` | Recepción 5-1 | 6 rotaciones          | 36                   |
| `reception_4_2` | Recepción 4-2 | 6 rotaciones          | 36                   |
| `reception_6_2` | Recepción 6-2 | 6 rotaciones          | 36                   |
| `defense`       | Defensa       | 3 escenarios          | 18                   |

**Componente `FormationEditorComponent`:**

- Renderiza una cancha con zonas como rectángulos coloreados (coordenadas 0–100%)
- Drag nativo (sin CDK): mover el rectángulo completo arrastrando el token central
- 4 handles en esquinas para redimensionar (modo `resize-tl/tr/bl/br`)
- Soporte táctil completo (touchstart/move/end)
- Tamaño mínimo de zona: 5% × 5%
- Si no hay zonas guardadas, genera defaults en cuadrícula 3×2

**Roles por sistema (colores diferenciados):**

- `5-1` y `defense`: Colocador (rojo), Central 1/2 (azul), Receptor 1/2 (verde), Opuesto (rojo oscuro)
- `4-2` y `6-2`: Colocador 1/2 (rojo), Receptor 1/2 (verde), Central 1/2 (azul)

---

## Autenticación

JWT almacenado exclusivamente en cookie `httpOnly` (`voley_access_token`). El interceptor `auth.interceptor.ts` añade `withCredentials: true` a todas las peticiones. No se usa localStorage para tokens.

---

## Proxy de desarrollo

`proxy.conf.json` redirige `/api/*` → `http://localhost:3000` durante `ng serve`.

---

## Comandos

```bash
npm install           # Instalar dependencias
ng serve              # Servidor dev (http://localhost:4200)
ng build              # Build de producción (dist/)
ng build --watch      # Build incremental
```

---

## Variables de entorno

Los entornos se configuran en `src/environments/`:

```typescript
// environment.ts (development)
export const environment = {
  production: false,
  apiUrl: "/api", // proxied por proxy.conf.json
};
```

En producción, `apiUrl` debe apuntar al backend real.
