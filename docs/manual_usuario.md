# VoleyPlay — Manual de Usuario

**Versión:** 1.0
**Fecha:** Febrero 2026
**Audiencia:** Jugadores principiantes y entrenadores de voleibol

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Requisitos del Sistema](#2-requisitos-del-sistema)
3. [Registro e Inicio de Sesión](#3-registro-e-inicio-de-sesión)
4. [Panel Principal (Dashboard)](#4-panel-principal-dashboard)
5. [Modos de Juego](#5-modos-de-juego)
   - 5.1 [Quiz de Preguntas](#51-quiz-de-preguntas)
   - 5.2 [Desafío de Campo](#52-desafío-de-campo)
   - 5.3 [Simulador de Rotaciones](#53-simulador-de-rotaciones)
6. [Ranking Global](#6-ranking-global)
7. [Perfil de Usuario](#7-perfil-de-usuario)
8. [Panel de Entrenador](#8-panel-de-entrenador)
9. [Sistema de Puntuación](#9-sistema-de-puntuación)
10. [Preguntas Frecuentes](#10-preguntas-frecuentes)
11. [Accesibilidad](#11-accesibilidad)

---

## 1. Introducción

**VoleyPlay** es una aplicación educativa diseñada para jugadores principiantes de voleibol, especialmente equipos juveniles. A través de minijuegos interactivos, desafíos de campo y simuladores de rotación, los jugadores aprenden las reglas, tácticas y posicionamiento del voleibol de una manera entretenida y competitiva.

### Características principales

- Quizzes de preguntas sobre voleibol (28 preguntas en 5 categorías)
- Desafío de posicionamiento en cancha con drag & drop
- Simulador de rotaciones K1 y K2
- Ranking global en tiempo real
- Panel exclusivo para entrenadores con editor de formaciones

---

## 2. Requisitos del Sistema

| Requisito   | Detalle                                          |
| ----------- | ------------------------------------------------ |
| Navegador   | Chrome 110+, Firefox 115+, Edge 110+, Safari 16+ |
| Conexión    | Internet estable (mínimo 1 Mbps)                 |
| Dispositivo | PC, tablet o smartphone (diseño responsivo)      |
| Resolución  | Mínimo 360 × 640 px recomendado                  |

> No se requiere instalación de software adicional. La aplicación corre completamente en el navegador.

---

## 3. Registro e Inicio de Sesión

### 3.1 Crear una cuenta nueva

1. Abre la aplicación en tu navegador.
2. Haz clic en **"Registrarse"** en la pantalla de bienvenida.
3. Completa el formulario:
   - **Nombre de usuario** — único, sin espacios (ej: `jugador23`)
   - **Correo electrónico** — dirección válida
   - **Contraseña** — mínimo 8 caracteres
4. Haz clic en **"Crear cuenta"**.
5. Serás redirigido automáticamente al panel principal.

### 3.2 Iniciar sesión

1. Ingresa tu **correo electrónico** y **contraseña**.
2. Haz clic en **"Iniciar sesión"**.
3. La sesión se mantiene activa durante 7 días sin necesidad de volver a ingresar credenciales.

### 3.3 Cerrar sesión

- Haz clic en tu avatar/nombre en la barra de navegación y selecciona **"Cerrar sesión"**.

---

## 4. Panel Principal (Dashboard)

Al iniciar sesión verás tu panel personal con:

| Sección              | Descripción                                |
| -------------------- | ------------------------------------------ |
| **Puntos totales**   | Suma de todos los puntos ganados           |
| **Racha actual**     | Días consecutivos con al menos una partida |
| **Partidas jugadas** | Total de sesiones completadas              |
| **Acceso rápido**    | Botones directos a los tres modos de juego |

---

## 5. Modos de Juego

### 5.1 Quiz de Preguntas

**Ruta:** `/game/quiz`

El modo quiz te presenta preguntas de opción múltiple sobre voleibol organizadas en 5 categorías:

- Reglas del juego
- Técnica individual
- Tácticas de equipo
- Posiciones y roles
- Historia del voleibol

#### Cómo jugar

1. Selecciona una **categoría** (o "Aleatorio" para mezclar todas).
2. Lee la pregunta y elige una de las 4 opciones disponibles.
3. Tienes **30 segundos** por pregunta.
4. Al finalizar la sesión (10 preguntas) verás tu puntaje y un resumen.

#### Consejos

- Responde rápido: si contestas en menos de 10 segundos ganas un **bono de velocidad** (+50 pts).
- Mantén rachas correctas: 3 respuestas seguidas correctas dan un **bono de racha** (+50 pts).

---

### 5.2 Desafío de Campo

**Ruta:** `/game/field-challenge`

En este modo debes posicionar a los jugadores en las zonas correctas de la cancha.

#### Cómo jugar

1. Verás una cancha de voleibol con jugadores numerados (1–6).
2. Arrastra y suelta cada jugador en su zona correcta.
3. Cuando estés listo, haz clic en **"Validar"**.
4. El sistema evaluará si cada jugador está en la posición correcta.

> **Nota:** Si el entrenador aún no ha configurado las zonas de formación, verás el mensaje "Formación no configurada" y deberás esperar a que el entrenador la active.

---

### 5.3 Simulador de Rotaciones

**Ruta:** `/game/rotation`

Aprende los patrones de rotación K1 (recepción) y K2 (defensa) del voleibol.

#### Cómo jugar

1. Selecciona el sistema de juego: **K1** o **K2**.
2. El simulador muestra la cancha con jugadores en posición inicial.
3. Observa la rotación propuesta y responde si es **correcta o incorrecta**.
4. Avanza por las rondas acumulando puntos.

---

## 6. Ranking Global

**Ruta:** `/ranking`

La tabla de clasificación global muestra todos los jugadores registrados ordenados por puntos totales.

| Columna  | Descripción                     |
| -------- | ------------------------------- |
| Posición | Lugar en el ranking (#1, #2, …) |
| Avatar   | Emoji de perfil del jugador     |
| Nombre   | Nombre de usuario               |
| Puntos   | Total de puntos acumulados      |
| Racha    | Racha de días activos           |

> Tu posición aparece resaltada para identificarla fácilmente.

---

## 7. Perfil de Usuario

Desde tu perfil puedes:

- Cambiar tu **nombre para mostrar** (displayName)
- Elegir un **emoji de avatar** personalizado
- Ver tu historial de partidas

> La contraseña y el correo electrónico no se pueden modificar desde la interfaz en esta versión.

---

## 8. Panel de Entrenador

**Ruta:** `/coach`
**Acceso:** Solo usuarios con rol `coach` (asignado por el administrador)

### 8.1 Gestión de formaciones

En la pestaña **"Formaciones"** el entrenador puede:

1. Seleccionar el **modo de juego** (Field Challenge o Rotation).
2. Seleccionar el **sistema de rotación** (K1 / K2).
3. Usar el editor visual para definir las **zonas de posicionamiento** de cada jugador:
   - Arrastra los rectángulos para reposicionar la zona.
   - Redimensiona los rectángulos desde las esquinas.
4. Guardar la configuración con **"Guardar formación"**.

### 8.2 Estadísticas de jugadores

Visualiza el rendimiento del equipo: puntos, rachas, partidas completadas por jugador.

---

## 9. Sistema de Puntuación

| Evento                                | Puntos |
| ------------------------------------- | ------ |
| Respuesta correcta                    | +100   |
| Bono de velocidad (< 10 s)            | +50    |
| Bono de racha (cada 3 correctas)      | +50    |
| Racha extendida (cada 6 correctas)    | +100   |
| Respuesta incorrecta o tiempo agotado | 0      |

Los puntos se acumulan permanentemente en tu perfil y se reflejan en el ranking global.

---

## 10. Preguntas Frecuentes

**¿Puedo jugar sin registrarme?**
No. Es necesario crear una cuenta para registrar tu progreso y aparecer en el ranking.

**¿Perdí mi contraseña, qué hago?**
En esta versión no hay recuperación de contraseña automática. Contacta al administrador.

**¿Por qué no aparece la formación en el Desafío de Campo?**
El entrenador aún no ha configurado las zonas. Pide al entrenador que acceda al panel y configure la formación.

**¿Los puntos se pueden perder?**
No. Los puntos son acumulativos. Solo dejan de crecer si no juegas.

**¿La aplicación funciona en el móvil?**
Sí. La interfaz es responsiva y funciona en smartphones modernos. Se recomienda orientación horizontal para el editor de formaciones.

**¿Quién puede tener rol de entrenador?**
El rol `coach` es asignado manualmente por el administrador de la base de datos. No hay formulario de solicitud en la aplicación.

---

## 11. Accesibilidad

La versión MVP/Beta incluye medidas base para mejorar la usabilidad:

- Navegación por teclado (`Tab`, `Shift+Tab`, `Enter`, `Espacio`).
- Enlace de salto al contenido principal al inicio de la app.
- Indicadores visibles de foco en botones, enlaces y formularios.
- Menú de navegación con etiquetas ARIA para lectores de pantalla.
- Reducción de animaciones si el dispositivo activa `prefers-reduced-motion`.

Guía técnica detallada:

- `docs/accesibilidad.md`

Si detectas barreras de uso (por ejemplo, en minijuegos concretos), notifícalas al entrenador o equipo técnico para priorizar su mejora.

---

_VoleyPlay — Aprende voleibol jugando_
_Versión 1.0 — Febrero 2026_
_© 2026 Abdón Hernández Perera. Todos los derechos reservados._
