# Mahjong Scorer - Design System v1.0 🀄💎

Este documento define las reglas visuales innegables para mantener la consistencia en todas las páginas del proyecto.

## 🎨 Paleta de Colores
- **Fondo (BG):** `#121212` (Oscuro profundo)
- **Superficie (Card):** `#1e1e1e` (Gris oscuro elevado)
- **Primario:** `#00c853` (Verde esmeralda vibrante)
- **Texto Principal:** `#e0e0e0`
- **Texto Dim:** `#9e9e9e` (Para etiquetas y secundarios)
- **Peligro:** `#ff5252` (Rojo para errores/grabación)
- **Borde:** `rgba(255,255,255,0.1)`

## 📐 Estructura (Layout)
- **Contenedor:** Siempre centrado, `max-width: 500px` (o `900px` para tablas de datos como Torneos).
- **Tarjetas:** `border-radius: 32px`, padding generoso, sombra suave.
- **Botones:** Redondeados (`12px` - `16px`), fuente `800` (extra bold).

## 🧭 Navegación Unificada
El encabezado debe ser idéntico en todas las páginas:
- **Logo:** `<span>🀄</span> Mahjong Scorer` (H1, 1.5rem, Primario).
- **Menú:** 
    - `reglas.html` (Reglas)
    - `jugadas.html` (Jugadas)
    - `pairings.html` (Torneo)
    - **Highlight:** La página actual debe tener `color: var(--primary)` y `font-weight: 800`.

## 📱 Responsividad
- Móviles: Padding lateral de `10px-20px`.
- Escritorio: Centrado absoluto.
- Evitar Sidebars: Todo fluye en una sola columna.
