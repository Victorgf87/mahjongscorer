# Mahjong Scorer - Engram Export (Security Cleaned)

## 🏗️ Arquitectura del Sistema
- **Stack:** Cloudflare Pages (Frontend) + Cloudflare Pages Functions (Backend).
- **IA Cerebro:** Google Gemini (Tier de Pago habilitado para modelos PRO y Flash).
- **Procesamiento de Voz:** Uso nativo de Gemini Multimodal (v1beta). Evita servicios STT externos como Whisper.
- **Formato Audio:** Grabación en `.webm` (estándar de navegador) enviada en Base64.

## ⚖️ Reglas de Arbitraje
- **Sistemas Soportados:** Riichi Mahjong (EMA/JPML) y MCR (Chinese Official).
- **Base de Conocimiento:** Archivo `mahjong_rules.md` inyectado en System Instructions para garantizar precisión matemática.
- **Validación Lógica:** El bot actúa como árbitro crítico, corrigiendo jugadas imposibles (ej: All Pungs con Outside Hand).

## 🚀 Despliegue y Operaciones
- **Rama de Producción:** Fijada en `production` para el dominio raíz.
- **Centralización de Logs:** Integración con Grafana Loki para trazabilidad completa (Modelo, Input, Output).
- **Seguridad de Secretos:** Uso de Master Key + `credentials.enc` (AES-256).

## 💰 Monetización y Apoyo
- **Ko-fi:** Integración del Tip Panel oficial en la barra lateral.
- **AdSense:** Configurado con `ads.txt`, `robots.txt` y contenido SEO específico para aprobación de Google.
- **Tono:** Uso de fórmulas de cortesía condicionales ("Si te ha servido, puedes...") para evitar un tono agresivo.

## 🛠️ Key Learnings
- Cloudflare Pages Functions requiere exportar `onRequestPost` (no `fetch` como los Workers).
- Los modelos experimentales (2.5 Flash/Pro) pueden alucinar en cálculos matemáticos específicos; `gemini-flash-latest` es el más fiable para reglas fijas.
- El uso de `waitUntil` es crítico para asegurar que los logs lleguen a Grafana sin retrasar la respuesta al usuario.
