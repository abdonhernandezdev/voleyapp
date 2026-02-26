# VoleyPlay — Guía de Accesibilidad (MVP/Beta)

## Objetivo

Definir el nivel de accesibilidad cubierto en la versión MVP/Beta y las mejoras previstas para producción.

© 2026 Abdón Hernández Perera. Todos los derechos reservados.

## Alcance actual (implementado)

### Navegación por teclado

- Enlace de salto al contenido principal (`Saltar al contenido principal`) al inicio de la aplicación.
- Navegación principal usable con teclado:
  - Menú principal accesible con `Tab`.
  - Submenús de juegos abiertos por foco (`:focus-within`) y usables con teclado.
- Botones críticos con `type="button"` para evitar envíos accidentales de formularios.

### Semántica y ARIA

- Documento con `lang="es-ES"`.
- Regiones principales con elementos semánticos (`header`, `nav`, `main`, `aside`).
- Navegaciones con `aria-label`.
- Botones de cierre/menú con `aria-label`.
- Alertas globales con `role="alert"`.

### Visibilidad de foco

- Estilo global `:focus-visible` para enlaces, botones, inputs, selects y elementos focusables.
- Contraste visual reforzado para el foco con `outline` y `outline-offset`.

### Preferencias del usuario

- Soporte para `prefers-reduced-motion: reduce` para reducir animaciones/transiciones.

## Checklist rápida de QA manual (beta)

1. Navegar toda la app usando solo teclado (`Tab`, `Shift+Tab`, `Enter`, `Espacio`).
2. Confirmar que el foco siempre es visible.
3. Validar uso del `skip link` en login y dashboard.
4. Revisar que los mensajes de error globales se anuncian y se pueden cerrar por teclado.
5. Comprobar en móvil y escritorio el menú de navegación.

## Limitaciones conocidas en Beta

- No se ha completado una auditoría WCAG 2.2 AA de extremo a extremo con evidencia formal.
- Algunas vistas complejas de minijuegos pueden requerir mejoras adicionales de lectura para lectores de pantalla.
- No se han añadido atajos de teclado específicos por juego.

## Objetivo para producción

- Auditoría completa WCAG 2.2 AA.
- Tests automatizados de accesibilidad (axe/lighthouse-ci) en CI.
- Revisión de contrastes y etiquetas en todos los componentes de minijuegos.
